# Module Flashage + Realtime — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Porter le module Flashage atelier de la maquette en module réel (data Supabase) fidèle au pixel, avec Realtime sur `heures_flashees` et `pieces`.

**Architecture:** Nouveau dossier `src/modules/flashage/`. Couche données pure testée (`flashageData.ts`) + hooks React Query (taches, heures flashées, affaires flashables) + brique Realtime générique (`useRealtimeTable`). UI `FlashagePage.tsx` = port fidèle de `PageFlashage` (maquette `hans-erp-deploy/src/App.jsx` l.5451-5762). Migration : publication Realtime. Module construit **online** mais avec choix compatibles offline (horodatage côté client) — cf. spec §3.4.

**Tech Stack:** React 19 + TypeScript strict + Vite + Tailwind v4 + react-router v7 + @tanstack/react-query v5 + Supabase JS. Tests : Vitest. Gestionnaire : pnpm.

**Spec de référence:** `docs/superpowers/specs/2026-06-27-erp-phase2-flashage-realtime-design.md`

**Rappels projet (pièges connus):**
- La base démarre quasi vide : l'affaire démo `C26-0701-01` (BOUYGUES) a son formulaire validé (étape `saisie_pieces` faite) → seule affaire flashable de test.
- Piège CI : `vite.config.ts` charge `test.env` avec l'env Supabase ; les tests qui importent les hooks doivent passer **sans** `.env.local`. Modèle de test fetch existant : `src/modules/affaires/affaires.fetch.test.ts` (copier son pattern de mock du client supabase).
- Commande tests : `pnpm test` (= `vitest run`). Cibler un fichier : `pnpm test -- <chemin>`.
- Toute la prose/commits du projet sont en français.

---

## File Structure

| Fichier | Responsabilité |
|---|---|
| `src/modules/flashage/flashageData.ts` | Fonctions pures : formatage chrono/durée, totaux jour/semaine, groupage tâches, flashable, durée pointage. **Aucune dépendance React/Supabase.** |
| `src/modules/flashage/flashageData.test.ts` | Tests unitaires des fonctions pures. |
| `src/modules/flashage/useTaches.ts` | `useTaches()` + `useCategoriesHeures()` (référentiels React Query). |
| `src/modules/flashage/useTaches.fetch.test.ts` | Test fetch (mock supabase). |
| `src/modules/flashage/useHeuresFlashees.ts` | `useHeuresFlashees()` (liste) + `useFlasherHeures()` (insert). |
| `src/modules/flashage/useHeuresFlashees.fetch.test.ts` | Test fetch + insert (mock supabase). |
| `src/modules/flashage/useAffairesFlashables.ts` | `useAffairesFlashables()` — affaires dont l'étape `saisie_pieces` est faite. |
| `src/modules/flashage/useAffairesFlashables.fetch.test.ts` | Test fetch (mock supabase). |
| `src/lib/useRealtimeTable.ts` | Brique Realtime générique réutilisable (abonne une table, invalide des queryKeys). |
| `src/modules/flashage/FlashagePage.tsx` | UI port fidèle de `PageFlashage`. |
| `src/modules/flashage/FlashagePage.test.tsx` | Test smoke de rendu. |
| `src/App.tsx` (modif) | Ajouter route `/flashage` + `flashage` à `BUILT_IDS`. |

---

## Task 1: Couche données pure (`flashageData.ts`)

**Files:**
- Create: `src/modules/flashage/flashageData.ts`
- Test: `src/modules/flashage/flashageData.test.ts`

- [ ] **Step 1: Écrire les tests qui échouent**

