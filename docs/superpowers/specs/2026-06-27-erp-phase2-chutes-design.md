# Module Chutes (chutothèque) — Design (Phase 2)

> Date : 2026-06-27 · ERP HANS COFFRAGE (dépôt ERP_hans-coffrage)
> Port fidèle de `PageChutes` (maquette `hans-erp-deploy/src/App.jsx` l.5159-5380), data réelle,
> **mutations offline-ready** (branchées sur le socle B1, origin/main `37f261b`).

## 1. Objectif

Transformer le module Chutes de la maquette en module réel : déclarer des chutes d'atelier
(restes de panneaux/barres après débit), les stocker, et les **réutiliser** sur d'autres affaires
(entièrement ou partiellement) pour optimiser le prix de revient. UI **fidèle au pixel**, données
Supabase, déclaration/réutilisation **rejouables hors-ligne** (principe atelier offline-first).

## 2. Contexte technique (vérifié)

### Table `chutes` (existante, vide)
`id` uuid, `matiere_code` text, `designation` text, `cat` text, `longueur`/`largeur`/`epaisseur`
numeric, `prix_unit` numeric, `affaire_origine` uuid→affaires, `affaire_consommation` uuid→affaires,
`operateur_id` uuid→auth.users, `statut` enum `chute_statut` (`disponible`/`reutilisee_partiel`/
`consommee`/`rebut`), `created_at`/`updated_at`.

### RLS (en place, inchangée)
- `chutes` SELECT : `true` (lisible par tous).
- `chutes` WRITE (ALL) : `admin|direction|chef_prod|operateur` → l'opérateur peut déclarer/réutiliser.

