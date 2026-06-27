# Socle offline-first PWA (B1) — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rendre le Flashage résilient aux coupures wifi en cours d'usage : pointages et cochages mis en file puis rejoués automatiquement (sans perte ni doublon) au retour réseau, app installable en PWA.

**Architecture:** File de mutations native React Query (pause/reprise via `onlineManager`) + persistance localStorage (`PersistQueryClientProvider`) pour survivre au reload hors-ligne + mutations rejouables via `setMutationDefaults` avec idempotence par `id` uuid client (upsert) + bannière réseau + `vite-plugin-pwa`.

**Tech Stack:** React 19 + TypeScript strict + Vite 8 + @tanstack/react-query 5.101 (+ persist-client/sync-storage-persister) + vite-plugin-pwa. Tests : Vitest 4. Gestionnaire : pnpm 10.33.2.

**Spec de référence:** `docs/superpowers/specs/2026-06-27-erp-phase2-socle-offline-pwa-design.md`

**Rappels projet (pièges connus):**
- Piège CI : `vite.config.ts` injecte `test.env` (clé publishable) ; les tests doivent passer **sans** `.env.local`. Modèle de mock supabase : `src/modules/affaires/affaires.fetch.test.ts`.
- Commandes : `pnpm test` (= `vitest run`), `pnpm test -- <fichier>`, `pnpm lint`, `pnpm build` (= `tsc -b && vite build`), `pnpm exec tsc --noEmit`.
- `pnpm build` compile AUSSI les `.test.tsx` (tsc -b) → un mock mal typé casse le build (leçon Flashage).
- Prose/commits en FRANÇAIS. Warnings lint `react-refresh/only-export-components` pré-existants tolérés (exit 0) ; ne pas introduire d'**erreur**.
- Mutations atelier ciblées : `useFlasherHeures` (`src/modules/flashage/useHeuresFlashees.ts`) et `useTogglePieceFait` (`src/modules/formulaire/usePieces.ts`).

---

## File Structure

| Fichier | Responsabilité |
|---|---|
| `src/lib/queryClient.ts` (créer) | QueryClient singleton (gcTime 24 h) + persister localStorage |
| `src/lib/offlineMutations.ts` (créer) | `upsertFlash`/`updatePieceFait` (purs, injectables) + `registerOfflineMutationDefaults(qc)` |
| `src/lib/offlineMutations.fetch.test.ts` (créer) | Tests idempotence + defaults |
| `src/lib/useOnlineStatus.ts` (créer) | Hook état réseau via `onlineManager` |
| `src/lib/useOnlineStatus.test.tsx` (créer) | Test |
| `src/components/layout/OfflineBanner.tsx` (créer) | Bandeau « Hors ligne — N en attente » |
| `src/components/layout/OfflineBanner.test.tsx` (créer) | Test rendu conditionnel |
| `src/main.tsx` (modifier) | `PersistQueryClientProvider` + `registerOfflineMutationDefaults` + resume |
| `src/modules/flashage/useHeuresFlashees.ts` (modifier) | `FlashInput`+`id` ; `useFlasherHeures` via `mutationKey` |
| `src/modules/flashage/useHeuresFlashees.fetch.test.ts` (modifier) | adapte insert→upsert |
| `src/modules/formulaire/usePieces.ts` (modifier) | `useTogglePieceFait` via `mutationKey` |
| `src/modules/flashage/FlashagePage.tsx` (modifier) | génère `id: crypto.randomUUID()` au clic ARRÊTER |
| `src/components/layout/AppShell.tsx` (modifier) | monte `<OfflineBanner/>` |
| `src/auth/AuthProvider.tsx` (modifier) | cache localStorage du dernier profil connu |
| `vite.config.ts` (modifier) | plugin `VitePWA` + manifest |
| `public/pwa-icon.svg` (créer) | icône PWA |

---

## Task 1: Persistance React Query (infra)

**Files:**
- Create: `src/lib/queryClient.ts`, `src/lib/queryClient.test.ts`
- Modify: `src/main.tsx`

