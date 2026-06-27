# ERP Phase 2 — Incrément 2 logistique : Livraisons + Transport (design)

Date : 2026-06-27
Statut : validé (cadrage client OK, prêt pour plan)
Repo : `ERP_hans-coffrage` · projet Supabase `qjmofktujdyxlmvzoklh` (eu-west-3)

## Contexte

Suite de l'incrément 1 logistique (Colisage + Pesée, `origin/main = 3aa5545`). On porte
fidèlement les deux pages logistiques restantes de la maquette :

- `PageLivraisons` — maquette `src/App.jsx` l.7300
- `PageTransport` — maquette `src/App.jsx` l.7390
- modals : `ModalVoirLivraison` (l.2277), `ModalNouvelleLivraison` (l.2325),
  `ModalNouveauTransport` (l.2356)

sur **données Supabase réelles**, en respectant la règle client « tout doit
correspondre EXACTEMENT à la maquette ».

## Décisions de cadrage (validées avec le client)

1. **Périmètre** : Livraisons ET Transport dans **un seul incrément** (une spec, un plan,
   un push). Les deux pages partagent les colis et l'affaire.
2. **Données** : **nouvelles tables persistées** (`livraisons`, `commandes_transport`)
   plutôt qu'une approche dérivée — cohérent avec le reste du cycle et traçabilité réelle.
3. **Documents** (BL, étiquette A5, commande transport) : **HTML imprimable fidèle**
   via `window.print` (comme le Formulaire). Le PDF overlay pixel sur gabarits
   préimprimés est **reporté** à un incrément ultérieur.