```ts
// src/modules/flashage/flashageData.test.ts
import { describe, it, expect } from 'vitest';
import {
  fmtChrono,
  fmtDuree,
  totalMinutes,
  estAujourdhui,
  estCetteSemaine,
  groupTaches,
  estFlashable,
  dureeMinDepuis,
  ORDRE_GROUPES,
  type TacheRow,
} from './flashageData';

describe('fmtChrono', () => {
  it('formate des millisecondes en HH:MM:SS', () => {
    expect(fmtChrono(0)).toBe('00:00:00');
    expect(fmtChrono(1000)).toBe('00:00:01');
    expect(fmtChrono(61_000)).toBe('00:01:01');
    expect(fmtChrono(3_661_000)).toBe('01:01:01');
  });
  it('clampe les valeurs négatives à 0', () => {
    expect(fmtChrono(-5000)).toBe('00:00:00');
  });
});

describe('fmtDuree', () => {
  it('formate des minutes en "Xh MM"', () => {
    expect(fmtDuree(0)).toBe('0h 00');
    expect(fmtDuree(90)).toBe('1h 30');
    expect(fmtDuree(8)).toBe('0h 08');
    expect(fmtDuree(125)).toBe('2h 05');
  });
});

describe('totalMinutes', () => {
  it('somme duree_min des entrées qui passent le prédicat', () => {
    const flashs = [
      { duree_min: 60, date: '2026-06-27T08:00:00Z' },
      { duree_min: 30, date: '2026-06-27T09:00:00Z' },
      { duree_min: 45, date: '2026-06-20T09:00:00Z' },
    ];
    expect(totalMinutes(flashs, () => true)).toBe(135);
    expect(totalMinutes(flashs, (f) => f.date.startsWith('2026-06-27'))).toBe(90);
    expect(totalMinutes([], () => true)).toBe(0);
  });
});

describe('estAujourdhui / estCetteSemaine', () => {
  const ref = new Date('2026-06-27T12:00:00Z'); // samedi
  it('estAujourdhui vrai le même jour, faux sinon', () => {
    expect(estAujourdhui('2026-06-27T08:00:00Z', ref)).toBe(true);
    expect(estAujourdhui('2026-06-26T08:00:00Z', ref)).toBe(false);
  });
  it('estCetteSemaine vrai dans la semaine ISO (lun→dim), faux avant', () => {
    expect(estCetteSemaine('2026-06-22T08:00:00Z', ref)).toBe(true); // lundi même semaine
    expect(estCetteSemaine('2026-06-21T08:00:00Z', ref)).toBe(false); // dimanche d'avant
  });
});

describe('groupTaches', () => {
  it('groupe par `groupe` selon ORDRE_GROUPES, codes dans l\'ordre d\'entrée', () => {
    const rows: TacheRow[] = [
      { code: 'BEAA', label: 'Dessin', groupe: 'Dessin BE (facturable)', categorie_heures: 'DESSIN', facturable: true },
      { code: 'CAC', label: 'Coffrage', groupe: 'Coffrages & Autres (facturable)', categorie_heures: 'MONTAGE', facturable: true },
      { code: 'CAF', label: 'Coffrage fab', groupe: 'Coffrages & Autres (facturable)', categorie_heures: 'MONTAGE', facturable: true },
    ];
    const g = groupTaches(rows);
    expect(g.map((x) => x.groupe)).toEqual([
      'Coffrages & Autres (facturable)',
      'Dessin BE (facturable)',
    ]);
    expect(g[0].codes.map((c) => c.code)).toEqual(['CAC', 'CAF']);
  });
});

describe('estFlashable', () => {
  it('vrai si l\'étape saisie_pieces est faite', () => {
    expect(estFlashable([{ etape: 'saisie_pieces', fait: true }])).toBe(true);
    expect(estFlashable([{ etape: 'saisie_pieces', fait: false }])).toBe(false);
    expect(estFlashable([{ etape: 'devis_accepte', fait: true }])).toBe(false);
    expect(estFlashable([])).toBe(false);
  });
});

describe('dureeMinDepuis', () => {
  it('arrondit à la minute, minimum 1', () => {
    const start = 1_000_000;
    expect(dureeMinDepuis(start, start + 90_000)).toBe(2); // 1.5 min arrondi
    expect(dureeMinDepuis(start, start + 1_000)).toBe(1); // <1 min → 1
    expect(dureeMinDepuis(start, start + 600_000)).toBe(10);
  });
});
```

- [ ] **Step 2: Lancer les tests, vérifier l'échec**

Run: `pnpm test -- src/modules/flashage/flashageData.test.ts`
Expected: FAIL (`flashageData` introuvable).

- [ ] **Step 3: Implémenter `flashageData.ts`**