- [ ] **Step 1: Installer les dépendances**

Run: `pnpm add @tanstack/react-query-persist-client @tanstack/query-sync-storage-persister`
Expected: ajout dans `dependencies`, versions `^5.x` alignées sur react-query.

- [ ] **Step 2: Écrire le test qui échoue**

```ts
// src/lib/queryClient.test.ts
import { describe, it, expect } from 'vitest';
import { queryClient, persister } from './queryClient';

describe('queryClient', () => {
  it('configure un gcTime long (>= 24h) pour la persistance offline', () => {
    const gcTime = queryClient.getDefaultOptions().queries?.gcTime;
    expect(gcTime).toBeGreaterThanOrEqual(1000 * 60 * 60 * 24);
  });
  it('expose un persister avec persistClient/restoreClient', () => {
    expect(typeof persister.persistClient).toBe('function');
    expect(typeof persister.restoreClient).toBe('function');
  });
});
```

- [ ] **Step 3: Lancer, vérifier l'échec**

Run: `pnpm test -- src/lib/queryClient.test.ts`
Expected: FAIL (module introuvable).

- [ ] **Step 4: Implémenter `src/lib/queryClient.ts`**

```ts
// src/lib/queryClient.ts
import { QueryClient } from '@tanstack/react-query';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';

/** Durée de conservation du cache : doit couvrir la durée de persistance offline. */
const GC_TIME = 1000 * 60 * 60 * 24; // 24 h

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { gcTime: GC_TIME },
  },
});

export const persister = createSyncStoragePersister({
  storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  key: 'hans-erp-rq',
});
```

- [ ] **Step 5: Lancer, vérifier le succès**

Run: `pnpm test -- src/lib/queryClient.test.ts`
Expected: PASS.

- [ ] **Step 6: Brancher `main.tsx` sur la persistance**

Remplacer le contenu de `src/main.tsx` par :

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import './index.css';
import App from './App.tsx';
import { AuthProvider } from './auth/AuthProvider.tsx';
import { ErrorBoundary } from './components/layout/ErrorBoundary.tsx';
import { queryClient, persister } from './lib/queryClient';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{ persister, maxAge: 1000 * 60 * 60 * 24 }}
        onSuccess={() => {
          // Rejoue les mutations mises en file pendant une coupure (après réhydratation).
          queryClient.resumePausedMutations();
        }}
      >
        <BrowserRouter>
          <AuthProvider>
            <App />
          </AuthProvider>
        </BrowserRouter>
      </PersistQueryClientProvider>
    </ErrorBoundary>
  </StrictMode>,
);
```

- [ ] **Step 7: Vérifier types + build**

Run: `pnpm exec tsc --noEmit` (0 erreur) puis `pnpm build` (succès).

- [ ] **Step 8: Commit**

```bash
git add package.json pnpm-lock.yaml src/lib/queryClient.ts src/lib/queryClient.test.ts src/main.tsx
git commit -m "feat(offline): persistance React Query (localStorage) + resume des mutations en file"
```

---

## Task 2: Mutations rejouables + idempotence

**Files:**
- Create: `src/lib/offlineMutations.ts`, `src/lib/offlineMutations.fetch.test.ts`
- Modify: `src/modules/flashage/useHeuresFlashees.ts`, `src/modules/flashage/useHeuresFlashees.fetch.test.ts`, `src/modules/formulaire/usePieces.ts`, `src/modules/flashage/FlashagePage.tsx`, `src/main.tsx`

Contexte : pour qu'une mutation persistée se rejoue après reload, sa `mutationFn` doit être ré-enregistrée au boot (`setMutationDefaults`). On centralise les deux mutations atelier et on rend le pointage idempotent (id client + upsert).

- [ ] **Step 1: Écrire les tests qui échouent**

```ts
// src/lib/offlineMutations.fetch.test.ts
import { describe, it, expect, vi } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import { upsertFlash, updatePieceFait, registerOfflineMutationDefaults } from './offlineMutations';

