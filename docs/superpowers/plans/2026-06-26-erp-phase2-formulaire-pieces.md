# Phase 2 — Module Formulaire / Pièces (vrai module, multi-incréments)

**Date** : 2026-06-26
**Base** : `main` (`b2ba492`)
**Méthode** : subagent-driven + TDD + preuve navigateur + nettoyage des données de test.

## Contexte
Premier **vrai module métier** (pas un re-skin). Réf maquette : `PageFormulaire`
(`hans-erp-deploy/hans-erp-deploy/src/App.jsx`, à partir de l.8327) — le plus complexe :
saisie des pièces d'une affaire via le **catalogue 315 réfs**, en cascade, avec
géométries/angles, calculs (longueur max, % chute), MO, validation de la fiche, puis
cochage atelier par opérateur. Alimente le **Prix de revient** (onglet PR de la fiche).

## Données réelles (déjà en base)
- `catalogue_matieres` : **315 lignes**. Colonnes : `code` (NN), `cat` (NN), `famille`,
  `ref`, `prix` (NN), `unite`, `code_unite`, `chute` (NN, %), `prefixe`, `epaisseur`.
  Cascade = **cat → famille → ref/code**.
- `pieces` : **0 ligne**. Colonnes : `affaire_id` (NN), `type` (NN), `ref1`, `ref2`,
  `designation`, `matiere_code`, `section_finie`, `nb` (NN), `geometrie`,
  `dimensions` (jsonb), `prix`, `unite`, `pourcent_chute` (NN), `fait` (NN),
  `fait_par`, `fait_date`, `created_at`/`updated_at`/`created_by`.

## Découpage en incréments

### Incrément A — Fondation données (CETTE étape, scope-indépendant)
- `src/modules/formulaire/useCatalogue.ts` : `useCatalogue()` (fetch les 315
  `catalogue_matieres`, React Query, clé `['catalogue']`).
- `src/modules/formulaire/catalogue.ts` (fonctions pures, TDD) : `categories(cat[])`,
  `familles(cat[], categorie)`, `refsFor(cat[], categorie, famille)` (cascade distincte
  triée), `prefixeToChute(prefixe)` (% chute auto par préfixe), `pieceTotal(piece)`
  (matière : `prix × nb × (1+chute)` ; MO : `prix × nb`).
- `src/modules/formulaire/usePieces.ts` : `usePieces(affaireId)` (fetch pièces),
  `useCreatePiece()` (insert), `useDeletePiece()`, `useTogglePieceFait()` (coche
  atelier : `fait`/`fait_par`/`fait_date`). Invalident `['pieces', affaireId]`.
- `src/modules/formulaire/pieceSchema.ts` (zod) : champs persistés.
- Tests : cascade + `pieceTotal` + schema (TDD strict). DoD : tests/lint/build verts.

### Incrément B — Saisie de base (UI) — *périmètre à valider avec le client*
PageFormulaire route `/formulaire` : sélecteur d'affaire, formulaire d'ajout de pièce
(type, **cascade matière** depuis le catalogue, `nb`, géométrie **standard** + MO,
% chute auto/override), tableau des pièces, édition/suppression. Fidèle à la maquette
mais limité d'abord à la géométrie **standard** + MO.

### Incrément C — Géométries complètes + validation
Géométries type1/type2/type3 (angles, rives), calcul longueur max, validation de la
fiche (→ étape `saisie_pieces`/`pr_valide`), **branchement de l'onglet PR de la fiche
affaire sur les vraies pièces** (remplace l'état vide « Aucune pièce saisie »).

### Incrément D — Fiche atelier (cochage opérateur)
Cochage `fait`/`fait_par`/`fait_date` par opérateur (module « Fiche atelier »),
impression de la fiche.

## Vérif (chaque incrément)
test/lint/build + relecture contrôleur + preuve navigateur (login **admin**, affaire +
pièces de test, screenshot, **suppression des données de test**) + merge FF + push.
