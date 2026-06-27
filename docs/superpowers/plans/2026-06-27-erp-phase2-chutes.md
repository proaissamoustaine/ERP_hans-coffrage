# Module Chutes (chutothèque) — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Porter le module Chutes de la maquette en module réel (data Supabase) fidèle au pixel, avec déclaration/réutilisation offline-ready et historique fidèle (migration).

**Architecture:** `src/modules/chutes/` (route `/chutes`). Couche pure `chutesData.ts` (valorisation, filtres) + `useChutes.ts` (liste) + mutations branchées sur le socle offline (`src/lib/offlineMutations.ts` : defaults `declarer-chute`/`reutiliser-chute`, idempotence id client). UI `ChutesPage.tsx` = port fidèle de `PageChutes` (maquette `hans-erp-deploy/src/App.jsx` l.5159-5380). Migration : colonnes d'historique. Realtime sur `chutes`.

**Tech Stack:** React 19 + TS strict + Vite 8 + @tanstack/react-query 5.101 + Supabase JS. Tests : Vitest 4. Gestionnaire : pnpm.

**Spec:** `docs/superpowers/specs/2026-06-27-erp-phase2-chutes-design.md`

**Rappels projet :**
- Base quasi vide : table `chutes` **vide** ; affaire démo `C26-0701-01` (BOUYGUES) disponible comme affaire origine/destination de test.
- Piège CI : tests passent **sans** `.env.local` (env via `vite.config.ts`). Modèle de mock supabase : `src/modules/affaires/affaires.fetch.test.ts`.
- `pnpm build` = `tsc -b && vite build` (compile les tests). Commandes : `pnpm test`, `pnpm test -- <f>`, `pnpm lint`, `pnpm exec tsc --noEmit`.
- Prose/commits en FRANÇAIS. Warnings `react-refresh` pré-existants tolérés (exit 0) ; pas d'erreur.
- Socle offline : `setMutationDefaults` dans `offlineMutations.ts` (enregistré au boot par `registerOfflineMutationDefaults` dans `main.tsx`) ; idempotence via `id` uuid client + upsert `onConflict:'id', ignoreDuplicates:true`. Le rejeu au retour réseau exige le **focus** de l'onglet (cf. mémoire `verif-preview-headless-focus`).
- Cascade catalogue réutilisable : `src/modules/formulaire/catalogue.ts` (`categories`/`famillesFor`/`matieresFor`) + `useCatalogue()` (`src/modules/formulaire/useCatalogue.ts`).

---

## File Structure

| Fichier | Responsabilité |
|---|---|
| `src/modules/chutes/chutesData.ts` (créer) | Pur : `surfaceM2`, `valoriserChute`, filtres dispo/consommées, `valeurTotale`, `catsPresentes` |
| `src/modules/chutes/chutesData.test.ts` (créer) | Tests unitaires |
| `src/modules/chutes/useChutes.ts` (créer) | `useChutes()` + `useDeclarerChute()`/`useReutiliserChute()` (via mutationKey) |
| `src/modules/chutes/useChutes.fetch.test.ts` (créer) | Test fetch |
| `src/lib/offlineMutations.ts` (modifier) | + `DeclarerChuteInput`/`ReutiliserChuteVars`, `insertChute`/`reutiliserChuteDb`, defaults |
| `src/lib/offlineMutations.fetch.test.ts` (modifier) | + tests chutes |
| `src/modules/chutes/ChutesPage.tsx` (créer) | UI port fidèle |
| `src/modules/chutes/ChutesPage.test.tsx` (créer) | Smoke |
| `src/App.tsx` (modifier) | route `/chutes` + `BUILT_IDS` |
| migration `chutes` (MCP) + `src/lib/database.types.ts` régénéré |

---

## Task 1: Migration `chutes` + régénération des types

**Files:** migration (MCP) ; `src/lib/database.types.ts` (régénéré).

- [ ] **Step 1: Vérifier les colonnes actuelles**

Via MCP `execute_sql` (projet `qjmofktujdyxlmvzoklh`) :
```sql
select column_name from information_schema.columns where table_name='chutes' order by ordinal_position;
```