### Migration nécessaire (historique fidèle)
La table ne porte pas le détail de réutilisation de la maquette. Ajouter :
- `mode_reutilisation` text nullable (`'totale'` | `'partielle'`).
- `reste_jete` boolean not null default false.
- `date_consommation` timestamptz nullable.
- `issu_de` uuid nullable, FK `chutes(id)` (traçabilité : ce reste provient d'une chute réutilisée).
- `unite` text nullable (unité du catalogue conservée à la déclaration, ex. `€/U`, `€/m²`) — nécessaire
  à `valoriserChute` (dépend de l'unité).

### Briques réutilisables
- `catalogue.ts` (`src/modules/formulaire/`) : cascade catalogue `TYPES_MATIERE` / familles / réfs —
  réutilisée pour la modale **Déclarer** (Type→Famille→Réf).
- `useAffaires()` (`src/modules/affaires/`) : liste des affaires pour les `<select>` des modales.
- Socle offline (`src/lib/offlineMutations.ts`, `setupOnlineResume`, `PersistQueryClientProvider`) :
  on y **ajoute** les mutations chutes (defaults + idempotence id client).
- Primitives `src/components/ui/` (`PageHeader`, `Card`, `KPI`, `Btn`, `Badge`), thème `C`,
  `useAuth()` (`profil.nom` + `session.user.id` pour `operateur_id`).

### Logique métier (maquette, à porter fidèlement)
- **Valorisation** : `valoriserChute(c) = surfaceM2 × prixM2` où `surfaceM2 = (longueur/1000)×(largeur/1000)`
  et `prixM2 = prix_unit` si unité `€/m²`, sinon `prix_unit / 3.125` (panneau plein 125×250 = 3,125 m²).
- **Déclarer** : nouvelle chute `statut='disponible'`.
- **Réutiliser** :
  - totale → source `statut='consommee'`, `mode_reutilisation='totale'`, `affaire_consommation`, `date_consommation`.
  - partielle + reste **exploitable** → source `statut='reutilisee_partiel'`, `mode='partielle'`,
    `reste_jete=false` ; **+ nouvelle chute** `disponible` (le reste : `longueur`/`largeur` saisies,
    `issu_de=source.id`, mêmes matière/cat/ép/prix/affaire_origine).
  - partielle + reste **non exploitable** → source `statut='reutilisee_partiel'`, `mode='partielle'`,
    `reste_jete=true` (pas de ligne reste).

## 3. Architecture

Nouveau dossier `src/modules/chutes/`. Route `/chutes` (retirer `chutes` du filtre stub, ajouter route).

### 3.1 Données pures (`chutesData.ts`, TDD)
- `surfaceM2(c): number`.
- `valoriserChute(c): number` où `c` = ligne `chutes` (avec `longueur`, `largeur`, `prix_unit`, `unite`).
  `prixM2 = c.unite === '€/m²' ? prix_unit : prix_unit / 3.125`. À la déclaration, on copie
  `prix_unit` et `unite` depuis le catalogue (`catalogue_matieres.prix` / `.unite`).
- `chutesDispo(rows)` / `chutesConsommees(rows)` (filtre statut), `catsPresentes(rows)`,
  `valeurTotale(rows)`.

### 3.2 Hooks (`useChutes.ts`)
- `useChutes()` : `select *, origine:affaire_origine(numero), conso:affaire_consommation(numero)`
  (alias pour afficher les n° d'affaire). queryKey `['chutes']`.

### 3.3 Mutations offline (dans `src/lib/offlineMutations.ts`)
- Types `DeclarerChuteInput` (avec `id` client) et `ReutiliserChuteVars`
  (`{ id, affaireConsoId, mode, resteJete, reste?: { id, longueur, largeur } }`).
- `insertChute(sb, input)` : `upsert(input, { onConflict:'id', ignoreDuplicates:true })`.
- `reutiliserChuteDb(sb, vars)` : update source (statut/affaire_consommation/mode/reste_jete/date_consommation)
  + si `reste` présent, `upsert` de la nouvelle chute (`issu_de`, statut `disponible`).
- `registerOfflineMutationDefaults` : ajoute `setMutationDefaults(['declarer-chute'])` et
  `(['reutiliser-chute'])` (mutationFn + `onSuccess` → invalide `['chutes']`).
- Idempotence : `id` (déclaration) et `reste.id` générés côté client (`crypto.randomUUID()`).

### 3.4 UI (`ChutesPage.tsx`, port fidèle)
Reproduit `PageChutes` : PageHeader + bandeau « Principe » + 4 KPI + tableau stock filtrable
(boutons cat) + historique réutilisées + **modale Déclarer** (cascade `catalogue.ts` + dims + affaire
origine) + **modale Réutiliser** (affaire dest + totale/partielle + reste exploitable/jeté).
- `declarer` → `useMutation({ mutationKey:['declarer-chute'] })` ; `operateur_id = session.user.id`.
- `reutiliser` → `useMutation({ mutationKey:['reutiliser-chute'] })`.
- Realtime (optionnel, même brique `useRealtimeTable('chutes', [['chutes']])`) pour stock live
  multi-poste — **inclus** (cohérent atelier, brique déjà là).

## 4. Hors périmètre (YAGNI)
- Branchement de la valorisation sur le **Prix de revient** (module PR ultérieur).
- `getChutesCompatibles` (suggestion de chutes dans le Formulaire) — autre module.
- Déclaration de chute depuis le bouton « Déclarer une chute » du Flashage (le bouton navigue déjà
  vers `/chutes` ; l'ouverture directe de la modale est un bonus non requis).

## 5. Tests
- `chutesData` : `surfaceM2`, `valoriserChute` (€/m² et €/U), filtres, `valeurTotale`, `catsPresentes`.
- `useChutes.fetch` + `offlineMutations` chutes (`insertChute` upsert idempotent, `reutiliserChuteDb`
  totale / partielle-exploitable / partielle-jetée) — mock supabase (modèle `affaires.fetch.test.ts`).
- Smoke `ChutesPage`.
- Suite verte (185 + nouveaux), lint/build OK. Rappel CI : tests passent sans `.env.local`.

## 6. Preuve (méthode imposée)
`preview_start` → login ADMIN (Gilles) → `/chutes` :
1. Déclarer une chute (cascade catalogue réelle) → apparaît au stock, KPI à jour, valeur estimée.
2. Réutiliser **totale** → passe à l'historique.
3. Réutiliser **partielle + reste exploitable** → historique + **nouvelle chute** au stock (`issu_de`).
4. (offline) déclarer hors-ligne → bannière « N en attente » → retour réseau (onglet focus) → rejeu en base.
5. Nettoyer les chutes de test (table `chutes` repart vide).
Puis build/lint/test verts → merge ff `main` → push.

## 7. Découpage pour le plan
1. Migration `chutes` (colonnes historique + FK `issu_de`).
2. `chutesData.ts` pur + tests.
3. `useChutes.ts` + mutations chutes dans `offlineMutations.ts` (+ defaults) + tests.
4. `ChutesPage.tsx` (port fidèle) + route `/chutes` + Realtime + smoke.
5. Contrôleur : build/lint/test, preuve navigateur (dont offline), nettoyage, merge + push.
