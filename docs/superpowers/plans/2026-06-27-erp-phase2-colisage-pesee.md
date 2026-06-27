# Colisage + Pesée (logistique inc.1) — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Porter Colisage + Pesée de la maquette en modules réels (table `colis`) fidèles au pixel, offline-ready, la création d'un colis déclenchant l'étape `colisage`.

**Architecture:** `src/modules/colisage/` (routes `/colisage` + `/pesee`). Couche pure `colisData.ts` + `useColis.ts` (liste) + mutations sur le socle offline (`offlineMutations.ts` : defaults `creer-colis`/`peser-colis`, idempotence id client). UI = ports fidèles de `PageColisage` (App.jsx 7062-7234) et `PagePesee` (7237-7298). Realtime sur `colis`.

**Tech Stack:** React 19 + TS strict + Vite 8 + @tanstack/react-query 5.101 + Supabase. Tests : Vitest. pnpm.

**Spec:** `docs/superpowers/specs/2026-06-27-erp-phase2-colisage-pesee-design.md`

**Rappels projet :**
- Base quasi vide : table `colis` **vide** ; affaire démo `C26-0701-01` (a ses 11 étapes semées dont `colisage`).
- Piège CI : tests sans `.env.local` (env via `vite.config.ts`). Mock supabase : `src/modules/affaires/affaires.fetch.test.ts`.
- `pnpm build` = `tsc -b && vite build` (compile les tests). Commandes : `pnpm test`, `pnpm test -- <f>`, `pnpm lint`, `pnpm exec tsc --noEmit`.
- Prose/commits FRANÇAIS. Warnings `react-refresh` pré-existants tolérés (exit 0).
- Socle offline : `setMutationDefaults` dans `offlineMutations.ts` (enregistrés au boot). Idempotence `id` uuid client + upsert `onConflict:'id', ignoreDuplicates:true`. Rejeu au retour réseau exige le **focus** de l'onglet (cf. mémoire `verif-preview-headless-focus`).
- `useAffaires()` = `src/modules/affaires/useAffaires.ts` (liste affaires, `a.id`/`a.numero`). `useRealtimeTable` = `src/lib/useRealtimeTable.ts`. Nav `colisage`/`pesee` existent déjà (`src/components/nav.ts`).
- L'étape `colisage` existe toujours (semée à la création d'affaire) → un simple `update etapes_affaire ... where affaire_id and etape='colisage'` la marque (idempotent).
- Unités : `poids` stocké en **kg** (saisie), affichage **tonnes** = kg/1000 fidèle maquette ; dimensions en **cm**.

---

## File Structure

| Fichier | Responsabilité |
|---|---|
| `src/modules/colisage/colisData.ts` (créer) | Pur : `nextNumeroColis`, `totalPoids`, `colisDuJour`, `groupByAffaire`, `fmtTonnes` |
| `src/modules/colisage/colisData.test.ts` (créer) | Tests |
| `src/modules/colisage/useColis.ts` (créer) | `useColis()` + `useCreerColis`/`usePeserColis` (mutationKey) |
| `src/modules/colisage/useColis.fetch.test.ts` (créer) | Test fetch |
| `src/lib/offlineMutations.ts` (modifier) | + `CreerColisInput`/`PeserColisVars`, `insertColis`/`peserColis`, defaults |
| `src/lib/offlineMutations.fetch.test.ts` (modifier) | + tests colis |
| `src/modules/colisage/ColisagePage.tsx` (créer) | UI port fidèle Colisage |
| `src/modules/colisage/ColisagePage.test.tsx` (créer) | Smoke |
| `src/modules/colisage/PeseePage.tsx` (créer) | UI port fidèle Pesée |
| `src/modules/colisage/PeseePage.test.tsx` (créer) | Smoke |
| `src/App.tsx` (modifier) | routes `/colisage` + `/pesee` + `BUILT_IDS` |

---

## Task 1: Couche pure `colisData.ts`

**Files:** Create `src/modules/colisage/colisData.ts`, `src/modules/colisage/colisData.test.ts`

- [ ] **Step 1: Écrire les tests (échouent)**