- [ ] **Step 2: Appliquer la migration (idempotente)**

Via MCP `apply_migration` (name: `chutes_historique`) :
```sql
alter table public.chutes add column if not exists mode_reutilisation text;
alter table public.chutes add column if not exists reste_jete boolean not null default false;
alter table public.chutes add column if not exists date_consommation timestamptz;
alter table public.chutes add column if not exists unite text;
alter table public.chutes add column if not exists issu_de uuid references public.chutes(id);
```

- [ ] **Step 3: Vérifier**

Re-lancer la requête du Step 1 → les 5 colonnes doivent apparaître.

- [ ] **Step 4: Régénérer les types TypeScript**

Via MCP `generate_typescript_types` (projet `qjmofktujdyxlmvzoklh`) → écrire le résultat dans
`src/lib/database.types.ts` (remplacer le fichier). Vérifier que `Tables<'chutes'>` contient désormais
`mode_reutilisation`, `reste_jete`, `date_consommation`, `unite`, `issu_de`.

- [ ] **Step 5: Vérifier build + commit**

Run: `pnpm exec tsc --noEmit` (0 erreur).
```bash
git add src/lib/database.types.ts
git commit -m "feat(chutes): migration colonnes historique reutilisation + types regeneres"
```
> Note : la migration côté DB n'est pas un fichier versionné ici ; consigner dans le compte-rendu.

---

## Task 2: Couche pure `chutesData.ts`

**Files:** Create `src/modules/chutes/chutesData.ts`, `src/modules/chutes/chutesData.test.ts`

- [ ] **Step 1: Écrire les tests qui échouent**

```ts
// src/modules/chutes/chutesData.test.ts
import { describe, it, expect } from 'vitest';
import { surfaceM2, valoriserChute, chutesDispo, chutesConsommees, catsPresentes, valeurTotale } from './chutesData';

const base = { longueur: 1200, largeur: 800, epaisseur: 15, prix_unit: 65.5594, unite: '€/U', cat: 'CP_Filmé', statut: 'disponible' as const };

describe('surfaceM2', () => {
  it('calcule la surface en m²', () => {
    expect(surfaceM2({ longueur: 1200, largeur: 800 })).toBeCloseTo(0.96, 5);
    expect(surfaceM2({ longueur: null, largeur: 800 })).toBe(0);
  });
});

describe('valoriserChute', () => {
  it('unité €/U : prix ramené au m² via /3.125', () => {
    // 0.96 m² × (65.5594/3.125) ≈ 20.14
    expect(valoriserChute(base)).toBeCloseTo(0.96 * (65.5594 / 3.125), 4);
  });
  it('unité €/m² : prix_unit pris tel quel', () => {
    expect(valoriserChute({ ...base, unite: '€/m²', prix_unit: 50 })).toBeCloseTo(0.96 * 50, 4);
  });
});

describe('filtres', () => {
  const rows = [
    { ...base, statut: 'disponible' as const, cat: 'CP_Filmé' },
    { ...base, statut: 'consommee' as const, cat: 'CP_Filmé' },
    { ...base, statut: 'reutilisee_partiel' as const, cat: 'CP_Résineux' },
    { ...base, statut: 'rebut' as const, cat: 'X' },
  ];
  it('chutesDispo = statut disponible', () => {
    expect(chutesDispo(rows)).toHaveLength(1);
  });
  it('chutesConsommees = consommee ou reutilisee_partiel', () => {
    expect(chutesConsommees(rows)).toHaveLength(2);
  });
  it('catsPresentes = cats distinctes des dispo', () => {
    expect(catsPresentes(chutesDispo(rows))).toEqual(['CP_Filmé']);
  });
  it('valeurTotale somme les valorisations', () => {
    expect(valeurTotale(chutesDispo(rows))).toBeCloseTo(valoriserChute(base), 4);
  });
});
```

- [ ] **Step 2: Lancer, vérifier l'échec**

Run: `pnpm test -- src/modules/chutes/chutesData.test.ts` → FAIL.

- [ ] **Step 3: Implémenter `chutesData.ts`**