```ts
// src/modules/flashage/flashageData.ts
import type { Database } from '../../lib/database.types';

export type TacheRow = Database['public']['Tables']['taches_codes']['Row'];
export type EtapeCle = Database['public']['Enums']['etape_cle'];

/** Ordre métier des groupes de tâches (fidèle maquette TACHES_CODES).
 *  Les 3 premiers alimentent la sélection rapide de la tablette (slice(0,3)). */
export const ORDRE_GROUPES = [
  'Coffrages & Autres (facturable)',
  'SOTRADEST / SATEBA (facturable)',
  'Dessin BE (facturable)',
  'Non facturable',
  'Investissement (NF)',
  'Absences (NF)',
] as const;

export function fmtChrono(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return [h, m, s].map((n) => n.toString().padStart(2, '0')).join(':');
}

export function fmtDuree(min: number): string {
  return `${Math.floor(min / 60)}h ${(min % 60).toString().padStart(2, '0')}`;
}

export function totalMinutes<T extends { duree_min: number }>(
  flashs: T[],
  predicate: (f: T) => boolean,
): number {
  return flashs.filter(predicate).reduce((acc, f) => acc + (f.duree_min ?? 0), 0);
}

export function estAujourdhui(dateISO: string, ref: Date = new Date()): boolean {
  const d = new Date(dateISO);
  return (
    d.getFullYear() === ref.getFullYear() &&
    d.getMonth() === ref.getMonth() &&
    d.getDate() === ref.getDate()
  );
}

/** Début de semaine ISO (lundi 00:00) pour une date donnée. */
function lundiDeLaSemaine(ref: Date): Date {
  const d = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate());
  const jour = (d.getDay() + 6) % 7; // lundi=0 … dimanche=6
  d.setDate(d.getDate() - jour);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function estCetteSemaine(dateISO: string, ref: Date = new Date()): boolean {
  const lundi = lundiDeLaSemaine(ref);
  const dimancheSoir = new Date(lundi);
  dimancheSoir.setDate(lundi.getDate() + 7);
  const d = new Date(dateISO);
  return d >= lundi && d < dimancheSoir;
}

export type GroupeTaches = { groupe: string; codes: TacheRow[] };

export function groupTaches(rows: TacheRow[]): GroupeTaches[] {
  const parGroupe = new Map<string, TacheRow[]>();
  for (const r of rows) {
    const g = r.groupe ?? '—';
    if (!parGroupe.has(g)) parGroupe.set(g, []);
    parGroupe.get(g)!.push(r);
  }
  const ordon = (g: string) => {
    const i = (ORDRE_GROUPES as readonly string[]).indexOf(g);
    return i === -1 ? ORDRE_GROUPES.length : i;
  };
  return [...parGroupe.entries()]
    .map(([groupe, codes]) => ({ groupe, codes }))
    .sort((a, b) => ordon(a.groupe) - ordon(b.groupe));
}

export function estFlashable(etapes: { etape: EtapeCle; fait: boolean }[]): boolean {
  return etapes.some((e) => e.etape === 'saisie_pieces' && e.fait);
}

export function dureeMinDepuis(startMs: number, nowMs: number): number {
  return Math.max(1, Math.round((nowMs - startMs) / 60000));
}
```

- [ ] **Step 4: Lancer les tests, vérifier le succès**

Run: `pnpm test -- src/modules/flashage/flashageData.test.ts`
Expected: PASS (tous verts).

- [ ] **Step 5: Commit**

```bash
git add src/modules/flashage/flashageData.ts src/modules/flashage/flashageData.test.ts
git commit -m "feat(flashage): couche donnees pure (chrono, totaux, groupage taches, flashable)"
```

---

## Task 2: Référentiels tâches (`useTaches.ts`)

**Files:**
- Create: `src/modules/flashage/useTaches.ts`
- Test: `src/modules/flashage/useTaches.fetch.test.ts`

- [ ] **Step 1: Écrire le test fetch qui échoue**

Copier le pattern de mock supabase de `src/modules/affaires/affaires.fetch.test.ts`. Le test vérifie que `fetchTaches`/`fetchCategoriesHeures` appellent la bonne table et propagent les données/erreurs.

```ts
// src/modules/flashage/useTaches.fetch.test.ts
import { describe, it, expect, vi } from 'vitest';
import { fetchTaches, fetchCategoriesHeures } from './useTaches';

function mockSb(rows: unknown) {
  const order = vi.fn().mockResolvedValue({ data: rows, error: null });
  const select = vi.fn(() => ({ order }));
  const from = vi.fn(() => ({ select }));
  return { sb: { from } as never, from, select, order };
}

describe('fetchTaches', () => {
  it('lit taches_codes ordonné par code', async () => {
    const rows = [{ code: 'CAF', groupe: 'g', label: 'l', categorie_heures: 'MONTAGE', facturable: true }];
    const { sb, from, order } = mockSb(rows);
    const res = await fetchTaches(sb);
    expect(from).toHaveBeenCalledWith('taches_codes');
    expect(order).toHaveBeenCalledWith('code');
    expect(res).toEqual(rows);
  });
});

describe('fetchCategoriesHeures', () => {
  it('lit categories_heures', async () => {
    const rows = [{ code: 'MONTAGE', label: 'Heures MONTAGE', taux: 65.4 }];
    const { sb, from } = mockSb(rows);
    const res = await fetchCategoriesHeures(sb);
    expect(from).toHaveBeenCalledWith('categories_heures');
    expect(res).toEqual(rows);
  });
});
```

- [ ] **Step 2: Lancer, vérifier l'échec**

Run: `pnpm test -- src/modules/flashage/useTaches.fetch.test.ts`
Expected: FAIL (module introuvable).

- [ ] **Step 3: Implémenter `useTaches.ts`**

