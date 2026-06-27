# Socle offline-first PWA (B1) — Design (Phase 2)

> Date : 2026-06-27 · ERP HANS COFFRAGE (dépôt ERP_hans-coffrage)
> Sous-projet **(B)** de la stratégie atelier offline-first. Périmètre validé : **(B1) coupures wifi
> en cours d'usage** (app ouverte, opérateur connecté). Le démarrage à froid hors ligne (B2) et les
> photos offline (C) sont hors périmètre.

## 1. Contexte & objectif

L'atelier travaille en wifi qui peut couper. Le module Flashage (A, livré, `origin/main=d28daf9`)
écrit des pointages (`heures_flashees`) et coche des pièces (`pieces.fait`). Exigence client :
**aucun pointage ni cochage perdu** quand le wifi tombe **pendant** le travail, avec
**resynchronisation automatique** au retour du réseau — y compris si la page est rechargée pendant
la coupure.

**Cas couvert (B1)** : l'app est déjà ouverte, l'opérateur déjà connecté ; le réseau tombe puis
revient. **Hors périmètre** : rouvrir l'app à froid sans réseau (B2, dépend de l'expiration du jeton
Supabase) ; cache de gros volumes ; photos (C).

## 2. État actuel (vérifié)

- `src/main.tsx` : `const queryClient = new QueryClient()` (sans options) ; `QueryClientProvider` >
  `BrowserRouter` > `AuthProvider` > `App`.
