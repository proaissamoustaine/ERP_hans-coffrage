# Module Flashage + Realtime — Design (Phase 2)

> Date : 2026-06-27 · ERP HANS COFFRAGE (dépôt ERP_hans-coffrage)
> Périmètre validé : **Flashage seul + Realtime** (le module Heures/paie reste un stub).
> Cet incrément est l'étape **(A)** d'une stratégie atelier **offline-first** plus large (cf. §9).

## 0. Vision atelier offline-first (contexte client, 2026-06-27)

L'atelier travaille en **wifi**, qui peut **couper**. Exigence client : tout ce qu'un **opérateur
ou un chef de prod** utilise sur le terrain (flasher ses heures, cocher les pièces faites, prendre
des photos, déclarer une chute) doit **rester opérationnel hors ligne** et se **resynchroniser
automatiquement** au retour du réseau — **aucun pointage ni aucune photo ne doit être perdu**.

C'est une **capacité transverse**, décomposée en sous-projets (ordre validé) :
- **(A) Module Flashage** — data réelle + Realtime. **← LE PRÉSENT SPEC.**
- **(B) Socle offline-first PWA** — app installable (service worker, démarre sans réseau) + cache
  des lectures (référentiels, affaires flashables, pièces) + file de mutations persistante rejouée
  à la reconnexion + bandeau réseau « Hors ligne — N en attente ». Appliqué au Flashage + cochage.
- **(C) Photos offline** — module Photos avec capture, stockage local des binaires (IndexedDB),
  upload différé vers Supabase Storage à la reconnexion.
- (plus tard) Chutes offline-ready sur le même socle.

**Conséquence sur le présent spec** : le module Flashage est construit **online** mais avec des choix
**compatibles offline** (cf. §3.4) pour que le socle (B) s'y greffe sans refonte.

## 1. Objectif

Porter le module **Flashage atelier** de la maquette (`hans-erp-deploy/src/App.jsx`, `PageFlashage` l.5451-5762)
en module réel, **fidèle au pixel**, branché sur les données Supabase, avec **Supabase Realtime**
pour la mise à jour live des pointages et du cochage atelier entre opérateurs.

Règle client impérative : l'UI doit correspondre EXACTEMENT à la maquette. On ne change QUE
la source de données (état React → Supabase) et l'auth (opérateur courant = profil connecté).

## 2. Contexte technique (vérifié)

### Tables réelles concernées
- `heures_flashees` (vide) : `id`, `affaire_id`→affaires, `code_tache`→`taches_codes`,
  `operateur_id`→auth.users, `operateur_nom`, `duree_min` (int), `date` (timestamptz), `created_at`.
- `taches_codes` (44 lignes) : `code`, `label`, `groupe`, `categorie_heures`→`categories_heures`, `facturable`.
- `categories_heures` (4 lignes) : `code`, `label`, `taux`.
- `pieces` (déjà utilisée par le Formulaire) : `fait`, `fait_par`, `fait_date`, `geometrie`, `dimensions`, …
- `etapes_affaire` : enum `etape_cle` ; l'étape `saisie_pieces` à `fait=true` = « formulaire validé ».

### RLS (déjà en place, aucune modification nécessaire)
- `heures_flashees` SELECT : `is_staff() OR operateur_id = auth.uid()`
  → un opérateur ne voit QUE ses pointages ; admin/direction/compta/chef_prod/BE voient tout.
- `heures_flashees` WRITE : `admin|direction|chef_prod OR operateur_id = auth.uid()`
  → un opérateur peut insérer SES propres pointages.
- `taches_codes` / `categories_heures` SELECT : `true` (lisibles par tous).

### Définition « affaire flashable »
Maquette : `affaires.filter(a => formulaireValideByAffaire[a.numero])`.
Réel : affaires dont l'étape `saisie_pieces` est `fait=true` (cf. `useValiderFormulaire`,
`src/lib/etapes.ts`). L'affaire démo `C26-0701-01` (BOUYGUES) a son formulaire validé → flashable.

