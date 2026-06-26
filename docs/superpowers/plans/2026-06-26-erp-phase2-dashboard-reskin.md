# Phase 2 — Re-skin du Dashboard (fidèle à la maquette)

**Date** : 2026-06-26
**Branche** : `feat/dashboard-reskin` (base `9bf7e43`)
**Méthode** : subagent-driven + TDD + preuve navigateur + nettoyage des données de test.

## Objectif

Porter l'UI **EXACTE** de `PageDashboard` de la maquette
(`hans-erp-deploy/hans-erp-deploy/src/App.jsx`, lignes 2684–2828) dans
`src/modules/dashboard/DashboardPage.tsx`. **RÈGLE DE FIDÉLITÉ** : le client doit
reconnaître l'app au pixel → on ne change QUE la couche data/auth. La structure
visuelle, les couleurs (`C`), la typo (Georgia), les espacements restent identiques.

Le `DashboardPage.tsx` actuel n'est que le stub d'échafaudage (titre + carte
« Bonjour ») — il est **entièrement remplacé**.

## Anatomie de la maquette (10 widgets) et stratégie data

| # | Widget maquette | Source | Décision |
|---|-----------------|--------|----------|
| 1 | En-tête « Vue d'ensemble / Bonjour {prénom} » + date | `useAuth().profil`, date réelle | **RÉEL** : prénom = `profil.nom.split(' ')[0]` ; date du jour `fr-FR` ; semaine ISO calculée |
| 2 | KPI « Affaires actives » | `useAffaires` | **RÉEL** : nb affaires `statut === 'En cours'` |
| 3 | KPI « CA en cours (HT) » | `useAffaires` | **RÉEL** : Σ `total_ht` des affaires en cours, formaté `k€` |
| 4 | KPI « Heures semaine » | module Heures absent | **STUB** : garde le visuel, valeur démo + marqueur `démo` |
| 5 | KPI « Livraisons à venir » | module Livraisons absent | **STUB** : idem |
| 6 | « Affaires prioritaires » (liste 5) | `useAffaires` | **RÉEL** : 5 affaires triées par `date_livraison` asc ; états loading/empty |
| 7 | « Alertes critiques » (ruptures stock) | module Stock absent | **STUB** : visuel maquette conservé + badge `Démo` ; lien → `/stock` |
| 8 | « Activité atelier · live » (flashage) | module Flashage absent | **STUB** : visuel + badge `Démo` |
| 9 | « Répartition heures » | module Heures absent | **STUB** : visuel + badge `Démo` |
| 10 | « Prochaines livraisons » | module Livraisons absent | **STUB** : visuel + badge `Démo` |

**Principe stub** = « stubber proprement » : on **conserve le visuel exact** de la
maquette (pour la fidélité) mais chaque widget non encore branché porte un marqueur
`Démo` discret et cohérent (primitive `Badge`, `bg={C.accentSoft}` `color="#8B6914"`),
de sorte qu'il est visuellement fidèle ET honnête (chiffres illustratifs jusqu'à ce
que le module existe). Les liens (`onNav('x')`) deviennent des liens react-router
(`/affaires`, `/stock`, etc. — toutes ces routes existent en stub).

## Substrat existant (déjà en place, à réutiliser)

- `useAffaires()` → lignes `affaires` + `clients(nom)` jointes. Champs : `numero`,
  `mode` (enum), `clients.nom`, `chantier`, `avancement`, `statut`, `total_ht`,
  `date_livraison`.
- Primitives `src/components/ui/` : `KPI` (icon/label/value/color/sub — **pas** de
  `trend`), `Card` (prop `noPadding`), `Badge`, `Btn`, `Spinner`, `Stub`.
- `C` (theme), `NAV` (routes). Test harness : `vi.mock` des hooks + `<MemoryRouter>`.
- `AffairesPage.tsx` contient **inline** `TypeBadge`, `ProgressBar`, et un pill de
  statut + `MODE_CFG`/`STATUT_BG`/`statutStyle`/`formatDate` — à **extraire** (Task 1).

---

## Task 1 — Extraire les primitives partagées (TDD)

Le Dashboard a besoin de `TypeBadge`, `ProgressBar` et d'un badge de statut, déjà
écrits (inline) dans `AffairesPage.tsx`. Les extraire en primitives partagées pour
éviter la duplication, et refactorer `AffairesPage` pour les consommer.

**À créer** (avec tests unitaires écrits AVANT le code, TDD strict) :
- `src/components/ui/ProgressBar.tsx` — `({ value, height?, color? })`. Barre
  `C.accent` par défaut, largeur `min(value,100)%`. Test : rend une barre dont la
  largeur reflète `value` (clamp à 100).
- `src/components/ui/TypeBadge.tsx` — `({ mode })`. Carré coloré lettre + label
  d'après `MODE_CFG`. Déplacer `MODE_CFG` ici (exporté). Test : `mode="coffrage"`
  → lettre `C` + label `COFFRAGE` ; mode inconnu → `?`.
