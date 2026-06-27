# Colisage + Pesée (logistique, incrément 1) — Design (Phase 2)

> Date : 2026-06-27 · ERP HANS COFFRAGE (dépôt ERP_hans-coffrage)
> Port fidèle de `PageColisage` (App.jsx l.7062-7234) et `PagePesee` (l.7237-7298), data réelle
> (table `colis`), mutations **offline-ready** (socle B1, origin/main `c5bf29e`).
> Premier incrément du « module logistique » ; **Livraisons + Transport = incrément 2** (hors périmètre).

## 1. Objectif

Permettre à l'atelier (tablette) de **coliser** une affaire : créer des colis (L/l/h + poids), les
lister, et **peser** les colis (renseigner/mettre à jour le poids). La création d'un colis **déclenche
l'étape `colisage`** de l'affaire. UI fidèle au pixel ; création/pesée **rejouables hors-ligne**.

## 2. Contexte technique (vérifié)

### Table `colis` (existante, vide)
`id` uuid, `affaire_id` uuid→affaires, `numero` int, `longueur`/`largeur`/`hauteur`/`poids` numeric,
`date` timestamptz default now().

### RLS (en place)
- `colis` SELECT : `true`. WRITE (ALL) : `admin|direction|chef_prod|operateur` → l'opérateur colise/pèse.

### Étapes
`etapes_affaire` porte l'enum `colisage`. Les 11 étapes sont semées à la création de l'affaire
(`initialEtapes`), donc l'étape `colisage` **existe toujours** → un simple `update ... where affaire_id
and etape='colisage' set fait=true` la marque (idempotent, pas d'insert).

### Briques réutilisables
- `useAffaires()` (liste affaires pour les `<select>`).
- Socle offline (`src/lib/offlineMutations.ts` : defaults + idempotence id client).
- `useRealtimeTable('colis', …)`.
- Primitives `src/components/ui/`, thème `C`, `useAuth()`.

### Unités (fidélité maquette)
Le bloc « Ajouter un colis » saisit le **poids en kg** ; d'autres blocs maquette affichent des **tonnes**
(`0.860 t`). On **stocke `poids` en kg** et on affiche fidèlement par bloc (t = kg/1000). Dimensions en
**cm** (saisie maquette « Long (cm) »).

## 3. Architecture

Nouveau dossier `src/modules/colisage/`. Routes `/colisage` et `/pesee` (retirer `colisage`/`pesee` du
filtre stub, ajouter 2 routes).

### 3.1 Données pures (`colisData.ts`, TDD)
- `nextNumeroColis(colisAffaire): number` = `max(numero ?? 0) + 1` (1 si aucun).
- `totalPoids(rows): number` (somme `poids`).
- `colisDuJour(rows, ref?: Date): ColisRow[]` (même jour que `ref`, défaut now, sur `date`).
- `groupByAffaire(rows): { affaireId, colis }[]` (ou Map) pour la liste par affaire.
- `fmtTonnes(kg): string` = `(kg/1000).toFixed(3)` (affichage t fidèle).

### 3.2 Hooks (`useColis.ts`)
- `useColis()` : `select *, affaire:affaire_id(numero)` ordonné `date` desc. queryKey `['colis']`.
- `useCreerColis()` / `usePeserColis()` via `useMutation({ mutationKey })` (defaults du socle).

### 3.3 Mutations offline (`offlineMutations.ts`)
- `CreerColisInput = { id, affaire_id, numero, longueur, largeur, hauteur, poids }`.
- `PeserColisVars = { id, affaireId?, poids, longueur?, largeur?, hauteur? }`.
- `insertColis(sb, input)` : `upsert(input, { onConflict:'id', ignoreDuplicates:true })` PUIS
  `update etapes_affaire set fait=true, date=now where affaire_id=input.affaire_id and etape='colisage'`.
- `peserColis(sb, vars)` : `update colis set poids(/dims) where id`.
- `registerOfflineMutationDefaults` : ajoute defaults `['creer-colis']` et `['peser-colis']`
  (`onSuccess` → invalide `['colis']`, et pour creer aussi `['etapes', affaire_id]`/`['affaires']`).
- Idempotence : `id` uuid client.

### 3.4 UI Colisage (`ColisagePage.tsx`, port fidèle)
Reproduit `PageColisage` : PageHeader « Colisage » + carte **« Ajouter un colis pour une affaire »**
(select `useAffaires` + L/l/h/poids → `useCreerColis().mutate({ id: crypto.randomUUID(), affaire_id,
numero: nextNumeroColis(colisDeCetteAffaire), longueur, largeur, hauteur, poids })`) + liste **colis
réels par affaire** (`useColis` groupé) + carte **« Colis du jour »** (réel, `colisDuJour`). Modale
« Nouveau colis » (même formulaire). Blocs maquette sans équivalent base (fiche colisage détaillée
*cerclage/film/élingues/contenu*, *aperçu étiquette A5*, *bouton BL*) → **stub propre / badge « Démo »**.

### 3.5 UI Pesée (`PeseePage.tsx`, port fidèle)
Reproduit `PagePesee` : PageHeader « Pesée des colis » + carte balance (sélection d'un colis non pesé
ou à repeser → affichage gros chiffre du `poids` courant + dims → saisie → **« Valider la pesée »** =
`usePeserColis().mutate({ id, affaireId, poids, longueur, largeur, hauteur })`) + carte **« Pesées du
jour »** (réel) + total journée (`totalPoids`).

### 3.6 Realtime
`useRealtimeTable('colis', [['colis']])` dans les 2 pages.

## 4. Hors périmètre (YAGNI)
- **Livraisons**, **Transport**, **BL**, **étiquette A5**, **commande transport** → incrément 2.
- Champs maquette absents de la table (`cerclage`, `film`, `élingues`, `contenu détaillé`,
  statut OK/En cours) → démo honnête, pas de migration.

## 5. Tests
- `colisData` : `nextNumeroColis`, `totalPoids`, `colisDuJour` (date injectable), `groupByAffaire`, `fmtTonnes`.
- `useColis.fetch` + `offlineMutations` colis (`insertColis` upsert + update étape, `peserColis` update) — mock supabase (modèle `affaires.fetch.test.ts`).
- Smoke `ColisagePage` + `PeseePage`.
- Suite verte (198 + nouveaux), lint/build OK. Tests sans `.env.local`.

## 6. Preuve (méthode imposée)
`preview_start` → login ADMIN (Gilles) → `/colisage` :
1. Ajouter un colis sur `C26-0701-01` (L/l/h + poids) → en base (`select * from colis`), n° = 1,
   **étape colisage `fait=true`**, apparaît dans la liste + « Colis du jour ».
2. `/pesee` → sélectionner le colis → valider une pesée (poids modifié) → `colis.poids` mis à jour, « Pesées du jour ».
3. (offline, onglet focus) créer un colis hors-ligne → bannière « N en attente » → retour réseau → rejeu en base.
4. Nettoyer : `delete from colis where affaire_id = (select id from affaires where numero='C26-0701-01')` ; remettre l'étape `colisage` à `fait=false` pour l'affaire démo.
Puis build/lint/test verts → merge ff `main` → push.

## 7. Découpage pour le plan
1. `colisData.ts` pur + tests.
2. `useColis.ts` + mutations colis dans `offlineMutations.ts` (+ defaults) + tests.
3. `ColisagePage.tsx` + `PeseePage.tsx` (port fidèle) + routes `/colisage` `/pesee` + Realtime + smokes.
4. Contrôleur : build/lint/test, preuve navigateur (dont offline), nettoyage, merge + push.