```ts
// src/modules/chutes/chutesData.ts
import type { Tables } from '../../lib/database.types';

export type ChuteRow = Tables<'chutes'>;

export function surfaceM2(c: { longueur: number | null; largeur: number | null }): number {
  return ((c.longueur ?? 0) / 1000) * ((c.largeur ?? 0) / 1000);
}

export function valoriserChute(
  c: { longueur: number | null; largeur: number | null; prix_unit: number | null; unite: string | null },
): number {
  const prix = c.prix_unit ?? 0;
  const prixM2 = c.unite === '€/m²' ? prix : prix / 3.125;
  return surfaceM2(c) * prixM2;
}

export function chutesDispo<T extends { statut: string }>(rows: T[]): T[] {
  return rows.filter((c) => c.statut === 'disponible');
}

export function chutesConsommees<T extends { statut: string }>(rows: T[]): T[] {
  return rows.filter((c) => c.statut === 'consommee' || c.statut === 'reutilisee_partiel');
}

export function catsPresentes<T extends { cat: string | null }>(rows: T[]): string[] {
  return [...new Set(rows.map((c) => c.cat).filter((x): x is string => !!x))];
}

export function valeurTotale(
  rows: { longueur: number | null; largeur: number | null; prix_unit: number | null; unite: string | null }[],
): number {
  return rows.reduce((s, c) => s + valoriserChute(c), 0);
}
```

- [ ] **Step 4: Lancer, vérifier le succès** : `pnpm test -- src/modules/chutes/chutesData.test.ts` → PASS.

- [ ] **Step 5: Commit**

```bash
git add src/modules/chutes/chutesData.ts src/modules/chutes/chutesData.test.ts
git commit -m "feat(chutes): couche pure (surface, valorisation, filtres stock)"
```

---

## Task 3: Hooks + mutations offline

**Files:** Create `src/modules/chutes/useChutes.ts`, `src/modules/chutes/useChutes.fetch.test.ts` ; Modify `src/lib/offlineMutations.ts`, `src/lib/offlineMutations.fetch.test.ts`

- [ ] **Step 1: Étendre `src/lib/offlineMutations.ts`**

Ajouter (après les exports existants, sans toucher au reste) :
```ts
export type DeclarerChuteInput = {
  id: string; // uuid client → idempotence
  matiere_code: string;
  designation: string;
  cat: string;
  longueur: number;
  largeur: number;
  epaisseur: number;
  prix_unit: number;
  unite: string | null;
  affaire_origine: string | null;
  operateur_id: string;
};

export type ReutiliserChuteVars = {
  id: string; // chute source
  affaireConsoId: string | null;
  mode: 'totale' | 'partielle';
  resteJete: boolean;
  // reste exploitable → nouvelle chute (id généré client) ; source = données de la chute source
  reste?: { id: string; longueur: number; largeur: number };
  source?: {
    matiere_code: string;
    designation: string;
    cat: string;
    epaisseur: number;
    prix_unit: number;
    unite: string | null;
    affaire_origine: string | null;
    operateur_id: string;
  };
};

export async function insertChute(sb: SupabaseClient, input: DeclarerChuteInput): Promise<void> {
  const { error } = await sb
    .from('chutes')
    .upsert({ ...input, statut: 'disponible' }, { onConflict: 'id', ignoreDuplicates: true });
  if (error) throw new Error(error.message);
}

export async function reutiliserChuteDb(sb: SupabaseClient, vars: ReutiliserChuteVars): Promise<void> {
  const statut = vars.mode === 'totale' ? 'consommee' : 'reutilisee_partiel';
  const { error } = await sb
    .from('chutes')
    .update({
      statut,
      affaire_consommation: vars.affaireConsoId,
      mode_reutilisation: vars.mode,
      reste_jete: vars.resteJete,
      date_consommation: new Date().toISOString(),
    })
    .eq('id', vars.id);
  if (error) throw new Error(error.message);
  if (vars.reste && vars.source) {
    const { error: e2 } = await sb.from('chutes').upsert(
      {
        id: vars.reste.id,
        matiere_code: vars.source.matiere_code,
        designation: vars.source.designation,
        cat: vars.source.cat,
        longueur: vars.reste.longueur,
        largeur: vars.reste.largeur,
        epaisseur: vars.source.epaisseur,
        prix_unit: vars.source.prix_unit,
        unite: vars.source.unite,
        affaire_origine: vars.source.affaire_origine,
        operateur_id: vars.source.operateur_id,
        issu_de: vars.id,
        statut: 'disponible',
      },
      { onConflict: 'id', ignoreDuplicates: true },
    );
    if (e2) throw new Error(e2.message);
  }
}
```
Et dans `registerOfflineMutationDefaults`, ajouter (à la fin de la fonction) :
```ts
  qc.setMutationDefaults(['declarer-chute'], {
    mutationFn: (input: DeclarerChuteInput) => insertChute(supabase, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['chutes'] }),
  });
  qc.setMutationDefaults(['reutiliser-chute'], {
    mutationFn: (vars: ReutiliserChuteVars) => reutiliserChuteDb(supabase, vars),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['chutes'] }),
  });
```