- `src/components/ui/StatusBadge.tsx` — `({ statut })`. Pill arrondi coloré d'après
  la table de statuts. Déplacer `STATUT_BG`/`statutStyle` ici (exportés). Test :
  `statut="En cours"` rend le texte « En cours » avec un fond ; statut inconnu →
  fallback gris.

**Refactor** : `AffairesPage.tsx` importe ces 3 primitives, supprime les définitions
inline et les maps dupliquées. **Les tests existants d'`AffairesPage` doivent rester
verts** (ne pas les modifier pour les faire passer).

`formatDate` (déjà inline) : l'extraire dans `src/lib/format.ts` (`formatDate(iso)`)
+ test, et l'importer là où utilisé.

**DoD Task 1** : nouveaux fichiers + tests verts ; `AffairesPage` refactoré, ses tests
toujours verts ; `pnpm lint` et `pnpm build` OK ; aucune régression visuelle (mêmes
classes/styles qu'avant).

---

## Task 2 — Dashboard : data + UI

### 2a. Sélecteurs purs `src/modules/dashboard/dashboardData.ts` (TDD strict)

Fonctions pures, testées AVANT implémentation :
- `affairesPrioritaires(affaires, limit = 5)` : trie par `date_livraison` ascendant
  (valeurs nulles/absentes en dernier), renvoie les `limit` premières. Ne mute pas
  l'entrée.
- `countAffairesEnCours(affaires)` : nombre d'affaires `statut === 'En cours'`.
- `caEnCours(affaires)` : Σ `total_ht` (number) des affaires `statut === 'En cours'`
  (ignore null).
- `formatK(montant)` : `197600` → `"197.6 k€"` ; `0` → `"0.0 k€"`.
- `isoWeek(date)` : numéro de semaine ISO-8601 (1–53). Tests sur dates connues
  (ex. 2026-01-01 → 1 ; 2026-06-26 → 26 ; un lundi/dimanche de bordure).

Le formatage date longue (« Vendredi 26 juin 2026 ») reste un appel
`toLocaleDateString('fr-FR', …)` inline dans le composant (dépend de l'ICU, non
testé unitairement).

### 2b. `src/modules/dashboard/DashboardPage.tsx` (réécriture fidèle)

Reproduit EXACTEMENT la structure de `PageDashboard` (l.2684–2828) :
en-tête, grille KPI (4), grille principale (Affaires prioritaires `lg:col-span-2` +
colonne Alertes/Atelier), grille basse (Répartition heures + Prochaines livraisons).

- Header : eyebrow « Vue d'ensemble », `Bonjour {prénom}` (Georgia), sous-titre, bloc
  date à droite (date longue réelle + `Semaine {isoWeek} · {année}`).
- KPI : réutilise la primitive `KPI`. Widgets 2–3 RÉELS (via sélecteurs), 4–5 STUB
  (valeur démo + `sub` portant un suffixe « · démo »).
- Affaires prioritaires : `Card noPadding`, en-tête + lien « Tout voir » → `/affaires`
  (react-router `Link`/`useNavigate`). Lignes = `affairesPrioritaires(...)` avec
  `TypeBadge`, `numero`, client, chantier, `ProgressBar`, `StatusBadge`, date
  livraison. États : `Spinner` si `isLoading` ; message vide si liste vide.
- Widgets 7–10 STUB : visuel maquette conservé (contenu démo en dur), badge `Démo`
  dans l'en-tête de chaque widget ; lien « Réapprovisionner » → `/stock`.

### 2c. `src/modules/dashboard/DashboardPage.test.tsx`

Harness identique aux autres pages : `vi.mock('./dashboardData')`? Non — préférer
`vi.mock('../affaires/useAffaires')` (données réelles simulées) + `vi.mock` de
`useAuth` pour fournir `profil`. Render dans `<MemoryRouter>`. Assertions :
- Le prénom apparaît (« Bonjour Davy »).
- Les 4 libellés KPI sont présents.
- « Affaires prioritaires » présent + un `numero` d'affaire simulé rendu.
- Les marqueurs « Démo » sont présents sur les widgets stub.

**DoD Task 2** : sélecteurs + tests verts ; page rendue fidèle ; test de page vert ;
`pnpm lint`/`build` OK.

---

## Vérification finale (contrôleur)

1. `pnpm test` (tous verts, ≥ 47 + nouveaux), `pnpm lint`, `pnpm build`.
2. Revue de code finale du diff complet.
3. Preuve navigateur : `preview_start` → login **Davy** (bureau_etudes) → insérer 1–2
   affaires de test (Supabase MCP) → screenshot du dashboard montrant la liste
   prioritaire + KPI réels → **SUPPRIMER les affaires de test** → re-screenshot état
   propre → `preview_stop`.
4. `finishing-a-development-branch` : merge `feat/dashboard-reskin` → `main` + push.

## Hors scope (notés pour plus tard)

- Libellé de rôle (au lieu de l'enum) dans Sidebar/Topbar.
- Colonnes clients SIRET/TVA/adresse/CP.
- `PageFicheAffaire` multi-onglets complète.
