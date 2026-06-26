# Phase 2 — Fiche affaire complète (fidèle à la maquette)

**Date** : 2026-06-26
**Branche** : `feat/fiche-affaire` (base `9bf7e43`, + commit `6e85004` champs entreprise client)
**Méthode** : subagent-driven + TDD + preuve navigateur + nettoyage des données de test.

## Objectif

Reconstruire **à l'identique** la page `PageFicheAffaire` de la maquette
(`hans-erp-deploy/hans-erp-deploy/src/App.jsx`, lignes **4039–4693**) dans l'ERP, sous
forme d'une page route `/affaires/:id`. **RÈGLE DE FIDÉLITÉ** : porter l'UI EXACTE,
ne changer QUE la couche data/auth.

Actuellement l'ERP n'affiche qu'un **panneau timeline latéral** au clic
(`AffairesPage` → `DetailPanel`). La maquette ouvre une **page complète** : en-tête +
4 stats + boutons, cycle de vie 11 étapes en grandes cartes, 10 sous-étapes pondérées,
puis 8 onglets. On remplace le panneau latéral par cette page (clic ligne → navigation).

## Anatomie de la fiche maquette & stratégie data

### En-tête (Card)
- Pastille type (lettre sur fond `C.primary`) + `TypeBadge` + n° (`numero`) + client
  (`clients.nom`) + chantier. **RÉEL**.