- [ ] **Step 2: Ajouter les tests chutes dans `src/lib/offlineMutations.fetch.test.ts`**

Append (ne pas modifier les tests existants) :
```ts
import { insertChute, reutiliserChuteDb } from './offlineMutations';
// (si l'import groupé existe déjà en tête, y ajouter ces deux symboles)

describe('insertChute', () => {
  it('upsert idempotent statut disponible', async () => {
    const upsert = vi.fn().mockResolvedValue({ error: null });
    const from = vi.fn(() => ({ upsert }));
    await insertChute({ from } as never, {
      id: 'c1', matiere_code: 'M', designation: 'D', cat: 'CP', longueur: 1000, largeur: 500,
      epaisseur: 15, prix_unit: 10, unite: '€/U', affaire_origine: 'a', operateur_id: 'u',
    });
    expect(from).toHaveBeenCalledWith('chutes');
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'c1', statut: 'disponible' }),
      { onConflict: 'id', ignoreDuplicates: true },
    );
  });
});

describe('reutiliserChuteDb', () => {
  it('totale : update statut consommee, pas de reste', async () => {
    const eq = vi.fn().mockResolvedValue({ error: null });
    const update = vi.fn(() => ({ eq }));
    const upsert = vi.fn().mockResolvedValue({ error: null });
    const from = vi.fn(() => ({ update, upsert }));
    await reutiliserChuteDb({ from } as never, { id: 'c1', affaireConsoId: 'a2', mode: 'totale', resteJete: false });
    expect(update).toHaveBeenCalledWith(expect.objectContaining({ statut: 'consommee', mode_reutilisation: 'totale' }));
    expect(eq).toHaveBeenCalledWith('id', 'c1');
    expect(upsert).not.toHaveBeenCalled();
  });
  it('partielle + reste exploitable : update reutilisee_partiel + upsert reste', async () => {
    const eq = vi.fn().mockResolvedValue({ error: null });
    const update = vi.fn(() => ({ eq }));
    const upsert = vi.fn().mockResolvedValue({ error: null });
    const from = vi.fn(() => ({ update, upsert }));
    await reutiliserChuteDb({ from } as never, {
      id: 'c1', affaireConsoId: 'a2', mode: 'partielle', resteJete: false,
      reste: { id: 'c2', longueur: 400, largeur: 300 },
      source: { matiere_code: 'M', designation: 'D', cat: 'CP', epaisseur: 15, prix_unit: 10, unite: '€/U', affaire_origine: 'a', operateur_id: 'u' },
    });
    expect(update).toHaveBeenCalledWith(expect.objectContaining({ statut: 'reutilisee_partiel', reste_jete: false }));
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'c2', issu_de: 'c1', statut: 'disponible', longueur: 400 }),
      { onConflict: 'id', ignoreDuplicates: true },
    );
  });
});
```

- [ ] **Step 3: Lancer les tests offlineMutations** : `pnpm test -- src/lib/offlineMutations.fetch.test.ts` → PASS.

- [ ] **Step 4: Écrire `useChutes.fetch.test.ts` (échoue)**