```ts
// src/modules/colisage/colisData.test.ts
import { describe, it, expect } from 'vitest';
import { nextNumeroColis, totalPoids, colisDuJour, groupByAffaire, fmtTonnes } from './colisData';

describe('nextNumeroColis', () => {
  it('1 si aucun colis, sinon max+1', () => {
    expect(nextNumeroColis([])).toBe(1);
    expect(nextNumeroColis([{ numero: 1 }, { numero: 3 }, { numero: 2 }])).toBe(4);
    expect(nextNumeroColis([{ numero: null }])).toBe(1);
  });
});

describe('totalPoids', () => {
  it('somme les poids (null = 0)', () => {
    expect(totalPoids([{ poids: 430 }, { poids: 1840 }, { poids: null }])).toBe(2270);
    expect(totalPoids([])).toBe(0);
  });
});

describe('colisDuJour', () => {
  const ref = new Date('2026-06-27T15:00:00Z');
  it('garde les colis du même jour que ref', () => {
    const rows = [
      { id: 'a', date: '2026-06-27T08:00:00Z' },
      { id: 'b', date: '2026-06-26T08:00:00Z' },
    ];
    expect(colisDuJour(rows, ref).map((r) => r.id)).toEqual(['a']);
  });
});

describe('groupByAffaire', () => {
  it('groupe par affaire_id', () => {
    const rows = [
      { affaire_id: 'x', numero: 1 },
      { affaire_id: 'x', numero: 2 },
      { affaire_id: 'y', numero: 1 },
    ];
    const g = groupByAffaire(rows);
    expect(g).toHaveLength(2);
    expect(g.find((x) => x.affaireId === 'x')?.colis).toHaveLength(2);
  });
});

describe('fmtTonnes', () => {
  it('kg → tonnes à 3 décimales', () => {
    expect(fmtTonnes(860)).toBe('0.860');
    expect(fmtTonnes(1840)).toBe('1.840');
  });
});
```

- [ ] **Step 2: Lancer, vérifier l'échec** : `pnpm test -- src/modules/colisage/colisData.test.ts` → FAIL.

- [ ] **Step 3: Implémenter `colisData.ts`**

```ts
// src/modules/colisage/colisData.ts
import type { Tables } from '../../lib/database.types';

export type ColisRow = Tables<'colis'>;

export function nextNumeroColis(colisAffaire: { numero: number | null }[]): number {
  return colisAffaire.reduce((m, c) => Math.max(m, c.numero ?? 0), 0) + 1;
}

export function totalPoids(rows: { poids: number | null }[]): number {
  return rows.reduce((s, c) => s + (c.poids ?? 0), 0);
}

function memeJour(dateISO: string, ref: Date): boolean {
  const d = new Date(dateISO);
  return (
    d.getFullYear() === ref.getFullYear() &&
    d.getMonth() === ref.getMonth() &&
    d.getDate() === ref.getDate()
  );
}

export function colisDuJour<T extends { date: string }>(rows: T[], ref: Date = new Date()): T[] {
  return rows.filter((r) => memeJour(r.date, ref));
}

export function groupByAffaire<T extends { affaire_id: string }>(
  rows: T[],
): { affaireId: string; colis: T[] }[] {
  const map = new Map<string, T[]>();
  for (const r of rows) {
    if (!map.has(r.affaire_id)) map.set(r.affaire_id, []);
    map.get(r.affaire_id)!.push(r);
  }
  return [...map.entries()].map(([affaireId, colis]) => ({ affaireId, colis }));
}

export function fmtTonnes(kg: number): string {
  return (kg / 1000).toFixed(3);
}
```

- [ ] **Step 4: Lancer, vérifier** : `pnpm test -- src/modules/colisage/colisData.test.ts` → PASS. Puis `pnpm exec tsc --noEmit` (0).

- [ ] **Step 5: Commit**

```bash
git add src/modules/colisage/colisData.ts src/modules/colisage/colisData.test.ts
git commit -m "feat(colisage): couche pure (numero colis, total poids, colis du jour, groupage)"
```

---

## Task 2: Hooks + mutations offline

**Files:** Create `src/modules/colisage/useColis.ts`, `src/modules/colisage/useColis.fetch.test.ts` ; Modify `src/lib/offlineMutations.ts`, `src/lib/offlineMutations.fetch.test.ts`

- [ ] **Step 1: Étendre `src/lib/offlineMutations.ts`** (ajouter après les exports existants ; étendre `registerOfflineMutationDefaults`) :