describe('upsertFlash', () => {
  it('upsert idempotent sur la PK id (ignoreDuplicates)', async () => {
    const upsert = vi.fn().mockResolvedValue({ error: null });
    const from = vi.fn(() => ({ upsert }));
    await upsertFlash({ from } as never, {
      id: '11111111-1111-1111-1111-111111111111',
      affaire_id: 'a', code_tache: 'CAF', operateur_id: 'u',
      operateur_nom: 'Gilles TUAILLON', duree_min: 12, date: '2026-06-27T10:00:00.000Z',
    });
    expect(from).toHaveBeenCalledWith('heures_flashees');
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({ id: '11111111-1111-1111-1111-111111111111', affaire_id: 'a' }),
      { onConflict: 'id', ignoreDuplicates: true },
    );
  });
});

describe('updatePieceFait', () => {
  it('met fait/fait_par/fait_date quand fait=true', async () => {
    const eq = vi.fn().mockResolvedValue({ error: null });
    const update = vi.fn(() => ({ eq }));
    const from = vi.fn(() => ({ update }));
    await updatePieceFait({ from } as never, { id: 'p1', fait: true, faitPar: 'Gilles TUAILLON' });
    expect(from).toHaveBeenCalledWith('pieces');
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ fait: true, fait_par: 'Gilles TUAILLON' }),
    );
    expect(eq).toHaveBeenCalledWith('id', 'p1');
  });
  it('remet à null quand fait=false', async () => {
    const eq = vi.fn().mockResolvedValue({ error: null });
    const update = vi.fn(() => ({ eq }));
    const from = vi.fn(() => ({ update }));
    await updatePieceFait({ from } as never, { id: 'p1', fait: false, faitPar: 'X' });
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ fait: false, fait_par: null, fait_date: null }),
    );
  });
});

describe('registerOfflineMutationDefaults', () => {
  it('enregistre les defaults pour flasher-heures et cocher-piece', () => {
    const qc = new QueryClient();
    registerOfflineMutationDefaults(qc);
    expect(qc.getMutationDefaults(['flasher-heures']).mutationFn).toBeInstanceOf(Function);
    expect(qc.getMutationDefaults(['cocher-piece']).mutationFn).toBeInstanceOf(Function);
  });
});
```

- [ ] **Step 2: Lancer, vérifier l'échec**

Run: `pnpm test -- src/lib/offlineMutations.fetch.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implémenter `src/lib/offlineMutations.ts`**

```ts
// src/lib/offlineMutations.ts
import type { QueryClient } from '@tanstack/react-query';
import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from './supabase';

export type FlashInput = {
  id: string; // uuid généré côté client → idempotence au rejeu
  affaire_id: string;
  code_tache: string;
  operateur_id: string;
  operateur_nom: string;
  duree_min: number;
  date: string;
};

export type PieceFaitVars = {
  id: string;
  fait: boolean;
  faitPar: string | null;
  affaireId?: string; // pour invalider ['pieces', affaireId]
};

export async function upsertFlash(sb: SupabaseClient, input: FlashInput): Promise<void> {
  const { error } = await sb
    .from('heures_flashees')
    .upsert(input, { onConflict: 'id', ignoreDuplicates: true });
  if (error) throw new Error(error.message);
}

export async function updatePieceFait(sb: SupabaseClient, vars: PieceFaitVars): Promise<void> {
  const { error } = await sb
    .from('pieces')
    .update({
      fait: vars.fait,
      fait_par: vars.fait ? vars.faitPar : null,
      fait_date: vars.fait ? new Date().toISOString() : null,
    })
    .eq('id', vars.id);
  if (error) throw new Error(error.message);
}

/**
 * Enregistre les mutationFn par défaut au démarrage. Indispensable pour que les
 * mutations persistées (mises en file hors-ligne) retrouvent leur fonction après un reload.
 */
export function registerOfflineMutationDefaults(qc: QueryClient): void {
  qc.setMutationDefaults(['flasher-heures'], {
    mutationFn: (input: FlashInput) => upsertFlash(supabase, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['heures_flashees'] });
    },
  });
  qc.setMutationDefaults(['cocher-piece'], {
    mutationFn: (vars: PieceFaitVars) => updatePieceFait(supabase, vars),
    onSuccess: (_data, vars) => {
      const v = vars as PieceFaitVars;
      if (v.affaireId) qc.invalidateQueries({ queryKey: ['pieces', v.affaireId] });
    },
  });
}
```