```ts
// src/modules/chutes/useChutes.fetch.test.ts
import { describe, it, expect, vi } from 'vitest';
import { fetchChutes } from './useChutes';

describe('fetchChutes', () => {
  it('lit chutes avec n° affaires origine/conso, triées par created_at desc', async () => {
    const rows = [{ id: 'c1', statut: 'disponible' }];
    const order = vi.fn().mockResolvedValue({ data: rows, error: null });
    const select = vi.fn(() => ({ order }));
    const from = vi.fn(() => ({ select }));
    const res = await fetchChutes({ from } as never);
    expect(from).toHaveBeenCalledWith('chutes');
    expect(order).toHaveBeenCalledWith('created_at', { ascending: false });
    expect(res).toEqual(rows);
  });
});
```

- [ ] **Step 5: Implémenter `src/modules/chutes/useChutes.ts`**

```ts
import { useQuery, useMutation } from '@tanstack/react-query';
import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';
import type { ChuteRow } from './chutesData';
import type { DeclarerChuteInput, ReutiliserChuteVars } from '../../lib/offlineMutations';

export type ChuteAvecAffaires = ChuteRow & {
  origine?: { numero: string } | null;
  conso?: { numero: string } | null;
};

export async function fetchChutes(sb: SupabaseClient): Promise<ChuteAvecAffaires[]> {
  const { data, error } = await sb
    .from('chutes')
    .select('*, origine:affaire_origine(numero), conso:affaire_consommation(numero)')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as ChuteAvecAffaires[];
}

export function useChutes() {
  return useQuery({ queryKey: ['chutes'], queryFn: () => fetchChutes(supabase) });
}

// mutationFn fournies par setMutationDefaults (offlineMutations.ts) → rejouables hors-ligne.
export function useDeclarerChute() {
  return useMutation<void, Error, DeclarerChuteInput>({ mutationKey: ['declarer-chute'] });
}
export function useReutiliserChute() {
  return useMutation<void, Error, ReutiliserChuteVars>({ mutationKey: ['reutiliser-chute'] });
}
```

- [ ] **Step 6: Lancer, vérifier** : `pnpm test -- src/modules/chutes/useChutes.fetch.test.ts` → PASS. Puis `pnpm exec tsc --noEmit` (0).

- [ ] **Step 7: Commit**

```bash
git add src/lib/offlineMutations.ts src/lib/offlineMutations.fetch.test.ts \
  src/modules/chutes/useChutes.ts src/modules/chutes/useChutes.fetch.test.ts
git commit -m "feat(chutes): hooks liste + mutations offline declarer/reutiliser (idempotence id client)"
```

---

## Task 4: UI `ChutesPage.tsx` (port fidèle) + route

**Files:** Create `src/modules/chutes/ChutesPage.tsx`, `src/modules/chutes/ChutesPage.test.tsx` ; Modify `src/App.tsx`

**Référence de port :** maquette `hans-erp-deploy/hans-erp-deploy/src/App.jsx` l.5159-5380 (`PageChutes`). Reproduire AU PIXEL : PageHeader « Chutes · chutothèque » + bandeau « Principe » (vert `successSoft`) + 4 KPI (`Recycle`/`Boxes`/`CheckCircle2`/`Database`) + tableau stock filtrable (boutons cat) + carte historique « Chutes réutilisées » + modale **Déclarer** + modale **Réutiliser** (totale/partielle + reste exploitable/jeté). Primitives `src/components/ui/` (`PageHeader`, `Card`, `KPI`, `Btn`), thème `C` (`src/lib/theme.ts`), icônes lucide (`Recycle`, `Plus`, `Boxes`, `CheckCircle2`, `Database`, `ArrowRight`, `Trash2`).