```ts
// src/modules/flashage/useTaches.ts
import { useQuery } from '@tanstack/react-query';
import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';
import type { Database } from '../../lib/database.types';

export type TacheRow = Database['public']['Tables']['taches_codes']['Row'];
export type CategorieHeuresRow = Database['public']['Tables']['categories_heures']['Row'];

export async function fetchTaches(sb: SupabaseClient): Promise<TacheRow[]> {
  const { data, error } = await sb.from('taches_codes').select('*').order('code');
  if (error) throw new Error(error.message);
  return (data ?? []) as TacheRow[];
}

export async function fetchCategoriesHeures(sb: SupabaseClient): Promise<CategorieHeuresRow[]> {
  const { data, error } = await sb.from('categories_heures').select('*');
  if (error) throw new Error(error.message);
  return (data ?? []) as CategorieHeuresRow[];
}

export function useTaches() {
  return useQuery({
    queryKey: ['taches_codes'],
    queryFn: () => fetchTaches(supabase),
    staleTime: 1000 * 60 * 60, // référentiel quasi statique
  });
}

export function useCategoriesHeures() {
  return useQuery({
    queryKey: ['categories_heures'],
    queryFn: () => fetchCategoriesHeures(supabase),
    staleTime: 1000 * 60 * 60,
  });
}
```

- [ ] **Step 4: Lancer, vérifier le succès**

Run: `pnpm test -- src/modules/flashage/useTaches.fetch.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/modules/flashage/useTaches.ts src/modules/flashage/useTaches.fetch.test.ts
git commit -m "feat(flashage): hooks referentiels taches_codes + categories_heures"
```

---

## Task 3: Heures flashées (`useHeuresFlashees.ts`)

**Files:**
- Create: `src/modules/flashage/useHeuresFlashees.ts`
- Test: `src/modules/flashage/useHeuresFlashees.fetch.test.ts`

- [ ] **Step 1: Écrire le test fetch qui échoue**

```ts
// src/modules/flashage/useHeuresFlashees.fetch.test.ts
import { describe, it, expect, vi } from 'vitest';
import { fetchHeuresFlashees, insertFlash } from './useHeuresFlashees';

describe('fetchHeuresFlashees', () => {
  it('lit heures_flashees ordonné par date desc', async () => {
    const rows = [{ id: '1', affaire_id: 'a', code_tache: 'CAF', duree_min: 60 }];
    const order = vi.fn().mockResolvedValue({ data: rows, error: null });
    const select = vi.fn(() => ({ order }));
    const from = vi.fn(() => ({ select }));
    const res = await fetchHeuresFlashees({ from } as never);
    expect(from).toHaveBeenCalledWith('heures_flashees');
    expect(order).toHaveBeenCalledWith('date', { ascending: false });
    expect(res).toEqual(rows);
  });
});

describe('insertFlash', () => {
  it('insère un pointage avec date côté client', async () => {
    const insert = vi.fn().mockResolvedValue({ error: null });
    const from = vi.fn(() => ({ insert }));
    await insertFlash({ from } as never, {
      affaire_id: 'a',
      code_tache: 'CAF',
      operateur_id: 'u',
      operateur_nom: 'Gilles TUAILLON',
      duree_min: 12,
      date: '2026-06-27T10:00:00.000Z',
    });
    expect(from).toHaveBeenCalledWith('heures_flashees');
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({ affaire_id: 'a', duree_min: 12, date: '2026-06-27T10:00:00.000Z' }),
    );
  });
});
```

- [ ] **Step 2: Lancer, vérifier l'échec**

Run: `pnpm test -- src/modules/flashage/useHeuresFlashees.fetch.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implémenter `useHeuresFlashees.ts`**

```ts
// src/modules/flashage/useHeuresFlashees.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';
import type { Database } from '../../lib/database.types';

export type HeureFlashee = Database['public']['Tables']['heures_flashees']['Row'];

export type FlashInput = {
  affaire_id: string;
  code_tache: string;
  operateur_id: string;
  operateur_nom: string;
  duree_min: number;
  /** ISO fixé côté client au moment de l'arrêt (compat offline — cf. spec §3.4). */
  date: string;
};