### Hooks/briques réutilisables (déjà au repo)
- `usePieces(affaireId)`, `useTogglePieceFait()` (`fait_par = profil.nom`) — pour la fiche atelier cochable.
- `useAffaires()`, `useEtapes(affaireId)` — pour dériver les affaires flashables.
- Primitives UI : `TypeBadge`, `ProgressBar`, `Badge`, `Card`, `PageHeader`, `Logo` (`src/components/ui/`).
- `useAuth()` → `profil` (`id`, `nom`, `role`).

## 3. Architecture

Nouveau dossier `src/modules/flashage/`. Route `/flashage` (déjà dans la nav — aujourd'hui `StubPage`).

### 3.1 Couche données (TDD — sous-agent data, sonnet)

**`flashageData.ts`** (fonctions pures, testées) :
- `fmtChrono(ms: number): string` → `"HH:MM:SS"` (sec ≥ 0, padding 2).
- `fmtDuree(min: number): string` → `"Xh MM"` (ex. 90 → `"1h 30"`).
- `totalMinutes(flashs, predicate): number` → somme `duree_min` filtrée (KPI Aujourd'hui / Semaine).
- `estAujourdhui(dateISO)`, `estCetteSemaine(dateISO)` → prédicats date (semaine ISO lun→dim).
- `groupTaches(rows): { groupe, codes }[]` → groupe `taches_codes` par `groupe`, ordre stable.
- `estFlashable(etapes): boolean` → l'étape `saisie_pieces` est faite.
- `dureeMinDepuis(startMs, nowMs): number` → `max(1, round((now-start)/60000))` (fidèle maquette).

**`useTaches.ts`** : `useTaches()` (fetch `taches_codes` ordonné) + `useCategoriesHeures()`
(fetch `categories_heures`, pour les libellés/badges). React Query, `staleTime` long (référentiel).

**`useHeuresFlashees.ts`** :
- `useHeuresFlashees()` : liste des pointages (RLS-aware ; tri `date` desc). queryKey `['heures_flashees']`.
- `useFlasherHeures()` : mutation insert
  `{ affaire_id, code_tache, operateur_id: profil.id, operateur_nom: profil.nom, duree_min,
  date: <ISO fixé côté client au moment de l'arrêt> }`.
  `onSuccess` → invalide `['heures_flashees']`.
  **Compat offline (B)** : la `date` est fixée **côté client** (pas `default now()` serveur) pour
  qu'un pointage rejoué après reconnexion porte l'heure réelle du pointage, pas celle du flush.

**`useAffairesFlashables.ts`** : `useAffairesFlashables()` retourne les affaires dont l'étape
`saisie_pieces` est faite (jointure affaires × etapes_affaire, ou filtre côté client à partir
des hooks existants — au choix de l'implémentation, le plus simple/testable).

**`useRealtimeTable.ts`** : **brique Realtime générique réutilisable**.
- Signature : `useRealtimeTable(table: string, queryKeys: QueryKey[])`.
- `useEffect` : `supabase.channel(...).on('postgres_changes', { event: '*', schema: 'public', table }, …)`
  → à chaque event, `queryClient.invalidateQueries` sur chaque queryKey ; cleanup `removeChannel`.
- Appliquée dans `FlashagePage` à **`heures_flashees`** (pointages live, queryKey `['heures_flashees']`)
  **et `pieces`** (cochage atelier live entre opérateurs, queryKey `['pieces', <affaireFiche>]`).

### 3.2 UI (port fidèle au pixel — sous-agent UI, opus)

**`FlashagePage.tsx`**, route `/flashage`. Reproduit `PageFlashage` (App.jsx 5451-5762) :

- **PageHeader** « Flashage atelier » + sous-titre + bouton « Déclarer une chute » (→ stub/route chutes
  si absente : bouton présent mais sans action de navigation tant que le module Chutes n'existe pas —
  fidélité visuelle conservée).
- **Colonne « tablette »** (`w-400`, fond `#1A1A1A`, écran `bgWarm` h-600) — machine à états :
  - `idle` : bandeau salarié (`profil.nom` + initiales), KPI **Aujourd'hui / Semaine** calculés du
    réel (`totalMinutes` sur les pointages de l'opérateur), barre d'avancement vs **36h30** (objectif
    hebdo de référence, fidèle maquette) ; liste des **affaires flashables** ; message vide fidèle si 0.
  - `tache` : encart affaire sélectionnée + grille des codes tâches des **3 premiers groupes**
    (`groupTaches(...).slice(0,3)`), tap → démarre le pointage.
  - `actif` : chrono live `setInterval` 1 s (`fmtChrono(now-start)`), récap affaire+tâche,
    bouton « ARRÊTER LE POINTAGE » → `useFlasherHeures` (durée `dureeMinDepuis`), bouton Annuler.
- **Colonne droite** :
  - **Fiche atelier cochable** : `usePieces(ficheAff)` filtré `type !== 'Main_Oeuvre'`, avancement
    (n faites / total + %), cases à cocher → `useTogglePieceFait` (`fait_par = profil.nom`).
    Sélecteur d'affaire flashable. Realtime `pieces` → cochage visible live entre opérateurs.
  - **Pointages enregistrés (tous opérateurs)** : liste réelle `useHeuresFlashees`, badge count,
    pastille selon `categorie_heures`, `fmtDuree`. Live via Realtime `heures_flashees`.
    (Note RLS : un opérateur n'y voit que ses pointages ; le staff voit tout. En démo ADMIN = tout.)
  - **Référentiel codes-barres tâches** : tous les `taches_codes` groupés par `groupe`, badge couleur
    par `categorie_heures` (DESSIN/MACHINE/MONTAGE/AUTRES), **count dynamique** (44, pas le « 43 »
    en dur de la maquette).

### 3.4 Choix « compatibles offline » (pour préparer le socle B, sans le construire ici)

Le module Flashage est **online** dans cet incrément, mais on évite tout choix qui obligerait à le
réécrire quand le socle offline (B) arrivera :
- **Horodatages côté client** : `heures_flashees.date` (à l'arrêt) et `pieces.fait_date` (au cochage)
  fixés côté client → un rejeu différé reste correct. (`fait_date` l'est déjà.)
- **Mutations idempotentes / rejouables** : pas de dépendance à une valeur calculée par le serveur
  avant l'affichage ; les inserts/updates restent des opérations simples rejouables telles quelles.
- **Toute lecture passe par React Query** (queryKeys stables) → le cache persistant et la file de
  mutations en pause (B) se brancheront sur la config du `QueryClient` sans toucher au module.
- **Aucune brique offline n'est livrée ici** (pas de service worker, pas de persistance localStorage,
  pas d'IndexedDB) — YAGNI ; cela relève des sous-projets (B) et (C).

### 3.3 Migration

`apply_migration` :
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.heures_flashees;
ALTER PUBLICATION supabase_realtime ADD TABLE public.pieces;
```
(Idempotence : vérifier d'abord si la table est déjà publiée pour éviter l'erreur de doublon.)

## 4. Data flow

1. Opérateur ouvre `/flashage` → liste des affaires flashables (étape `saisie_pieces` faite).
2. Sélectionne affaire → tâche → ARRÊTER → insert `heures_flashees` (operateur_id = lui).
3. Realtime `heures_flashees` → la liste « Pointages enregistrés » se met à jour chez tous les
   abonnés autorisés (staff voit tout, opérateur voit les siens).
4. Coche une pièce dans la fiche atelier → `pieces.fait` ; Realtime `pieces` → les autres opérateurs
   voient le cochage live.
5. Les pointages alimentent (déjà) l'onglet « Heures réelles flashées » de la fiche affaire (à vérifier
   au passage que la valorisation MO réelle s'affiche — hors périmètre d'implémentation ici, mais
   c'est le débouché métier).

## 5. Hors périmètre (YAGNI)

- Module **Heures** (paie/RH : hebdo, mensuel, catégorisation MO, trajets, indemnités, absences) →
  reste `StubPage`. À traiter dans l'incrément RH/Admin.
- Persistance du chrono en cours sur reload (la maquette ne le fait pas non plus → state local).
- Valorisation MO par catégorie dans le module Flashage (relève du Prix de revient, déjà partiellement
  branché côté fiche affaire).
- Scan code-barres physique (la maquette simule au tap ; pas de hardware).

## 6. Tests

- **Data layer pur** (TDD strict) : `fmtChrono`, `fmtDuree`, `totalMinutes`, `estAujourdhui`/
  `estCetteSemaine` (dates injectables), `groupTaches`, `estFlashable`, `dureeMinDepuis`.
- **Hooks fetch** : fichiers `*.fetch.test.ts` (rappel piège CI : `test.env` dans `vite.config.ts`
  charge l'env Supabase — les tests qui importent les hooks doivent passer SANS `.env.local`).
- Cible : conserver la suite verte (155 tests actuels → ajout des nouveaux), lint + build OK.

## 7. Preuve (méthode imposée)

`preview_start` → login **ADMIN (Gilles TUAILLON)** → vérifier :
1. `/flashage` rend la tablette fidèle, affaire flashable `C26-0701-01` visible ;
2. démarrer/arrêter un pointage → ligne réelle dans « Pointages enregistrés » + chrono live ;
3. cocher une pièce → `pieces.fait` mis à jour ;
4. (Realtime) idéalement deux onglets/contexte pour montrer la propagation live ;
5. **nettoyer les données de test** (supprimer les pointages créés, décocher la pièce) ;
6. screenshot de preuve.

Puis : build/lint/test verts → merge fast-forward sur `main` → push.

## 8. Découpage en tâches (pour le plan)

1. (data) `flashageData.ts` pur + tests.
2. (data) `useTaches` / `useCategoriesHeures` + `useHeuresFlashees`/`useFlasherHeures` + `useAffairesFlashables` + `useRealtimeTable`.
3. (migration) publication Realtime `heures_flashees` + `pieces`.
4. (UI) `FlashagePage` port fidèle + route `/flashage`.
5. (contrôleur) relecture, build/lint/test, preuve navigateur ADMIN, nettoyage, merge + push.

## 9. Suite — roadmap offline-first (specs/plans dédiés, hors présent incrément)

Ordre validé par le client le 2026-06-27 :

- **(B) Socle offline-first PWA** (incrément suivant, spec dédié) :
  - PWA installable sur tablette : `manifest`, service worker (p. ex. `vite-plugin-pwa`/Workbox),
    app shell mis en cache → démarre sans réseau, plein écran, icône.
  - Persistance React Query (`@tanstack/react-query-persist-client` + storage) : cache des lectures
    (référentiels, affaires flashables, pièces) disponible hors ligne.
  - File de mutations persistée + `resumePausedMutations()` au retour réseau (`onlineManager`) →
    pointages et cochages rejoués automatiquement, sans perte, même après reload.
  - Indicateur réseau global + compteur « N opérations en attente ».
  - Appliqué d'abord au **Flashage** (pointages) et au **cochage fiche atelier**.
- **(C) Photos offline** (spec dédié) : construire le module Photos avec capture, stockage local des
  binaires (IndexedDB) en attente, **upload différé** vers Supabase Storage à la reconnexion.
- (plus tard) **Chutes** offline-ready sur le même socle ; idem tout futur module à usage atelier.

Principe directeur : **chaque module à usage atelier (opérateur/chef de prod) doit naître
offline-ready** une fois le socle (B) en place.