- `@tanstack/react-query ^5.101.1`. **Aucune** dépendance PWA/persist installée.
- `vite.config.ts` : `plugins: [react(), tailwindcss()]` + `test.env` (clé publishable pour la CI).
- Mutations atelier existantes : `useFlasherHeures` (`src/modules/flashage/useHeuresFlashees.ts`,
  insert `heures_flashees`), `useTogglePieceFait` (`src/modules/formulaire/usePieces.ts`,
  update `pieces.fait/fait_par/fait_date`). Auth : `useAuth()` → `{ session, profil:{nom,role}, ... }`
  (l'UUID opérateur = `session.user.id`).
- `heures_flashees.id` = `uuid default gen_random_uuid()` → on peut fournir l'id côté client.

## 3. Architecture — 4 briques

### Brique 1 — File de mutations (React Query, natif)
React Query v5 en `networkMode: 'online'` (défaut) **met en pause** toute mutation lancée hors ligne
(détection via `onlineManager` ⇐ `navigator.onLine` + events `online`/`offline`) et la **reprend**
automatiquement au retour réseau. Couvre le cas « coupure sans reload » sans code custom.

### Brique 2 — Persistance (survivre au reload pendant la coupure)
- Dépendances : `@tanstack/react-query-persist-client`, `@tanstack/query-sync-storage-persister`.
- `src/lib/queryClient.ts` (nouveau) : exporte un `queryClient` configuré
  (`defaultOptions.queries.gcTime` ≥ maxAge de persistance, ex. 24 h) et le `persister`
  (`createSyncStoragePersister({ storage: window.localStorage, key: 'hans-erp-rq' })`).
- `main.tsx` : remplacer `QueryClientProvider` par `PersistQueryClientProvider` avec
  `persistOptions={{ persister, maxAge: 1000*60*60*24 }}` et
  `onSuccess={() => queryClient.resumePausedMutations()}`.
- Effet : le **cache de lecture** (codes tâches, affaires flashables, pièces) ET les **mutations en
  pause** sont écrits en localStorage → après un reload hors-ligne, la page Flashage se réaffiche et
  la file est rejouée au retour réseau.

### Brique 3 — Mutations rejouables + idempotence
Une mutation persistée puis rejouée après reload a besoin de retrouver sa `mutationFn`
(non sérialisable) → on l'enregistre au boot via `setMutationDefaults`.
- `src/lib/offlineMutations.ts` (nouveau) : `registerOfflineMutationDefaults(queryClient)` appelée
  une fois au démarrage (dans `main.tsx`, avant le render). Enregistre :
  - `setMutationDefaults(['flasher-heures'], { mutationFn: (input: FlashInput) => upsertFlash(supabase, input), onSuccess: invalider ['heures_flashees'] })`.
  - `setMutationDefaults(['cocher-piece'], { mutationFn: (vars) => updatePieceFait(supabase, vars), onSuccess: invalider ['pieces', affaireId] })`.
- Hooks refactorés pour consommer les defaults :
  - `useFlasherHeures()` → `useMutation({ mutationKey: ['flasher-heures'] })` (plus de `mutationFn` inline).
  - `useTogglePieceFait()` → `useMutation({ mutationKey: ['cocher-piece'] })`.
  - Les fonctions pures `upsertFlash`/`updatePieceFait` vivent dans `offlineMutations.ts` (ou les
    modules respectifs) et sont importées par les defaults — **une seule source de vérité**.
- **Idempotence (anti-doublon au rejeu)** :
  - `FlashInput` reçoit désormais un **`id: string` généré côté client** (`crypto.randomUUID()` au
    moment du clic ARRÊTER). L'insert devient `upsert(input, { onConflict: 'id', ignoreDuplicates: true })`.
    Un rejeu en double (mutation déjà appliquée côté serveur mais ack perdu) ne crée pas de doublon.
  - Le cochage (`update pieces set fait... where id=`) est **naturellement idempotent**.

### Brique 4 — Indicateur réseau
- `src/lib/useOnlineStatus.ts` (nouveau) : `useOnlineStatus()` → `boolean`, basé sur
  `onlineManager.subscribe` / `onlineManager.isOnline()`.
- `src/components/layout/OfflineBanner.tsx` (nouveau) : bandeau discret rendu dans le shell
  (`AppShell`). Hors ligne → « Hors ligne — N opération(s) en attente » où N = nombre de mutations en
  pause (`queryClient.getMutationCache().getAll().filter(m => m.state.isPaused).length`, rafraîchi via
  `useIsMutating` ou un abonnement au mutation cache). En ligne et N=0 → rien.

### Brique 5 — PWA installable
- Dépendance : `vite-plugin-pwa`.
- `vite.config.ts` : ajouter `VitePWA({ registerType: 'autoUpdate', manifest: {...}, workbox: {
  navigateFallback: '/index.html', globPatterns: ['**/*.{js,css,html,svg,png,woff2}'] } })`.
- `manifest` : `name`/`short_name` (« HANS COFFRAGE ERP »), `display: 'standalone'`,
  `theme_color`/`background_color` (thème C), icônes 192/512 (`public/`).
- Effet : app shell précaché → l'app se recharge même hors-ligne ; installable sur la tablette.

### Détail auth (robustesse offline)
Au reload hors-ligne, `supabase.auth.getSession()` relit le jeton en localStorage (valide car l'op
vient de travailler) → l'app remonte. `fetchProfil()` peut échouer offline → pour conserver
`profil.nom` (utilisé par `fait_par`), `AuthProvider` **met en cache le dernier profil connu** en
localStorage (`hans-erp-profil`) et le réutilise si le re-fetch échoue. Petit ajout ciblé, pas de
refonte de l'auth.

## 4. Data flow (coupure type)

1. Op flashe / coche → mutation lancée.
2. Si offline : `onlineManager` met la mutation en pause ; bannière « Hors ligne — 1 en attente » ;
   l'UI optimiste (invalidations) reste cohérente avec le cache persisté.
3. Reload pendant la coupure (optionnel) : `PersistQueryClientProvider` réhydrate cache + mutations ;
   `setMutationDefaults` redonne les `mutationFn` ; la file reste en attente.
4. Réseau revient → `onlineManager` → `resumePausedMutations()` → upsert/update rejoués
   (idempotents) → invalidations → données à jour ; bannière disparaît.

## 5. Fichiers (création / modification)

| Fichier | Rôle |
|---|---|
| `src/lib/queryClient.ts` (créer) | QueryClient configuré (gcTime) + persister localStorage |
| `src/lib/offlineMutations.ts` (créer) | `upsertFlash`/`updatePieceFait` purs + `registerOfflineMutationDefaults` |
| `src/lib/useOnlineStatus.ts` (créer) | Hook état réseau (onlineManager) |
| `src/components/layout/OfflineBanner.tsx` (créer) | Bandeau « Hors ligne — N en attente » |
| `src/main.tsx` (modifier) | `PersistQueryClientProvider` + register defaults au boot |
| `src/modules/flashage/useHeuresFlashees.ts` (modifier) | `FlashInput`+`id`, `useFlasherHeures` via mutationKey, `upsertFlash` |
| `src/modules/formulaire/usePieces.ts` (modifier) | `useTogglePieceFait` via mutationKey, `updatePieceFait` |
| `src/modules/flashage/FlashagePage.tsx` (modifier) | génère `id: crypto.randomUUID()` au clic ARRÊTER |
| `src/components/layout/AppShell.tsx` (modifier) | monte `<OfflineBanner/>` |
| `src/auth/AuthProvider.tsx` (modifier) | cache localStorage du dernier profil connu |
| `vite.config.ts` (modifier) | plugin `VitePWA` + manifest |
| `public/` | icônes PWA 192/512 + favicon |

## 6. Hors périmètre (YAGNI)

- **Démarrage à froid hors-ligne (B2)** : gestion de l'expiration du jeton Supabase, login offline.
- **IndexedDB** : localStorage suffit au volume Flashage ; migration ultérieure si besoin.
- **Photos offline (C)** : binaires + upload différé → sous-projet dédié.
- **Sync conflictuelle complexe** : on s'appuie sur l'idempotence par id + l'ordre des mutations.

## 7. Tests

- `offlineMutations` : idempotence — `upsertFlash` appelle `.upsert(..., { onConflict:'id', ignoreDuplicates:true })` ; `updatePieceFait` met `fait/fait_par/fait_date` (mock supabase, comme les `*.fetch.test.ts` existants).
- `useOnlineStatus` : reflète `onlineManager` (mock `onlineManager.setOnline`).
- `OfflineBanner` : rendu conditionnel (offline → message + N ; online & N=0 → rien) avec un `QueryClient` de test et mutations en pause simulées.
- Mutation pausée/reprise : avec `onlineManager.setOnline(false)` une mutation reste en pause ; `setOnline(true)` + `resumePausedMutations` la rejoue (mock supabase).
- PWA : non testable en unit ; vérifié au `pnpm build` (manifest + SW générés) et en preuve navigateur.
- Cible : suite verte (174 actuels + nouveaux), lint/build OK. Rappel piège CI : `test.env` déjà géré ; veiller à ce que les tests passent **sans** `.env.local`.

## 8. Preuve (méthode imposée)

`preview_start` → login ADMIN (Gilles) → `/flashage` →
1. DevTools/onglet réseau « Offline » (ou `onlineManager.setOnline(false)` via console) ;
2. flasher un pointage + cocher une pièce → bannière « Hors ligne — 2 en attente », rien en base ;
3. (option) recharger la page hors-ligne → l'app revient, file toujours en attente ;
4. repasser « Online » → rejeu automatique → **pointage + cochage présents en base** (idempotents :
   pas de doublon même si on déclenche un resume deux fois) ; bannière disparue ;
5. nettoyer les données de test (affaire démo `C26-0701-01` restaurée à 0 flash / 0 pièce faite) ;
6. screenshot/preuve.

Puis build/lint/test verts → merge fast-forward sur `main` → push.

## 9. Découpage pour le plan

1. Deps + `queryClient.ts` (persister) + bascule `main.tsx` vers `PersistQueryClientProvider`.
2. `offlineMutations.ts` (`upsertFlash`/`updatePieceFait` + `registerOfflineMutationDefaults`) + idempotence id client + refacto des 2 hooks + `FlashagePage` (génère l'id).
3. `useOnlineStatus` + `OfflineBanner` + montage dans `AppShell`.
4. Cache profil dans `AuthProvider`.
5. `vite-plugin-pwa` + manifest + icônes.
6. Contrôleur : build/lint/test, preuve navigateur offline→online, nettoyage, merge + push.