4. **Commande transport** vers Transports ROUILLON (`rh@transports-rouillon.fr`) :
   **génération + `mailto:` pré-rempli** (pas d'envoi serveur automatique cet incrément).

## Principes transverses

- **Online-only** : Livraisons/Transport sont des tâches de bureau
  (admin / direction / chef_prod / compta), **pas** d'usage atelier sur le terrain.
  → On ne greffe **pas** le socle offline-first B1 (contrairement à Flashage / Chutes /
  Colisage). Pas de file de mutations offline.
- **Pas de Realtime** : édition essentiellement mono-poste ; on n'abonne pas les tables.
- **RLS** : `select` + `insert` + `update` réservés à `is_staff()` ; **opérateur refusé**
  (même règle que `affaires` / `factures`). La compta a accès au module `transport`
  (vérif factures Rouillon) ; le chef_prod a `livraisons` + `transport`.
- **Fidélité maquette** : primitives existantes (`Btn/Card/Field/Input/Select/PageHeader/
  Badge/KPI/StatusBadge/Modal`), couleurs `C`, layout identique.

## Modèle de données (migration MCP)

### Table `livraisons`

| colonne | type | notes |
|---|---|---|
| `id` | uuid pk | `gen_random_uuid()` |
| `affaire_id` | uuid fk → `affaires(id)` | not null |
| `reference` | text | `LIV-YYYY-NNN`, généré côté app |
| `type` | text | `standard` / `partielle` / `enlevement` (default `standard`) |
| `destination` | text | adresse de livraison (pré-remplie depuis affaire/client) |
| `transporteur` | text | default `'Transports ROUILLON'` |
| `cout_transport` | numeric | coût prévu (€) |
| `date_prevue` | date | |
| `statut` | text | `en_preparation` (default) / `expedie` / `livre` |
| `remarques` | text | nullable |
| `created_at` | timestamptz | default `now()` |
| `created_by` | uuid | `auth.uid()` nullable |

Poids total, nombre de colis et encombrement de la livraison sont **dérivés** des colis
rattachés (non dupliqués).

### Table `commandes_transport`

| colonne | type | notes |
|---|---|---|
| `id` | uuid pk | |
| `affaire_id` | uuid fk → `affaires(id)` | not null |
| `livraison_id` | uuid fk → `livraisons(id)` | nullable |
| `reference` | text | `CT-YYYY-NNN` |
| `cout` | numeric | coût transport (€) |
| `date_enlevement` | date | |
| `date_livraison` | date | |
| `long_ml` / `larg_ml` / `haut_ml` | numeric | encombrement (m linéaires), pré-rempli depuis colis |
| `poids_t` | numeric | poids total (tonnes) |
| `statut` | text | `brouillon` (default) / `envoyee` |
| `created_at` / `created_by` | | |

### Modification `colis`

- Ajout `livraison_id uuid null fk → livraisons(id)` : rattache les colis sélectionnés à
  une livraison (supporte la « livraison partielle » du modal — sous-ensemble des colis
  de l'affaire). `on delete set null`.

### Statuts

`text` (cohérent avec `affaires.statut`, évite la cérémonie enum). Valeurs documentées
ci-dessus ; un `check` peut être ajouté si souhaité au plan.

### Types & RLS

- RLS activée sur les 2 tables ; policies `select/insert/update` via `is_staff()`.
- Types régénérés : MCP `generate_typescript_types` puis édition ciblée des sections
  `livraisons` / `commandes_transport` / `colis` de `src/lib/database.types.ts`.

## Structure `src/modules/livraisons/`

### `livraisonsData.ts` (pur, testé TDD)

- `nextReferenceLivraison(refs: string[], annee: number): string` → `LIV-2026-NNN`
  (max compteur de l'année + 1, padding 3).
- `nextReferenceCommande(refs: string[], annee: number): string` → `CT-2026-NNN`.
- `totalPoidsColis(colis): number` (kg) ; `poidsTonnes(kg): number`.
- `encombrement(colis): { long_ml, larg_ml, haut_ml, poids_t }`
  (max longueur, max largeur, somme hauteur ou max — à figer au plan selon le gabarit
  commande ; poids = somme → tonnes).
- `statutLivraisonLabel` / `statutCommandeLabel`.
- `mailtoCommande(commande, affaire, client, colis): string` → construit l'URL
  `mailto:rh@transports-rouillon.fr?subject=...&body=...` avec détail par colis (kg),
  encombrement, coordonnées destinataire, dates.

### Hooks React Query

- `useLivraisons.ts` : `useLivraisons()` (fetch + jointure affaire + colis liés),
  `useCreerLivraison()` (génère `reference`, insère la livraison, rattache les colis
  sélectionnés via `colis.livraison_id`, **upsert étape `livraison`**
  `onConflict:'affaire_id,etape'` — cf. piège affaire démo à étapes incomplètes),
  `useMajStatutLivraison()`.
- `useCommandesTransport.ts` : `useCommandesTransport()`, `useCreerCommande()`
  (génère `reference`, encombrement auto depuis colis), `useMarquerEnvoyee()`.

### Pages

- `LivraisonsPage.tsx` (route `/livraisons`) :
  - PageHeader « Livraisons » + bouton « Nouvelle livraison ».
  - 4 KPI (En préparation / Expédiés / Livrés ce mois / Tonnage total) — calculés du réel.
  - Carte « Affaires prêtes à expédier » : affaires avec ≥1 colis et étape `livraison`
    non faite → bouton « Marquer livré » (maj statut + étape).
  - Tableau des livraisons (Référence/Affaire/Client/Destination/Colis/Poids/Coût/Date/
    Statut) → clic = `ModalVoirLivraison`.
  - `ModalNouvelleLivraison` : affaire, type, date prévue, destination (pré-remplie),
    transporteur, coût, **cases « colis à inclure » réelles** (colis de l'affaire non
    encore rattachés), remarques. Bouton « Créer la livraison ».
  - `ModalVoirLivraison` : détail + boutons « BL » (→ impression) / « Confirmer
    expédition » (statut → expedie).
- `TransportPage.tsx` (route `/transport`) :
  - 4 KPI (Commandes ce mois / Coût ce mois / Coût moyen / Régions livrées) — réel quand
    possible, sinon honnête.
  - Carte « Nouvelle commande transport » : affaire → encombrement & détail colis **auto**,
    coût, dates enlèvement/livraison, coordonnées destinataire (auto depuis affaire +
    client). Bouton « Envoyer la commande » = ouvre le **mailto** pré-rempli + persiste
    `statut=envoyee`. Bouton « Aperçu » = `CommandeTransportPrint`.
  - Carte « Vérification factures Rouillon » : liste des commandes/coûts.

### Templates d'impression `src/modules/livraisons/print/`

Rendus dans une vue dédiée (route ou overlay) + `window.print()` :

- `BonLivraisonPrint.tsx` — bon de livraison (en-tête HANS COFFRAGE, destinataire,
  affaire, liste colis + poids, totaux).
- `EtiquetteColisPrint.tsx` — étiquette **A5 paysage** par colis (n° colis, affaire,
  client/chantier, poids, dimensions).
- `CommandeTransportPrint.tsx` — commande transport (encombrement, détail par colis kg,
  destinataire, dates, coût).

Le détail exact des champs sera calé sur les gabarits de référence au moment du plan /
implémentation : `BL_HANS_COFFRAGE.pdf`, `ETIQUETTE_VIERGE.pdf` + `ETIQUETTE_REMPLIE_
EXEMPLE.pdf`, `Commande_Transport_exemple.pdf`
(dans `C:\Users\aissa\Documents\hans-coffrage\saas_hans_coffrage\DEVELOPPEMENT ERP\`).

### Câblage

- `src/App.tsx` : retirer `livraisons` / `transport` de `BUILT_IDS`, importer les pages en
  `lazy`, ajouter les routes `livraisons` / `transport` sous `ProtectedRoute`.
- `nav.ts` / `roles.ts` : déjà configurés (modules présents, droits chef_prod/compta).

## Méthode & vérification

Pattern rodé : plan → sous-agent data (TDD strict) → sous-agent UI → sous-agent print →
relecture contrôleur (build/lint/test) + **preuve navigateur en compte ADMIN (Gilles
TUAILLON)** :

1. créer une affaire de test + colis (la base est vide) ;
2. créer une livraison (réf `LIV-2026-001` générée, colis rattachés, étape `livraison`
   cochée) ;
3. imprimer BL + étiquette (vérif rendu) ;
4. créer une commande transport → encombrement auto + mailto pré-rempli généré ;
5. **nettoyer toutes les données de test** (livraisons, commandes, colis, affaire) ;
6. push.

## Hors périmètre (YAGNI cet incrément)

- PDF overlay pixel sur gabarits préimprimés.
- Envoi email serveur automatique (edge function) — `mailto` suffit.
- Offline / Realtime.
- Suivi GPS / statuts transporteur temps réel.