export async function fetchHeuresFlashees(sb: SupabaseClient): Promise<HeureFlashee[]> {
  const { data, error } = await sb
    .from('heures_flashees')
    .select('*')
    .order('date', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as HeureFlashee[];
}

export async function insertFlash(sb: SupabaseClient, input: FlashInput): Promise<void> {
  const { error } = await sb.from('heures_flashees').insert(input);
  if (error) throw new Error(error.message);
}

export function useHeuresFlashees() {
  return useQuery({
    queryKey: ['heures_flashees'],
    queryFn: () => fetchHeuresFlashees(supabase),
  });
}

export function useFlasherHeures() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: FlashInput) => insertFlash(supabase, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['heures_flashees'] }),
  });
}
```

- [ ] **Step 4: Lancer, vérifier le succès**

Run: `pnpm test -- src/modules/flashage/useHeuresFlashees.fetch.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/modules/flashage/useHeuresFlashees.ts src/modules/flashage/useHeuresFlashees.fetch.test.ts
git commit -m "feat(flashage): hooks heures_flashees (liste + insert pointage, date cote client)"
```

---

## Task 4: Affaires flashables (`useAffairesFlashables.ts`)

**Files:**
- Create: `src/modules/flashage/useAffairesFlashables.ts`
- Test: `src/modules/flashage/useAffairesFlashables.fetch.test.ts`

Approche : filtrage côté DB via inner join sur `etapes_affaire` (étape `saisie_pieces`, fait=true).

- [ ] **Step 1: Écrire le test fetch qui échoue**

```ts
// src/modules/flashage/useAffairesFlashables.fetch.test.ts
import { describe, it, expect, vi } from 'vitest';
import { fetchAffairesFlashables } from './useAffairesFlashables';

describe('fetchAffairesFlashables', () => {
  it('lit les affaires ayant une étape saisie_pieces faite', async () => {
    const rows = [{ id: 'a', numero: 'C26-0701-01', clients: { nom: 'BOUYGUES' } }];
    // chaîne: from('affaires').select(...).eq('etapes_affaire.etape','saisie_pieces').eq('etapes_affaire.fait',true).order('created_at',{ascending:false})
    const order = vi.fn().mockResolvedValue({ data: rows, error: null });
    const eq2 = vi.fn(() => ({ order }));
    const eq1 = vi.fn(() => ({ eq: eq2 }));
    const select = vi.fn(() => ({ eq: eq1 }));
    const from = vi.fn(() => ({ select }));
    const res = await fetchAffairesFlashables({ from } as never);
    expect(from).toHaveBeenCalledWith('affaires');
    expect(eq1).toHaveBeenCalledWith('etapes_affaire.etape', 'saisie_pieces');
    expect(eq2).toHaveBeenCalledWith('etapes_affaire.fait', true);
    expect(res).toEqual(rows);
  });
});
```

- [ ] **Step 2: Lancer, vérifier l'échec**

Run: `pnpm test -- src/modules/flashage/useAffairesFlashables.fetch.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implémenter `useAffairesFlashables.ts`**

```ts
// src/modules/flashage/useAffairesFlashables.ts
import { useQuery } from '@tanstack/react-query';
import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';

export async function fetchAffairesFlashables(sb: SupabaseClient) {
  const { data, error } = await sb
    .from('affaires')
    .select('*, clients(nom), etapes_affaire!inner(etape, fait)')
    .eq('etapes_affaire.etape', 'saisie_pieces')
    .eq('etapes_affaire.fait', true)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export function useAffairesFlashables() {
  return useQuery({
    queryKey: ['affaires_flashables'],
    queryFn: () => fetchAffairesFlashables(supabase),
  });
}
```

- [ ] **Step 4: Lancer, vérifier le succès**

Run: `pnpm test -- src/modules/flashage/useAffairesFlashables.fetch.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/modules/flashage/useAffairesFlashables.ts src/modules/flashage/useAffairesFlashables.fetch.test.ts
git commit -m "feat(flashage): hook affaires flashables (etape saisie_pieces faite)"
```

---

## Task 5: Brique Realtime générique (`useRealtimeTable.ts`)

**Files:**
- Create: `src/lib/useRealtimeTable.ts`
- Test: `src/lib/useRealtimeTable.test.tsx`

- [ ] **Step 1: Écrire le test qui échoue**

Le test monte un composant qui appelle le hook et vérifie qu'un `channel`/`on`/`subscribe` est créé et qu'un changement déclenche l'invalidation des queryKeys. On mocke `supabase.channel`.