**Branchements data :**
- Liste : `useChutes()`. `dispo = chutesDispo(data)`, `consommees = chutesConsommees(data)`, `valeurTotale(dispo)`, `catsPresentes(dispo)`. Valeur par ligne : `valoriserChute(c)`. Date = `c.created_at`. Affaire origine = `c.origine?.numero ?? '—'` ; conso = `c.conso?.numero ?? '—'`.
- Operateur courant : `useAuth()` → `profil`, `session.user.id`.
- **Modale Déclarer** : cascade `useCatalogue()` + `categories`/`famillesFor`/`matieresFor` (cat→famille→matière). À la sélection d'une matière `m` : remplir `matiere_code=m.code`, `designation=m.ref ?? m.code`, `cat=m.cat`, `prix_unit=m.prix`, `unite=m.unite`, `epaisseur` (saisie, défaut `m.epaisseur`). Saisies : longueur, largeur, épaisseur, affaire origine (`<select>` sur `useAffaires()`, valeur = `a.id`). Bouton « Déclarer » → `useDeclarerChute().mutate({ id: crypto.randomUUID(), matiere_code, designation, cat, longueur, largeur, epaisseur, prix_unit, unite, affaire_origine: <id|null>, operateur_id: session.user.id })`.
- **Modale Réutiliser** : affaire dest `<select>` (`useAffaires`, valeur `a.id`) + mode totale/partielle + (si partielle) long/larg reste + reste exploitable/jeté. Bouton confirmer → `useReutiliserChute().mutate({ id: chute.id, affaireConsoId: <id|null>, mode, resteJete: mode==='partielle' && !resteExploitable, reste: (mode==='partielle' && resteExploitable && long && larg) ? { id: crypto.randomUUID(), longueur: +long, largeur: +larg } : undefined, source: { matiere_code: chute.matiere_code, designation: chute.designation, cat: chute.cat, epaisseur: chute.epaisseur, prix_unit: chute.prix_unit, unite: chute.unite, affaire_origine: chute.affaire_origine, operateur_id: session.user.id } })`.
- **Realtime** : `useRealtimeTable('chutes', [['chutes']])` dans `ChutesPage`.
- Historique : afficher mode (`mode_reutilisation`) + reste jeté (`reste_jete`) fidèle maquette (badge « partielle · reste jeté » / « partielle · reste au stock » / « utilisée entièrement »).

- [ ] **Step 1: Écrire le smoke test (échoue)**

```tsx
// src/modules/chutes/ChutesPage.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import ChutesPage from './ChutesPage';

vi.mock('./useChutes', () => ({
  useChutes: () => ({ data: [], isLoading: false }),
  useDeclarerChute: () => ({ mutate: vi.fn() }),
  useReutiliserChute: () => ({ mutate: vi.fn() }),
}));
vi.mock('../formulaire/useCatalogue', () => ({ useCatalogue: () => ({ data: [], isLoading: false }) }));
vi.mock('../affaires/useAffaires', () => ({ useAffaires: () => ({ data: [], isLoading: false }) }));
vi.mock('../../lib/useRealtimeTable', () => ({ useRealtimeTable: () => undefined }));
vi.mock('../../auth/AuthProvider', () => ({ useAuth: () => ({ profil: { nom: 'Gilles TUAILLON', role: 'admin' }, session: { user: { id: 'u' } } }) }));

function renderPage() {
  const qc = new QueryClient();
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter><ChutesPage /></MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('ChutesPage', () => {
  it('rend l\'en-tête chutothèque', () => {
    renderPage();
    expect(screen.getByText(/chutoth[èe]que/i)).toBeInTheDocument();
  });
  it('affiche l\'état vide du stock', () => {
    renderPage();
    expect(screen.getByText(/Aucune chute disponible/i)).toBeInTheDocument();
  });
});
```
> Vérifier le chemin réel de `useAffaires` (`../affaires/useAffaires`) et `useAuth` (`../../auth/AuthProvider`) avant de coder ; ajuster les `vi.mock` si besoin.

- [ ] **Step 2: Lancer, vérifier l'échec** : `pnpm test -- src/modules/chutes/ChutesPage.test.tsx` → FAIL.

- [ ] **Step 3: Implémenter `ChutesPage.tsx`** (port fidèle, `export default function ChutesPage()`), avec tous les branchements ci-dessus. Le tableau stock affiche le message « Aucune chute disponible dans cette catégorie. » quand vide. Aucune donnée en dur (sauf libellés/présentation fidèles).

- [ ] **Step 4: Ajouter la route dans `src/App.tsx`**