- Boutons *Saisir pièces / Imprimer / Dupliquer / Modifier* : présents visuellement,
  **non fonctionnels** (les modules cibles n'existent pas) → boutons décoratifs
  (pas de `onClick` cassant ; éventuellement `disabled` ou lien stub).
- 4 stats : **Montant HT** (`total_ht`) RÉEL · **Heures totales** STUB (« — », pas de
  module Heures) · **Coût horaire** STUB · **Livraison prévue** (`date_livraison`) RÉEL.

### Cycle de vie · 11 étapes (RÉEL via `useEtapes`)
- Badge statut (`affaire.statut`) + « {avancementPondéré}% global ».
- Bandeau « Prochaine étape : {label} » + bouton **Marquer fait** (toggle l'étape via
  `useToggleEtape`). Si toutes faites → bandeau « Affaire soldée ».
- Timeline horizontale : 11 cartes (n°/11, label, « {poids} pts », date si faite,
  coche si faite, NEXT sur la prochaine, lien « ↶ annuler » sur les faites). Toggle réel.
- Les `cle` ERP correspondent déjà aux `id` maquette. Enrichir `ETAPES` (etapes.ts)
  avec `poids` + libellés fidèles (voir Task 2).

### 10 sous-étapes pondérées (vue historique « ancien calcul »)
- Dérivées de `affaire.avancement` (0–100) par la formule EXACTE de la maquette
  (l.4205–4239) → fonction pure `sousEtapesPonderees(avancement)`. **RÉEL** (dérivé).

### Onglets (barre + contenu)
| Onglet | Source | Décision |
|--------|--------|----------|
| **Synthèse** | code-barres `*{numero}*`, Infos affaire, Analyse éco, `NumAffaireSchema` | **RÉEL partiel** : n°/type/statut/livraison/Montant HT réels ; lignes basées sur les heures (BE, prod, PR, marge) = **STUB** (pas de module Heures/PR) avec marqueur ; code-barres + `NumAffaireSchema` portés fidèlement |
| **Client & Commande** | `clients.nom` réel ; conducteur/tél absents du schéma | **RÉEL partiel** : client réel ; conducteur/tél → « — » |
| **Chantier** | `chantier`, `date_livraison` réels ; conducteur absent | **RÉEL partiel** |
| **Heures** | module Heures absent | **STUB** : visuel maquette + badge `Démo` |
| **Prix de revient** | modules Formulaire/Flashage absents | **STUB** : état vide honnête « Aucune pièce saisie » (état natif de la maquette) |
| **Livraisons** | module Livraisons absent | **STUB** : état vide « Aucune livraison » |
| **Photos** | module Photos absent | **STUB** : visuel galerie démo + badge `Démo` |
| **Documents** | absent | **STUB** : visuel liste démo + badge `Démo` |

**Principe stub** (« stubber proprement ») = conserver le **visuel exact** de la maquette
mais marquer clairement les widgets non branchés (primitive `Badge`,
`bg={C.accentSoft}` `color="#8B6914"`, texte « Démo ») ou afficher l'état vide honnête
quand la maquette en a déjà un. Les liens `onNav('x')` → liens react-router vers les
routes stub existantes (`/formulaire`, `/stock`, `/prix-revient`, etc.).

## Substrat ERP (réutiliser)

- `useAffaires()` (liste + `clients(nom)`) → la fiche fait `data.find(id)` (robuste même
  en accès direct à l'URL : le hook recharge la liste). Pas de nouveau hook nécessaire.
- `useEtapes(id)` / `useToggleEtape()` (existants) — étape rows `{id, etape, fait, date}`.
- Primitives `src/components/ui/` (dont `TypeBadge` extrait en Task 1), `Badge`, `Btn`,
  `Card`, `Spinner`, `C`, `NAV`.
- `database.types.ts` → `Tables<'affaires'>`, `Tables<'etapes_affaire'>`.

---

## Task 1 — Extraire les primitives partagées (TDD)

`TypeBadge` (utilisé par l'en-tête de la fiche), `ProgressBar`, `StatusBadge` et
`formatDate` sont inline dans `AffairesPage.tsx`. Les extraire en primitives partagées
(TDD : test d'abord) :
- `src/components/ui/ProgressBar.tsx` `({ value, height?, color=C.accent })`.
- `src/components/ui/TypeBadge.tsx` `({ mode })` + `MODE_CFG` exporté.
- `src/components/ui/StatusBadge.tsx` `({ statut })` + `STATUT_BG`/`statutStyle` exportés.
- `src/lib/format.ts` `formatDate(iso)`.
Refactor `AffairesPage` pour les importer (sans changer son rendu ; **ses tests restent
verts, ne pas les modifier**). DoD : nouveaux tests verts, lint+build OK.

## Task 2 — Couche data de la fiche (TDD strict)

- **Enrichir `src/lib/etapes.ts`** : ajouter `poids: number` (+ libellés fidèles
  maquette) à chaque entrée de `ETAPES`. Valeurs (Σ=100) : devis_accepte 0 « Devis
  accepté », saisie_pieces 5 « Saisie pièces », pr_valide 0 « PR initial validé »,
  dessin_be 15 « Dessin BE », debit 20 « Débit », montage 30 « Montage atelier »,
  finition 10 « Finition + contrôle », colisage 5 « Colisage + pesée », livraison 10
  « Livré », facturation 0 « Facturé », paiement 5 « Payé / Soldé ». **Ne pas casser
  les tests existants** d'etapes.ts (`calcAvancement` inchangé).
- `avancementPondere(etapes)` : Σ `poids` des étapes faites (par `cle`). Test : aucune
  faite → 0 ; toutes → 100 ; sous-ensemble connu → somme attendue.
- `prochaineEtape(etapes)` : 1ʳᵉ étape (ordre `ETAPES`) non faite, ou `null`. Test.
- `src/modules/affaires/sousEtapes.ts` → `sousEtapesPonderees(avancement)` : reproduit
  EXACTEMENT le tableau des 10 stages (clés/groupes/poids/val) de la maquette
  (App.jsx l.4205–4239). Tests sur valeurs connues (avancement 0/40/100).
- `decodeNumero(numero)` (dans `format.ts` ou `numero.ts`) : découpe
  `^([A-Z])(\d{2})-(\d{4})-(\d{2})([A-Z]?)(?:-(\d{2}))?$` → blocs. Test ; renvoie null si
  non-conforme. (Alimente `NumAffaireSchema`.)

## Task 3 — Fiche UI : shell + onglets réels + routing

- `src/modules/affaires/FicheAffairePage.tsx` : en-tête (4 stats), cycle 11 cartes
  (toggle réel via `useToggleEtape`), sous-étapes pondérées, **barre des 8 onglets**, et
  contenu des onglets **Synthèse / Client & Commande / Chantier** (réels partiels) +
  composant `NumAffaireSchema` (porté). Boutons d'en-tête décoratifs.
- **Routing** : ajouter `/affaires/:id` dans `App.tsx` (sous le shell protégé, page
  `affaires`). `AffairesPage` : clic sur une ligne → `navigate('/affaires/' + id)` (via
  `useNavigate`) ; **retirer** le panneau `DetailPanel` latéral et l'état `selectedId`
  (la fiche le remplace). Bouton « Retour aux affaires » → `/affaires`.
- `FicheAffairePage.test.tsx` : `vi.mock` `useAffaires` (1 affaire) + `useEtapes`/
  `useToggleEtape` ; rendre sous `<MemoryRouter initialEntries={['/affaires/ID']}>` avec
  route param. Asserts : n° affaire, client, « Cycle de vie », un libellé d'étape, l'onglet
  Synthèse (code-barres) visible.

## Task 4 — Fiche UI : onglets stub

Compléter `FicheAffairePage.tsx` avec les onglets **Heures / Prix de revient /
Livraisons / Photos / Documents**, visuellement fidèles à la maquette
(l.4365–4688) mais marqués : `Heures`/`Photos`/`Documents` = visuel démo + badge `Démo` ;
`Prix de revient` = état vide honnête « Aucune pièce saisie » (+ lien `/formulaire`) ;
`Livraisons` = état vide « Aucune livraison ». Aucun appel à des modules inexistants.
Étendre le test : présence des marqueurs « Démo » / états vides.

## Vérification finale (contrôleur)

1. `pnpm test` (verts), `pnpm lint`, `pnpm build`.
2. Revue de code finale du diff complet.
3. Preuve navigateur : `preview_start` → login **Davy** → insérer 1 affaire de test +
   ses étapes (Supabase MCP) → ouvrir `/affaires/:id` → screenshots (en-tête + cycle +
   onglets) → **SUPPRIMER** l'affaire + étapes de test → `preview_stop`.
4. `finishing-a-development-branch` : merge `feat/fiche-affaire` → `main` + push.

## Hors scope (notés)

- Modules réels Heures / PR / Flashage / Livraisons / Photos (incréments suivants).
- Libellé de rôle (au lieu de l'enum) dans Sidebar/Topbar.
- Re-skin du **Dashboard** (plan déjà écrit : `2026-06-26-erp-phase2-dashboard-reskin.md`).