- [ ] **Step 4: Lancer, vérifier le succès**

Run: `pnpm test -- src/lib/offlineMutations.fetch.test.ts`
Expected: PASS.

- [ ] **Step 5: Refactorer `useFlasherHeures` pour consommer les defaults**

Dans `src/modules/flashage/useHeuresFlashees.ts` : supprimer `FlashInput`/`insertFlash` locaux et `useFlasherHeures` inline ; ré-exporter le type depuis offlineMutations et brancher la mutation sur `mutationKey`. Remplacer le bloc correspondant par :

```ts
import { useQuery, useMutation } from '@tanstack/react-query';
import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';
import type { Database } from '../../lib/database.types';
export type { FlashInput } from '../../lib/offlineMutations';

export type HeureFlashee = Database['public']['Tables']['heures_flashees']['Row'];

export async function fetchHeuresFlashees(sb: SupabaseClient): Promise<HeureFlashee[]> {
  const { data, error } = await sb
    .from('heures_flashees')
    .select('*')
    .order('date', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as HeureFlashee[];
}

export function useHeuresFlashees() {
  return useQuery({
    queryKey: ['heures_flashees'],
    queryFn: () => fetchHeuresFlashees(supabase),
  });
}

// La mutationFn vient de setMutationDefaults(['flasher-heures']) (offlineMutations.ts)
// → mutation rejouable après reload hors-ligne.
export function useFlasherHeures() {
  return useMutation({ mutationKey: ['flasher-heures'] });
}
```

- [ ] **Step 6: Adapter le test fetch existant `useHeuresFlashees.fetch.test.ts`**

L'ancien test couvrait `insertFlash` (supprimé). Le remplacer par un test de `fetchHeuresFlashees` seul (l'insert/upsert est désormais testé dans `offlineMutations.fetch.test.ts`). Remplacer tout le fichier par :

```ts
// src/modules/flashage/useHeuresFlashees.fetch.test.ts
import { describe, it, expect, vi } from 'vitest';
import { fetchHeuresFlashees } from './useHeuresFlashees';

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
```

- [ ] **Step 7: Refactorer `useTogglePieceFait`**

Dans `src/modules/formulaire/usePieces.ts`, remplacer la fonction `useTogglePieceFait` (et elle seule — laisser `usePieces`, `useCreatePiece`, `useUpdatePiece`, `useDeletePiece`, `useValiderFormulaire` intacts) par :

```ts
// La mutationFn vient de setMutationDefaults(['cocher-piece']) (offlineMutations.ts)
// → cochage rejouable après reload hors-ligne. Signature des variables :
// { id, fait, faitPar, affaireId }.
export function useTogglePieceFait() {
  return useMutation({ mutationKey: ['cocher-piece'] });
}
```