```ts
export type CreerColisInput = {
  id: string; // uuid client → idempotence
  affaire_id: string;
  numero: number;
  longueur: number;
  largeur: number;
  hauteur: number;
  poids: number;
};

export type PeserColisVars = {
  id: string;
  affaireId?: string;
  poids: number;
  longueur?: number;
  largeur?: number;
  hauteur?: number;
};

export async function insertColis(sb: SupabaseClient, input: CreerColisInput): Promise<void> {
  const { error } = await sb.from('colis').upsert(input, { onConflict: 'id', ignoreDuplicates: true });
  if (error) throw new Error(error.message);
  // Déclenche l'étape colisage (existe toujours — semée à la création de l'affaire).
  const { error: e2 } = await sb
    .from('etapes_affaire')
    .update({ fait: true, date: new Date().toISOString() })
    .eq('affaire_id', input.affaire_id)
    .eq('etape', 'colisage');
  if (e2) throw new Error(e2.message);
}

export async function peserColis(sb: SupabaseClient, vars: PeserColisVars): Promise<void> {
  const patch: Record<string, number> = { poids: vars.poids };
  if (vars.longueur != null) patch.longueur = vars.longueur;
  if (vars.largeur != null) patch.largeur = vars.largeur;
  if (vars.hauteur != null) patch.hauteur = vars.hauteur;
  const { error } = await sb.from('colis').update(patch).eq('id', vars.id);
  if (error) throw new Error(error.message);
}
```
Append dans `registerOfflineMutationDefaults` (après les defaults chutes) :
```ts
  qc.setMutationDefaults(['creer-colis'], {
    mutationFn: (input: CreerColisInput) => insertColis(supabase, input),
    onSuccess: (_d, input) => {
      const i = input as CreerColisInput;
      qc.invalidateQueries({ queryKey: ['colis'] });
      qc.invalidateQueries({ queryKey: ['etapes', i.affaire_id] });
      qc.invalidateQueries({ queryKey: ['affaires'] });
    },
  });
  qc.setMutationDefaults(['peser-colis'], {
    mutationFn: (vars: PeserColisVars) => peserColis(supabase, vars),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['colis'] }),
  });
```

- [ ] **Step 2: Ajouter les tests colis dans `src/lib/offlineMutations.fetch.test.ts`** (ajouter `insertColis, peserColis` aux imports ; append) :

```ts
describe('insertColis', () => {
  it('upsert colis idempotent + update etape colisage', async () => {
    const upsert = vi.fn().mockResolvedValue({ error: null });
    const eqEtape2 = vi.fn().mockResolvedValue({ error: null });
    const eqEtape1 = vi.fn(() => ({ eq: eqEtape2 }));
    const update = vi.fn(() => ({ eq: eqEtape1 }));
    const from = vi.fn((t: string) => (t === 'colis' ? { upsert } : { update }));
    await insertColis({ from } as never, {
      id: 'k1', affaire_id: 'a', numero: 1, longueur: 100, largeur: 80, hauteur: 50, poids: 430,
    });
    expect(from).toHaveBeenCalledWith('colis');
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'k1', numero: 1 }),
      { onConflict: 'id', ignoreDuplicates: true },
    );
    expect(from).toHaveBeenCalledWith('etapes_affaire');
    expect(update).toHaveBeenCalledWith(expect.objectContaining({ fait: true }));
    expect(eqEtape1).toHaveBeenCalledWith('affaire_id', 'a');
    expect(eqEtape2).toHaveBeenCalledWith('etape', 'colisage');
  });
});

describe('peserColis', () => {
  it('update poids (+ dims si fournies) par id', async () => {
    const eq = vi.fn().mockResolvedValue({ error: null });
    const update = vi.fn(() => ({ eq }));
    const from = vi.fn(() => ({ update }));
    await peserColis({ from } as never, { id: 'k1', poids: 860, longueur: 182 });
    expect(from).toHaveBeenCalledWith('colis');
    expect(update).toHaveBeenCalledWith(expect.objectContaining({ poids: 860, longueur: 182 }));
    expect(eq).toHaveBeenCalledWith('id', 'k1');
  });
});
```
Run: `pnpm test -- src/lib/offlineMutations.fetch.test.ts` → PASS.

- [ ] **Step 3: `useColis.fetch.test.ts` (échoue)**

```ts
// src/modules/colisage/useColis.fetch.test.ts
import { describe, it, expect, vi } from 'vitest';
import { fetchColis } from './useColis';

describe('fetchColis', () => {
  it('lit colis avec n° affaire, triés par date desc', async () => {
    const rows = [{ id: 'k1', affaire_id: 'a', numero: 1 }];
    const order = vi.fn().mockResolvedValue({ data: rows, error: null });
    const select = vi.fn(() => ({ order }));
    const from = vi.fn(() => ({ select }));
    const res = await fetchColis({ from } as never);
    expect(from).toHaveBeenCalledWith('colis');
    expect(order).toHaveBeenCalledWith('date', { ascending: false });
    expect(res).toEqual(rows);
  });
});
```