```tsx
// src/lib/useRealtimeTable.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const handlers: Record<string, (payload: unknown) => void> = {};
const subscribe = vi.fn(() => ({}));
const on = vi.fn((_evt: string, _filter: unknown, cb: (p: unknown) => void) => {
  handlers.cb = cb;
  return { subscribe, on };
});
const channel = vi.fn(() => ({ on, subscribe }));
const removeChannel = vi.fn();

vi.mock('./supabase', () => ({
  supabase: { channel: (...a: unknown[]) => channel(...a), removeChannel: (...a: unknown[]) => removeChannel(...a) },
}));

import { useRealtimeTable } from './useRealtimeTable';

beforeEach(() => {
  channel.mockClear();
  on.mockClear();
  removeChannel.mockClear();
});

function wrapper(qc: QueryClient) {
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
}

describe('useRealtimeTable', () => {
  it('abonne la table et invalide les queryKeys à un changement', () => {
    const qc = new QueryClient();
    const spy = vi.spyOn(qc, 'invalidateQueries');
    renderHook(() => useRealtimeTable('heures_flashees', [['heures_flashees']]), { wrapper: wrapper(qc) });
    expect(channel).toHaveBeenCalled();
    expect(on).toHaveBeenCalledWith(
      'postgres_changes',
      expect.objectContaining({ event: '*', schema: 'public', table: 'heures_flashees' }),
      expect.any(Function),
    );
    handlers.cb({});
    expect(spy).toHaveBeenCalledWith({ queryKey: ['heures_flashees'] });
  });

  it('retire le canal au démontage', () => {
    const qc = new QueryClient();
    const { unmount } = renderHook(() => useRealtimeTable('pieces', [['pieces', 'x']]), { wrapper: wrapper(qc) });
    unmount();
    expect(removeChannel).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Lancer, vérifier l'échec**

Run: `pnpm test -- src/lib/useRealtimeTable.test.tsx`
Expected: FAIL (module introuvable).

- [ ] **Step 3: Implémenter `useRealtimeTable.ts`**

```ts
// src/lib/useRealtimeTable.ts
import { useEffect } from 'react';
import { useQueryClient, type QueryKey } from '@tanstack/react-query';
import { supabase } from './supabase';

/**
 * Abonne une table Postgres via Supabase Realtime et invalide les queryKeys
 * indiquées à chaque changement (INSERT/UPDATE/DELETE).
 * Brique réutilisée pour le flashage live (heures_flashees) et le cochage atelier (pieces).
 */