```ts
const ChutesPage = lazy(() => import('./modules/chutes/ChutesPage'));
const BUILT_IDS = new Set(['dashboard', 'clients', 'devis', 'affaires', 'formulaire', 'flashage', 'chutes']);
```
```tsx
<Route path="chutes" element={<ProtectedRoute page="chutes"><ChutesPage /></ProtectedRoute>} />
```

- [ ] **Step 5: Tests + types + lint + build**

Run: `pnpm test -- src/modules/chutes/ChutesPage.test.tsx` → PASS. Puis `pnpm exec tsc --noEmit` (0), `pnpm lint` (0 erreur), `pnpm build` (succès).

- [ ] **Step 6: Commit**

```bash
git add src/modules/chutes/ChutesPage.tsx src/modules/chutes/ChutesPage.test.tsx src/App.tsx
git commit -m "feat(chutes): page Chutes (port fidele maquette) + route /chutes + Realtime"
```

---

## Task 5: Vérification contrôleur (build/lint/test + preuve + nettoyage + merge)

**Files:** aucune.

- [ ] **Step 1: Gate complet** : `pnpm test` (tous verts), `pnpm lint` (0 erreur), `pnpm build` (succès).

- [ ] **Step 2: Preuve navigateur (login ADMIN Gilles TUAILLON)**

`preview_start` (serveur `erp-hans-coffrage`) → login admin → `/chutes` :
1. Déclarer une chute via la cascade catalogue réelle (ex. CP_Filmé) + dims + affaire origine `C26-0701-01` → apparaît au stock, KPI à jour, valeur estimée cohérente (vérifier via MCP `select * from chutes`).
2. Réutiliser **totale** sur `C26-0701-01` → passe à l'historique (`statut='consommee'`).
3. Déclarer une 2ᵉ chute, la réutiliser **partielle + reste exploitable** → historique + **nouvelle chute** au stock (`issu_de` renseigné, `statut='disponible'`).
4. (offline) **avec l'onglet focus** (sinon le rejeu attend le focus — cf. mémoire) : passer offline (`onlineManager.setOnline(false)` via instrumentation OU bascule réseau), déclarer une chute → bannière « N en attente », rien en base ; repasser online → rejeu (chute insérée).
5. Screenshot/preuve.

- [ ] **Step 3: Nettoyer les données de test**

Via MCP `execute_sql` :
```sql
delete from chutes; -- la table doit repartir vide (aucune chute réelle en prod encore)
```
Vérifier : `select count(*) from chutes` = 0.

- [ ] **Step 4: Merge fast-forward + push**

```bash
git checkout main
git merge --ff-only feat/chutes
git push origin main
```

- [ ] **Step 5: Mémoire** : consigner dans `hans-coffrage-prod-backend.md` : module Chutes TERMINÉ & POUSSÉ (origin/main = `<sha>`, N tests) — déclarer/réutiliser offline-ready + migration historique + Realtime. Prochain module au choix (Colisage/Livraisons, Factures, Photos offline, B2).

---

## Self-Review (auteur du plan)

- **Couverture spec :** §2 migration → Task 1 ; §3.1 données pures → Task 2 ; §3.2/3.3 hooks+mutations → Task 3 ; §3.4 UI+Realtime → Task 4 ; §5 tests → chaque task ; §6 preuve (dont offline) → Task 5. ✔
- **Placeholders :** aucun TODO/TBD ; code complet pour data/hooks/mutations ; UI fidèle référencée ligne à ligne + branchements exhaustifs (pattern « opus port fidèle »). ✔
- **Types :** `ChuteRow = Tables<'chutes'>` (après régénération Task 1) ; `DeclarerChuteInput`/`ReutiliserChuteVars` définis dans `offlineMutations.ts` et consommés par `useChutes.ts` (source unique) ; mutationKeys `['declarer-chute']`/`['reutiliser-chute']` identiques entre defaults (Task 3 step 1) et hooks (step 5). Mapping statut cohérent (`disponible`/`consommee`/`reutilisee_partiel`). ✔
- **Ordre :** migration+types AVANT le code qui référence les nouvelles colonnes (sinon tsc casse). ✔