- [ ] **Step 4: Implémenter `src/modules/colisage/useColis.ts`**

```ts
import { useQuery, useMutation } from '@tanstack/react-query';
import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';
import type { ColisRow } from './colisData';
import type { CreerColisInput, PeserColisVars } from '../../lib/offlineMutations';

export type ColisAvecAffaire = ColisRow & { affaire?: { numero: string } | null };

export async function fetchColis(sb: SupabaseClient): Promise<ColisAvecAffaire[]> {
  const { data, error } = await sb
    .from('colis')
    .select('*, affaire:affaire_id(numero)')
    .order('date', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as ColisAvecAffaire[];
}

export function useColis() {
  return useQuery({ queryKey: ['colis'], queryFn: () => fetchColis(supabase) });
}

// mutationFn fournies par setMutationDefaults (offlineMutations.ts) → rejouables hors-ligne.
export function useCreerColis() {
  return useMutation<void, Error, CreerColisInput>({ mutationKey: ['creer-colis'] });
}
export function usePeserColis() {
  return useMutation<void, Error, PeserColisVars>({ mutationKey: ['peser-colis'] });
}
```
Run: `pnpm test -- src/modules/colisage/useColis.fetch.test.ts` → PASS. Puis `pnpm exec tsc --noEmit` (0), `pnpm build` (succès).

- [ ] **Step 5: Commit**

```bash
git add src/lib/offlineMutations.ts src/lib/offlineMutations.fetch.test.ts \
  src/modules/colisage/useColis.ts src/modules/colisage/useColis.fetch.test.ts
git commit -m "feat(colisage): hooks colis + mutations offline creer/peser (etape colisage, idempotence)"
```

---

## Task 3: UI `ColisagePage.tsx` (port fidèle) + route

**Files:** Create `src/modules/colisage/ColisagePage.tsx`, `src/modules/colisage/ColisagePage.test.tsx` ; Modify `src/App.tsx`