Vérifier que `useMutation` est bien importé en tête de `usePieces.ts` (il l'est déjà). Supprimer l'éventuel import désormais inutilisé (`useQueryClient`) **uniquement s'il n'est plus utilisé ailleurs dans le fichier** (les autres mutations l'utilisent → le garder).

- [ ] **Step 8: `FlashagePage` génère l'`id` au clic ARRÊTER**

Dans `src/modules/flashage/FlashagePage.tsx`, dans `arreterPointage` (~l.130-140), ajouter `id: crypto.randomUUID()` à l'objet passé à `flasher.mutate` :

```tsx
      flasher.mutate({
        id: crypto.randomUUID(),
        affaire_id: selAffaire.id,
        code_tache: selTache.code,
        operateur_id: operateurId,
        operateur_nom: operateurFlash,
        duree_min: dureeMinDepuis(startTime, Date.now()),
        date: new Date(startTime).toISOString(),
      });
```

- [ ] **Step 9: Enregistrer les defaults au boot dans `main.tsx`**

Dans `src/main.tsx`, importer et appeler `registerOfflineMutationDefaults(queryClient)` AVANT le `createRoot(...).render(...)` :

```tsx
import { registerOfflineMutationDefaults } from './lib/offlineMutations';
// ...
registerOfflineMutationDefaults(queryClient);

createRoot(/* ... */);
```

- [ ] **Step 10: Lancer toute la suite + types + build**

Run: `pnpm test` (tout vert), `pnpm exec tsc --noEmit` (0 erreur), `pnpm build` (succès).
Vérifier en particulier que `FlashagePage.test.tsx` (qui mocke `./useHeuresFlashees`) passe toujours : le mock fournit `useFlasherHeures: () => ({ mutate, isPending })`, compatible avec la nouvelle signature. Si le mock du test Flashage référence des exports supprimés, l'ajuster sans affaiblir l'assertion.

- [ ] **Step 11: Commit**

```bash
git add src/lib/offlineMutations.ts src/lib/offlineMutations.fetch.test.ts \
  src/modules/flashage/useHeuresFlashees.ts src/modules/flashage/useHeuresFlashees.fetch.test.ts \
  src/modules/formulaire/usePieces.ts src/modules/flashage/FlashagePage.tsx src/main.tsx
git commit -m "feat(offline): mutations atelier rejouables (setMutationDefaults) + idempotence id client (upsert)"
```

---

## Task 3: Indicateur réseau (`useOnlineStatus` + `OfflineBanner`)

**Files:**
- Create: `src/lib/useOnlineStatus.ts`, `src/lib/useOnlineStatus.test.tsx`, `src/components/layout/OfflineBanner.tsx`, `src/components/layout/OfflineBanner.test.tsx`
- Modify: `src/components/layout/AppShell.tsx`

- [ ] **Step 1: Écrire le test `useOnlineStatus` (échoue)**

```tsx
// src/lib/useOnlineStatus.test.tsx
import { describe, it, expect, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { onlineManager } from '@tanstack/react-query';
import { useOnlineStatus } from './useOnlineStatus';

afterEach(() => onlineManager.setOnline(true));

describe('useOnlineStatus', () => {
  it('reflète onlineManager', () => {
    act(() => onlineManager.setOnline(true));
    const { result } = renderHook(() => useOnlineStatus());
    expect(result.current).toBe(true);
    act(() => onlineManager.setOnline(false));
    expect(result.current).toBe(false);
  });
});
```

- [ ] **Step 2: Lancer, vérifier l'échec**

Run: `pnpm test -- src/lib/useOnlineStatus.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implémenter `src/lib/useOnlineStatus.ts`**

```ts
// src/lib/useOnlineStatus.ts
import { useSyncExternalStore } from 'react';
import { onlineManager } from '@tanstack/react-query';

export function useOnlineStatus(): boolean {
  return useSyncExternalStore(
    (cb) => onlineManager.subscribe(cb),
    () => onlineManager.isOnline(),
    () => true,
  );
}
```

- [ ] **Step 4: Lancer, vérifier le succès**

Run: `pnpm test -- src/lib/useOnlineStatus.test.tsx`
Expected: PASS.

- [ ] **Step 5: Écrire le test `OfflineBanner` (échoue)**

```tsx
// src/components/layout/OfflineBanner.test.tsx
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider, onlineManager } from '@tanstack/react-query';
import { OfflineBanner } from './OfflineBanner';

afterEach(() => onlineManager.setOnline(true));

function renderBanner() {
  const qc = new QueryClient();
  return render(
    <QueryClientProvider client={qc}>
      <OfflineBanner />
    </QueryClientProvider>,
  );
}

describe('OfflineBanner', () => {
  it('cachée quand en ligne', () => {
    act(() => onlineManager.setOnline(true));
    renderBanner();
    expect(screen.queryByText(/Hors ligne/i)).toBeNull();
  });
  it('affichée quand hors ligne', () => {
    renderBanner();
    act(() => onlineManager.setOnline(false));
    expect(screen.getByText(/Hors ligne/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 6: Lancer, vérifier l'échec**

Run: `pnpm test -- src/components/layout/OfflineBanner.test.tsx`
Expected: FAIL.

- [ ] **Step 7: Implémenter `src/components/layout/OfflineBanner.tsx`**

```tsx
// src/components/layout/OfflineBanner.tsx
import { useIsMutating } from '@tanstack/react-query';
import { WifiOff } from 'lucide-react';
import { C } from '../../lib/theme';
import { useOnlineStatus } from '../../lib/useOnlineStatus';

export function OfflineBanner() {
  const online = useOnlineStatus();
  const enAttente = useIsMutating(); // mutations en cours/en pause
  if (online) return null;
  return (
    <div
      className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white"
      style={{ backgroundColor: C.danger }}
      role="status"
    >
      <WifiOff size={16} />
      <span>
        Hors ligne
        {enAttente > 0 ? ` — ${enAttente} opération${enAttente > 1 ? 's' : ''} en attente` : ''}
      </span>
    </div>
  );
}
```

> Note : `useIsMutating` compte les mutations actives/en pause ; suffisant comme indicateur « N en attente » pour B1. Vérifier que `C.danger` et l'icône `WifiOff` (lucide-react) existent ; sinon utiliser une couleur/icône équivalente du thème.

- [ ] **Step 8: Lancer, vérifier le succès**

Run: `pnpm test -- src/components/layout/OfflineBanner.test.tsx`
Expected: PASS.

- [ ] **Step 9: Monter la bannière dans `AppShell`**

Dans `src/components/layout/AppShell.tsx`, importer `OfflineBanner` et la rendre en haut du `<main>`, juste sous `<Topbar>` :

```tsx
import { OfflineBanner } from './OfflineBanner';
// ...
      <main className="flex-1 flex flex-col min-w-0">
        <Topbar onMenuClick={() => setMobileOpen(true)} />
        <OfflineBanner />
        <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
          <Outlet />
        </div>
      </main>
```

- [ ] **Step 10: Suite + types + build**

Run: `pnpm test` (vert), `pnpm exec tsc --noEmit` (0), `pnpm build` (succès).

- [ ] **Step 11: Commit**

```bash
git add src/lib/useOnlineStatus.ts src/lib/useOnlineStatus.test.tsx \
  src/components/layout/OfflineBanner.tsx src/components/layout/OfflineBanner.test.tsx \
  src/components/layout/AppShell.tsx
git commit -m "feat(offline): indicateur reseau (bannière Hors ligne — N en attente)"
```

---

## Task 4: Cache du profil (robustesse reload hors-ligne)

**Files:**
- Modify: `src/auth/AuthProvider.tsx`

Objectif : si `fetchProfil()` échoue hors-ligne après un reload, réutiliser le dernier profil connu (mémorisé en localStorage) pour garder `profil.nom` (utilisé par `fait_par`).

- [ ] **Step 1: Implémenter le cache dans `AuthProvider.tsx`**

Modifier `fetchProfil` pour : (a) à la réussite, mémoriser le profil ; (b) à l'échec/absence de données, retomber sur le profil mémorisé. Ajouter une clé `const PROFIL_KEY = 'hans-erp-profil';` en tête du module. Remplacer le corps de `fetchProfil` par :

```tsx
  async function fetchProfil(sess: Session) {
    try {
      const { data } = await supabase
        .from('profils')
        .select('nom, role')
        .eq('id', sess.user.id)
        .single();
      if (data) {
        const p = { nom: data.nom as string, role: data.role as UserRole };
        setProfil(p);
        try { localStorage.setItem(PROFIL_KEY, JSON.stringify(p)); } catch { /* quota */ }
        return;
      }
    } catch { /* hors-ligne ou erreur réseau → repli sur le cache */ }
    try {
      const cached = localStorage.getItem(PROFIL_KEY);
      if (cached) setProfil(JSON.parse(cached) as Profil);
    } catch { /* ignore */ }
  }
```

Et dans `signOut`, purger le cache : ajouter `try { localStorage.removeItem(PROFIL_KEY); } catch { /* ignore */ }` après `setProfil(null)`.

- [ ] **Step 2: Vérifier que les tests d'auth existants passent toujours**

Run: `pnpm test -- src/auth/AuthProvider.test.tsx`
Expected: PASS (le repli localStorage ne change pas le chemin nominal en ligne). Si un test mocke `single()` sans `try/catch`, vérifier qu'il reste vert ; sinon ajuster le test sans affaiblir l'assertion.

- [ ] **Step 3: Suite + types + lint**

Run: `pnpm test` (vert), `pnpm exec tsc --noEmit` (0), `pnpm lint` (0 erreur — `catch {}` vides : si la règle `no-empty` se déclenche, ajouter un commentaire dans le bloc, déjà présent ci-dessus).

- [ ] **Step 4: Commit**

```bash
git add src/auth/AuthProvider.tsx
git commit -m "feat(offline): cache du dernier profil connu (garde fait_par apres reload hors-ligne)"
```

---

## Task 5: PWA installable (`vite-plugin-pwa`)

**Files:**
- Create: `public/pwa-icon.svg`
- Modify: `vite.config.ts`

> RISQUE COMPAT : le projet est sur **Vite 8** (très récent). Si `vite-plugin-pwa` n'est pas compatible Vite 8 au moment de l'install (erreur de peer-deps ou de build), **NE PAS forcer** : rapporter BLOCKED avec le message d'erreur. Le cœur offline (Tasks 1-4) est déjà livré et fonctionnel sans cette tâche.

- [ ] **Step 1: Installer le plugin**

Run: `pnpm add -D vite-plugin-pwa`
Expected: succès. En cas d'échec de peer-deps Vite 8 → BLOCKED (voir encadré).

- [ ] **Step 2: Créer l'icône `public/pwa-icon.svg`**

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="96" fill="#1F4E4A"/>
  <text x="256" y="330" font-family="Georgia, serif" font-size="240" font-weight="bold"
        text-anchor="middle" fill="#FFF8E1">HC</text>
</svg>
```

> Couleur `#1F4E4A` = `C.primary` (vérifié dans `src/lib/theme.ts`). Crème `#FFF8E1` = crème de la maquette flashage.

- [ ] **Step 3: Configurer `VitePWA` dans `vite.config.ts`**

Ajouter l'import et le plugin (conserver `react()`, `tailwindcss()` et le bloc `test`) :

```ts
import { VitePWA } from 'vite-plugin-pwa';
// ...
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['pwa-icon.svg'],
      workbox: {
        navigateFallback: '/index.html',
        globPatterns: ['**/*.{js,css,html,svg,woff2}'],
      },
      manifest: {
        name: 'HANS COFFRAGE ERP',
        short_name: 'HANS ERP',
        description: 'ERP de production HANS COFFRAGE',
        theme_color: '#1F4E4A',
        background_color: '#FFF8E1',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: 'pwa-icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' },
        ],
      },
    }),
  ],
```

- [ ] **Step 4: Build et vérifier la génération PWA**

Run: `pnpm build`
Expected: succès ; `dist/manifest.webmanifest` et `dist/sw.js` (ou `dist/registerSW.js`) générés. Vérifier : `ls dist/ | grep -E "manifest|sw"`.

- [ ] **Step 5: Suite + types**

Run: `pnpm test` (vert), `pnpm exec tsc --noEmit` (0).

- [ ] **Step 6: Commit**

```bash
git add vite.config.ts public/pwa-icon.svg package.json pnpm-lock.yaml
git commit -m "feat(pwa): app installable (vite-plugin-pwa, manifest + service worker autoUpdate)"
```

---

## Task 6: Vérification contrôleur (build/lint/test + preuve offline→online + nettoyage + merge)

**Files:** aucune (validation).

- [ ] **Step 1: Gate complet**

Run: `pnpm test` (tous verts, 174 + nouveaux), `pnpm lint` (0 erreur), `pnpm build` (succès).

- [ ] **Step 2: Preuve navigateur (login ADMIN Gilles TUAILLON)**

`preview_start` (serveur `erp-hans-coffrage`) → login admin → `/flashage` :
1. Passer hors-ligne : via la console preview `(() => { const { onlineManager } = window; })` n'est pas exposé → utiliser le panneau réseau du preview si dispo, sinon simuler en évaluant dans la page : importer n'est pas possible. **Méthode retenue** : couper le réseau via les DevTools du navigateur de preview OU, plus simple et déterministe, appeler depuis la console preview `window.dispatchEvent(new Event('offline'))` après avoir forcé `navigator.onLine=false` ; React Query écoute ces events. Pour une preuve fiable, privilégier l'API onlineManager exposée à des fins de test (voir Step 2bis).
2. Flasher un pointage + cocher une pièce → la bannière « Hors ligne — N en attente » apparaît, **rien en base** (vérifier via MCP `execute_sql` : `select count(*) from heures_flashees where affaire_id = (select id from affaires where numero='C26-0701-01')` = 0).
3. Repasser en ligne → les mutations se rejouent → **pointage + cochage présents en base** (count = 1, pièce `fait=true`, `fait_par='Gilles TUAILLON'`).
4. Screenshot/preuve.

- [ ] **Step 2bis: Exposer onlineManager pour la preuve (si nécessaire)**

Si la bascule online/offline est difficile à piloter depuis la console preview, ajouter temporairement dans `main.tsx` (en dev) `if (import.meta.env.DEV) (window as any).__onlineManager = onlineManager;` — MAIS retirer cette ligne avant le commit final. Préférer la bascule réseau native si possible pour ne pas polluer le code.

- [ ] **Step 3: Nettoyer les données de test**

Via MCP `execute_sql` :
```sql
delete from heures_flashees where affaire_id = (select id from affaires where numero='C26-0701-01');
update pieces set fait=false, fait_par=null, fait_date=null
where affaire_id = (select id from affaires where numero='C26-0701-01');
```
Vérifier : 0 flash, 0 pièce faite (état initial de l'affaire démo).

- [ ] **Step 4: Merge fast-forward + push**

```bash
git checkout main
git merge --ff-only feat/offline-pwa
git push origin main
```

- [ ] **Step 5: Mettre à jour la mémoire**

Consigner dans `hans-coffrage-prod-backend.md` : socle offline-first PWA (B1) TERMINÉ & POUSSÉ (origin/main = `<sha>`, N tests) — file de mutations React Query persistée + idempotence id client + bannière réseau + PWA. Prochain : (B2) démarrage à froid hors-ligne OU (C) Photos offline.

---

## Self-Review (auteur du plan)

- **Couverture spec :** §3 brique 1 (file native) → Tasks 1+2 ; brique 2 (persistance) → Task 1 ; brique 3 (mutations rejouables + idempotence) → Task 2 ; brique 4 (indicateur) → Task 3 ; brique 5 (PWA) → Task 5 ; détail auth (cache profil) → Task 4 ; §7 tests → chaque task ; §8 preuve → Task 6. ✔
- **Placeholders :** aucun TODO/TBD ; code complet fourni. Les notes « vérifier que X existe » (C.danger, WifiOff, imports) sont des garde-fous, pas des placeholders. ✔
- **Cohérence des types :** `FlashInput` (avec `id`) défini dans `offlineMutations.ts` et ré-exporté par `useHeuresFlashees.ts` (source unique) ; `PieceFaitVars` cohérent entre `updatePieceFait`, les defaults `['cocher-piece']` et `useTogglePieceFait` (vars `{id, fait, faitPar, affaireId}`) ; `mutationKey` `['flasher-heures']`/`['cocher-piece']` identiques entre `registerOfflineMutationDefaults` (Task 2 step 3) et les hooks (steps 5/7). FlashagePage passe `id` (step 8) attendu par `FlashInput`. ✔
- **Risque identifié :** compat `vite-plugin-pwa` × Vite 8 → isolée en Task 5 (dernière), escalade BLOCKED prévue, cœur offline indépendant. ✔