export function useRealtimeTable(table: string, queryKeys: QueryKey[]) {
  const qc = useQueryClient();
  // Clé de dépendance stable pour le tableau de queryKeys.
  const keysDep = JSON.stringify(queryKeys);
  useEffect(() => {
    const channel = supabase
      .channel(`rt-${table}-${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table }, () => {
        for (const key of queryKeys) qc.invalidateQueries({ queryKey: key });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table, keysDep, qc]);
}
```

- [ ] **Step 4: Lancer, vérifier le succès**

Run: `pnpm test -- src/lib/useRealtimeTable.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/useRealtimeTable.ts src/lib/useRealtimeTable.test.tsx
git commit -m "feat(realtime): brique generique useRealtimeTable (abonnement + invalidation)"
```

---

## Task 6: Migration — activer Realtime

**Files:** aucune (migration appliquée via Supabase MCP par le contrôleur).

- [ ] **Step 1: Vérifier l'état de publication actuel**

Via MCP `execute_sql` (projet `qjmofktujdyxlmvzoklh`) :
```sql
select tablename from pg_publication_tables
where pubname = 'supabase_realtime' and tablename in ('heures_flashees','pieces');
```

- [ ] **Step 2: Appliquer la migration (idempotente)**

Via MCP `apply_migration` (name: `enable_realtime_flashage`) — n'ajouter que les tables absentes :
```sql
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and tablename='heures_flashees') then
    alter publication supabase_realtime add table public.heures_flashees;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and tablename='pieces') then
    alter publication supabase_realtime add table public.pieces;
  end if;
end $$;
```

- [ ] **Step 3: Vérifier**

Re-lancer la requête du Step 1 → les deux tables doivent apparaître.

> Note : pas de commit code (changement côté base). Consigner dans le compte-rendu de tâche.

---

## Task 7: UI — `FlashagePage.tsx` (port fidèle) + route

**Files:**
- Create: `src/modules/flashage/FlashagePage.tsx`
- Test: `src/modules/flashage/FlashagePage.test.tsx`
- Modify: `src/App.tsx` (route + `BUILT_IDS`)

**Référence de port :** `hans-erp-deploy/hans-erp-deploy/src/App.jsx` l.5451-5762 (`PageFlashage`). Reproduire l'UI **au pixel** : conteneur « tablette » `w-400` fond `#1A1A1A`, écran `bgWarm` h-600, en-tête `C.primary` + Logo + salarié, encart KPI (Aujourd'hui/Semaine/barre), machine à états `idle → tache → actif`, chrono `text-4xl font-mono`, colonne droite (fiche atelier cochable + pointages enregistrés + référentiel 44 codes). Réutiliser les primitives `src/components/ui/` (`PageHeader`, `Card`, `Badge`, `ProgressBar`), le `Logo` (`src/components/layout/Logo.tsx`), le thème `C` (`src/lib/theme.ts`), et les icônes `lucide-react` (`ScanLine`, `Recycle`, `CheckCircle2`, `ClipboardList`). `useAuth` est exporté par `src/auth/AuthProvider.tsx`.

**Branchements data (remplacent l'état maquette) :**
- Opérateur courant : `useAuth()` → `profil.nom` / `profil.id` (pas le `'Alexandre LUTENBACHER'` en dur).
- Affaires flashables : `useAffairesFlashables()` (au lieu de `affaires.filter(formulaireValide)`).
- Codes tâches : `useTaches()` → `groupTaches(rows)` ; sélection rapide = `groupTaches(...).slice(0,3)` ; référentiel = tous les groupes. Badge couleur par `categorie_heures` (`MACHINE`=warning, `DESSIN`=primary, `MONTAGE`=success, `AUTRES`=info, `null`=neutre, fidèle maquette). Compteur = `rows.length` (dynamique, **pas** « 43 »).
- KPI tablette : pointages de l'opérateur = `useHeuresFlashees()` filtré `operateur_id === profil.id` ;
  *Aujourd'hui* = `fmtDuree(totalMinutes(mesFlashs, f => estAujourdhui(f.date)))` ;
  *Semaine* = `fmtDuree(totalMinutes(mesFlashs, f => estCetteSemaine(f.date)))` ;
  barre = `min(100, semaineMinutes / (36.5*60) * 100)` (objectif 36h30 fidèle maquette).
- Chrono : `useState` local `startTime`/`now`, `setInterval(1000)` pendant l'état `actif` (identique maquette). ARRÊTER → `useFlasherHeures().mutate({ ..., duree_min: dureeMinDepuis(startTime, Date.now()), date: new Date(startTime).toISOString() })`. (date = heure de **début** du pointage.)
- Pointages enregistrés (panneau droit) : `useHeuresFlashees()` (tous, RLS-aware), join libellé tâche depuis `useTaches()` (map code→label/categorie_heures), `fmtDuree(duree_min)`. Pastille selon `categorie_heures`.
- Fiche atelier cochable : `usePieces(ficheAff)` filtré `type !== 'Main_Oeuvre'` ; cocher → `useTogglePieceFait().mutate({ id, fait: !p.fait, faitPar: profil.nom, affaireId: ficheAff })`. Sélecteur d'affaire = liste des flashables. `ficheAff` = id de l'affaire (les hooks pièces utilisent l'**id** affaire, pas le `numero`).
- **Realtime** : appeler `useRealtimeTable('heures_flashees', [['heures_flashees']])` et `useRealtimeTable('pieces', [['pieces', ficheAff]])` dans `FlashagePage`.
- Bouton « Déclarer une chute » : présent (fidélité), `onClick` → navigation vers `/chutes` (route stub existante) via `useNavigate()`.

- [ ] **Step 1: Écrire le test smoke qui échoue**

```tsx
// src/modules/flashage/FlashagePage.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import FlashagePage from './FlashagePage';

// Hooks data mockés : la page doit rendre l'ossature sans réseau.
vi.mock('./useAffairesFlashables', () => ({ useAffairesFlashables: () => ({ data: [], isLoading: false }) }));
vi.mock('./useHeuresFlashees', () => ({
  useHeuresFlashees: () => ({ data: [], isLoading: false }),
  useFlasherHeures: () => ({ mutate: vi.fn(), isPending: false }),
}));
vi.mock('./useTaches', () => ({
  useTaches: () => ({ data: [], isLoading: false }),
  useCategoriesHeures: () => ({ data: [], isLoading: false }),
}));
vi.mock('../formulaire/usePieces', () => ({
  usePieces: () => ({ data: [], isLoading: false }),
  useTogglePieceFait: () => ({ mutate: vi.fn() }),
}));
vi.mock('../../lib/useRealtimeTable', () => ({ useRealtimeTable: () => undefined }));
vi.mock('../../auth/AuthProvider', () => ({ useAuth: () => ({ profil: { id: 'u', nom: 'Gilles TUAILLON', role: 'admin' } }) }));

function renderPage() {
  const qc = new QueryClient();
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter><FlashagePage /></MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('FlashagePage', () => {
  it('rend l\'en-tête Flashage atelier', () => {
    renderPage();
    expect(screen.getByText(/Flashage atelier/i)).toBeInTheDocument();
  });
  it('affiche le message « aucune affaire prête » quand 0 flashable', () => {
    renderPage();
    expect(screen.getByText(/valider un formulaire/i)).toBeInTheDocument();
  });
});
```

> Vérifier le chemin réel du hook `useAuth` (probablement `../../auth/AuthProvider`) et ajuster le `vi.mock` en conséquence avant de coder.

- [ ] **Step 2: Lancer, vérifier l'échec**

Run: `pnpm test -- src/modules/flashage/FlashagePage.test.tsx`
Expected: FAIL (module introuvable).

- [ ] **Step 3: Implémenter `FlashagePage.tsx`**

Porter fidèlement `PageFlashage` (maquette l.5451-5762) en appliquant tous les branchements data ci-dessus. `export default function FlashagePage()`. Gérer les états de chargement avec les primitives existantes (`Spinner`). Aucune donnée en dur (sauf constantes de présentation fidèles : 36h30 objectif, libellés).

- [ ] **Step 4: Ajouter la route dans `src/App.tsx`**

Modifier deux endroits :
```ts
// 1. import lazy (après FormulairePage)
const FlashagePage = lazy(() => import('./modules/flashage/FlashagePage'));

// 2. BUILT_IDS
const BUILT_IDS = new Set(['dashboard', 'clients', 'devis', 'affaires', 'formulaire', 'flashage']);
```
```tsx
// 3. Route (à côté de la route formulaire)
<Route
  path="flashage"
  element={<ProtectedRoute page="flashage"><FlashagePage /></ProtectedRoute>}
/>
```

- [ ] **Step 5: Lancer les tests + lint + build**

Run: `pnpm test -- src/modules/flashage/FlashagePage.test.tsx`
Expected: PASS.
Run: `pnpm lint && pnpm build`
Expected: 0 erreur.

- [ ] **Step 6: Commit**

```bash
git add src/modules/flashage/FlashagePage.tsx src/modules/flashage/FlashagePage.test.tsx src/App.tsx
git commit -m "feat(flashage): page Flashage atelier (port fidele maquette) + route /flashage + Realtime"
```

---

## Task 8: Vérification contrôleur (build/lint/test + preuve navigateur + nettoyage + merge)

**Files:** aucune (validation).

- [ ] **Step 1: Suite complète verte**

Run: `pnpm test` puis `pnpm lint` puis `pnpm build`
Expected: tous les tests verts (155 existants + nouveaux), 0 erreur lint/TS, build OK.

- [ ] **Step 2: Preuve navigateur (login ADMIN Gilles TUAILLON)**

`preview_start` → se connecter en **admin** (identifiants `comptes-hans-coffrage.csv`) → `/flashage` :
1. La tablette rend fidèlement ; l'affaire démo `C26-0701-01` (BOUYGUES) apparaît comme flashable.
2. Sélectionner l'affaire → une tâche → le chrono tourne (1 s) → ARRÊTER → un pointage réel apparaît dans « Pointages enregistrés » et alimente le KPI « Aujourd'hui ».
3. Cocher une pièce de la fiche atelier → `pieces.fait` mis à jour (vérifier via `useTogglePieceFait`).
4. (Realtime) vérifier que la liste des pointages se met à jour sans rechargement après l'insert.
5. Screenshot de preuve.

- [ ] **Step 3: Nettoyer les données de test**

Via MCP `execute_sql` : supprimer les pointages créés pendant la preuve et remettre la/les pièce(s) cochée(s) à `fait=false` (restaurer l'état initial de l'affaire démo `C26-0701-01`).
```sql
delete from heures_flashees where affaire_id = (select id from affaires where numero='C26-0701-01');
update pieces set fait=false, fait_par=null, fait_date=null where affaire_id = (select id from affaires where numero='C26-0701-01');
```
(Adapter si l'utilisateur avait laissé une pièce volontairement cochée — vérifier l'état avant/après.)

- [ ] **Step 4: Merge fast-forward + push**

```bash
git checkout main
git merge --ff-only <branche-de-travail>
git push origin main
```
(Si le travail a été fait directement sur `main` en subagent-driven, ignorer le merge et `git push origin main`.)

- [ ] **Step 5: Mettre à jour la mémoire**

Consigner dans `hans-coffrage-prod-backend.md` : module Flashage (A) TERMINÉ & POUSSÉ (origin/main = `<sha>`, N tests), première brique Realtime en place, prochain sous-projet = (B) Socle offline-first PWA.

---

## Self-Review (rempli par l'auteur du plan)

- **Couverture spec :** §2 tables/RLS → Tasks 1-4 ; §3.1 data layer → Tasks 1-5 ; §3.2 UI → Task 7 ; §3.3 migration → Task 6 ; §3.4 compat offline (date client) → Tasks 3 & 7 ; §6 tests → toutes ; §7 preuve → Task 8. Module Heures hors périmètre (reste stub) — OK. ✔
- **Placeholders :** aucun TODO/TBD ; code complet fourni pour data layer et hooks ; le port UI fidèle (Task 7) référence la maquette ligne à ligne + liste exhaustive des branchements (pattern « opus port fidèle » du projet). ✔
- **Cohérence des types :** `TacheRow`, `FlashInput`, `HeureFlashee`, `estFlashable`, `dureeMinDepuis`, `groupTaches`, `ORDRE_GROUPES` nommés identiquement entre tasks. `useTogglePieceFait` signature reprise de `usePieces.ts` existant (`{ id, fait, faitPar, affaireId }`). ✔