**Référence :** maquette `App.jsx` l.7062-7234 (`PageColisage`). Reproduire AU PIXEL : PageHeader « Colisage » (section « Logistique ») + carte « Ajouter un colis pour une affaire » (select affaire + Long/Larg/Haut (cm) + Poids (kg) + bouton « Ajouter le colis ») + liste « Colis enregistrés » par affaire + split 2 colonnes « Fiche colisage en cours » (DÉMO honnête — cerclage/film/élingues/contenu n'existent pas en base → badge « Démo ») et « Colis du jour » (RÉEL) + boutons Photo/Étiquette A5/BL (stub). Primitives `src/components/ui/` (`PageHeader`, `Card`, `Btn`, `Badge`), thème `C`, icônes `Package`, `Plus`, `Camera`, `Printer`, `FileText`.

**Branchements :**
- `useColis()` → `colis`. `useAffaires()` → affaires (`a.id`/`a.numero`). `useAuth()`.
- Ajout : état formulaire (affaireId = `a.id`, long/larg/haut/poids). « Ajouter le colis » → calculer le n° : `nextNumeroColis(colis.filter(c => c.affaire_id === affaireId))` puis `useCreerColis().mutate({ id: crypto.randomUUID(), affaire_id: affaireId, numero, longueur:+long, largeur:+larg, hauteur:+haut, poids:+poids })`, reset. Garde : affaireId requis.
- Liste « Colis enregistrés » : `groupByAffaire(colis)` ; pour chaque groupe afficher le n° affaire (`colis[0].affaire?.numero` ou résoudre via affaires) + nb colis + `L×l×h cm · poids kg`.
- « Colis du jour » : `colisDuJour(colis)` (réel) ; afficher affaire (`c.affaire?.numero`) + `Colis {c.numero}` + poids.
- `useRealtimeTable('colis', [['colis']])`.
- Blocs sans équivalent base → badge « Démo » (pattern Dashboard).

- [ ] **Step 1: Smoke test (échoue)**

```tsx
// src/modules/colisage/ColisagePage.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import ColisagePage from './ColisagePage';

vi.mock('./useColis', () => ({
  useColis: () => ({ data: [], isLoading: false }),
  useCreerColis: () => ({ mutate: vi.fn() }),
  usePeserColis: () => ({ mutate: vi.fn() }),
}));
vi.mock('../affaires/useAffaires', () => ({ useAffaires: () => ({ data: [], isLoading: false }) }));
vi.mock('../../lib/useRealtimeTable', () => ({ useRealtimeTable: () => undefined }));
vi.mock('../../auth/AuthProvider', () => ({ useAuth: () => ({ profil: { nom: 'Gilles TUAILLON', role: 'admin' }, session: { user: { id: 'u' } } }) }));

function renderPage() {
  const qc = new QueryClient();
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter><ColisagePage /></MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('ColisagePage', () => {
  it('rend l\'en-tête Colisage', () => {
    renderPage();
    expect(screen.getByText('Colisage')).toBeInTheDocument();
  });
  it('affiche la carte d\'ajout de colis', () => {
    renderPage();
    expect(screen.getByText(/Ajouter un colis pour une affaire/i)).toBeInTheDocument();
  });
});
```
> Vérifier le chemin réel de `useAffaires`/`useAuth` avant de coder.

- [ ] **Step 2: Lancer, vérifier l'échec.**

- [ ] **Step 3: Implémenter `ColisagePage.tsx`** (port fidèle, `export default function ColisagePage()`), branchements ci-dessus. Aucune donnée en dur sauf libellés/blocs démo honnêtes.

- [ ] **Step 4: Route dans `src/App.tsx`**

```ts
const ColisagePage = lazy(() => import('./modules/colisage/ColisagePage'));
const BUILT_IDS = new Set(['dashboard', 'clients', 'devis', 'affaires', 'formulaire', 'flashage', 'chutes', 'colisage']);
```
```tsx
<Route path="colisage" element={<ProtectedRoute page="colisage"><ColisagePage /></ProtectedRoute>} />
```

- [ ] **Step 5: Tests + types + lint + build**

Run: `pnpm test -- src/modules/colisage/ColisagePage.test.tsx` → PASS. Puis `pnpm exec tsc --noEmit` (0), `pnpm lint` (0 erreur), `pnpm build` (succès).

- [ ] **Step 6: Commit**

```bash
git add src/modules/colisage/ColisagePage.tsx src/modules/colisage/ColisagePage.test.tsx src/App.tsx
git commit -m "feat(colisage): page Colisage (port fidele) + route /colisage + Realtime"
```

---

## Task 4: UI `PeseePage.tsx` (port fidèle) + route

**Files:** Create `src/modules/colisage/PeseePage.tsx`, `src/modules/colisage/PeseePage.test.tsx` ; Modify `src/App.tsx`

**Référence :** maquette `App.jsx` l.7237-7298 (`PagePesee`). Reproduire AU PIXEL : PageHeader « Pesée des colis » (section « Logistique ») + split 2 colonnes : « Pesée en cours » (encart noir gros chiffre poids en tonnes + 3 dims + bouton « Valider la pesée ») et « Pesées du jour » (liste + total journée). Icône `Scale`, `Check`. Primitives + thème `C`.

**Branchements :**
- `useColis()` → `colis`. `useAuth()`.
- **Sélection du colis à peser** : `<select>` listant les colis (label = `${c.affaire?.numero} · Colis ${c.numero}`, value = `c.id`). Le colis sélectionné alimente l'encart (poids courant en tonnes via `fmtTonnes`, dims). Champs de saisie poids (kg) + dims (cm) pré-remplis avec les valeurs courantes.
- « Valider la pesée » → `usePeserColis().mutate({ id: selId, affaireId: sel.affaire_id, poids:+poids, longueur:+long, largeur:+larg, hauteur:+haut })`.
- « Pesées du jour » : `colisDuJour(colis)` ayant un poids > 0 ; afficher heure (`c.date`), `${affaire} · {numero}`, `fmtTonnes(c.poids) t`. Total = `fmtTonnes(totalPoids(pesesDuJour))`.
- `useRealtimeTable('colis', [['colis']])`.

- [ ] **Step 1: Smoke test (échoue)**

```tsx
// src/modules/colisage/PeseePage.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import PeseePage from './PeseePage';

vi.mock('./useColis', () => ({
  useColis: () => ({ data: [], isLoading: false }),
  useCreerColis: () => ({ mutate: vi.fn() }),
  usePeserColis: () => ({ mutate: vi.fn() }),
}));
vi.mock('../../lib/useRealtimeTable', () => ({ useRealtimeTable: () => undefined }));
vi.mock('../../auth/AuthProvider', () => ({ useAuth: () => ({ profil: { nom: 'Gilles TUAILLON', role: 'admin' }, session: { user: { id: 'u' } } }) }));

function renderPage() {
  const qc = new QueryClient();
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter><PeseePage /></MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('PeseePage', () => {
  it('rend l\'en-tête Pesée', () => {
    renderPage();
    expect(screen.getByText(/Pesée des colis/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Lancer, vérifier l'échec.**

- [ ] **Step 3: Implémenter `PeseePage.tsx`** (port fidèle, `export default function PeseePage()`).

- [ ] **Step 4: Route dans `src/App.tsx`**

```ts
const PeseePage = lazy(() => import('./modules/colisage/PeseePage'));
```
Ajouter `'pesee'` à `BUILT_IDS` et :
```tsx
<Route path="pesee" element={<ProtectedRoute page="pesee"><PeseePage /></ProtectedRoute>} />
```

- [ ] **Step 5: Tests + types + lint + build** (mêmes commandes, cibler `PeseePage.test.tsx`).

- [ ] **Step 6: Commit**

```bash
git add src/modules/colisage/PeseePage.tsx src/modules/colisage/PeseePage.test.tsx src/App.tsx
git commit -m "feat(pesee): page Pesee (port fidele) + route /pesee + Realtime"
```

---

## Task 5: Vérification contrôleur (build/lint/test + preuve + nettoyage + merge)

**Files:** aucune.

- [ ] **Step 1: Gate complet** : `pnpm test` (tous verts), `pnpm lint` (0 erreur), `pnpm build` (succès).

- [ ] **Step 2: Preuve navigateur (login ADMIN Gilles)**

`preview_start` (serveur `erp-hans-coffrage`) → login admin :
1. `/colisage` → ajouter un colis sur `C26-0701-01` (ex. 180×165×240 cm, 860 kg) → en base (`select * from colis`), `numero=1`, **étape colisage `fait=true`** (`select fait from etapes_affaire where etape='colisage' and affaire_id=(select id from affaires where numero='C26-0701-01')`), apparaît dans « Colis enregistrés » + « Colis du jour ».
2. `/pesee` → sélectionner le colis → modifier le poids → « Valider la pesée » → `colis.poids` mis à jour, « Pesées du jour » + total.
3. (offline, onglet focus) créer un colis hors-ligne → bannière « N en attente » → retour réseau → rejeu en base.
4. Screenshot.

- [ ] **Step 3: Nettoyer les données de test**

Via MCP `execute_sql` :
```sql
delete from colis where affaire_id = (select id from affaires where numero='C26-0701-01');
update etapes_affaire set fait=false, date=null where etape='colisage' and affaire_id=(select id from affaires where numero='C26-0701-01');
```
Vérifier : 0 colis pour l'affaire démo, étape colisage `fait=false`.

- [ ] **Step 4: Merge fast-forward + push**

```bash
git checkout main
git merge --ff-only feat/colisage-pesee
git push origin main
```

- [ ] **Step 5: Mémoire** : consigner dans `hans-coffrage-prod-backend.md` : Colisage+Pesée TERMINÉ & POUSSÉ (origin/main = `<sha>`, N tests) — colis offline-ready + étape colisage déclenchée + Realtime. Prochain : Livraisons+Transport (inc.2) OU autre.

---

## Self-Review (auteur du plan)

- **Couverture spec :** §3.1 pur → Task 1 ; §3.2/3.3 hooks+mutations → Task 2 ; §3.4 Colisage UI → Task 3 ; §3.5 Pesée UI → Task 4 ; §3.6 Realtime → Tasks 3-4 ; §5 tests → chaque task ; §6 preuve (dont offline + étape colisage) → Task 5. ✔
- **Placeholders :** aucun ; code complet data/hooks/mutations ; UI fidèles référencées ligne à ligne + branchements exhaustifs (pattern « opus port fidèle »). ✔
- **Types :** `ColisRow = Tables<'colis'>` ; `CreerColisInput`/`PeserColisVars` définis dans `offlineMutations.ts` et consommés par `useColis.ts` (source unique) ; mutationKeys `['creer-colis']`/`['peser-colis']` identiques entre defaults (Task 2) et hooks. ✔
- **Étape colisage :** update idempotent (l'étape est toujours semée) — pas d'insert. ✔
