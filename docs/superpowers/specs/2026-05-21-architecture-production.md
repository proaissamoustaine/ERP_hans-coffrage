# Architecture de production — ERP HANS COFFRAGE

**Date** : 2026-05-21
**Statut** : cahier des charges technique (phase de développement réelle)
**Objet** : passer de la maquette React (données mockées, en mémoire) à une application réelle multi-utilisateurs avec persistance, authentification et données vivantes.

---

## 1. État actuel (maquette)

| Aspect | Maquette actuelle |
|--------|-------------------|
| Front-end | React 18 + Vite + Tailwind, **un seul fichier** `src/App.jsx` (~10 000 lignes) |
| Données | **En mémoire** (React Context `ErpDataContext`) — tout est perdu au rafraîchissement |
| Catalogue matières | 315 références figées dans le code (`MATIERES_SAMPLE`) |
| Authentification | Choix d'un profil dans une liste (pas de mot de passe réel par utilisateur) |
| Multi-utilisateur | ❌ chaque navigateur a son état isolé |
| Hébergement | aucun (dev local `npm run dev`) |

La maquette **valide les écrans et les règles métier**. Elle n'est pas utilisable en production telle quelle : il manque la persistance, le partage des données entre utilisateurs, et la sécurité.

---

## 2. Architecture cible

```
┌─────────────────────────────────────────────────────────────┐
│                      NAVIGATEUR (clients)                     │
│  React (SPA) — bureau, tablette atelier (flashage), mobile   │
└───────────────┬─────────────────────────────────────────────┘
                │ HTTPS (API REST + Realtime WebSocket)
                ▼
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND (Supabase)                         │
│  • PostgreSQL (base de données relationnelle)                │
│  • Auth (email/mot de passe + rôles)                         │
│  • Row Level Security (permissions par rôle au niveau SQL)   │
│  • Realtime (mise à jour live entre postes)                  │
│  • Storage (photos atelier, PDF devis/BL, plans)             │
│  • Edge Functions (génération PDF, envoi mails transport)    │
└─────────────────────────────────────────────────────────────┘
```

**Stack recommandée : Supabase** (PostgreSQL managé + Auth + Storage + Realtime).

**Pourquoi Supabase plutôt qu'un backend sur-mesure :**
- PostgreSQL = base relationnelle robuste, parfaite pour des données structurées (affaires, pièces, devis, chutes).
- Auth + gestion des rôles **inclus** → pas à recoder l'authentification.
- **Row Level Security (RLS)** : les permissions par profil (Gilles, Marc, Théo…) sont appliquées **au niveau de la base**, pas seulement dans le React — bien plus sûr.
- **Realtime** : quand un ouvrier flashe une heure sur la tablette, le PR de l'affaire se met à jour en direct sur le poste du chef de prod.
- Génère automatiquement une **API REST + client JS** → on remplace les fonctions du Context par des appels Supabase sans réécrire l'UI.
- Hébergement européen disponible (RGPD).

**Alternatives** : un backend Node.js (Express/NestJS) + PostgreSQL auto-hébergé donne plus de contrôle mais demande de tout coder (auth, API, permissions) — plus long et plus cher en maintenance. Pour Hans Coffrage, Supabase est le meilleur rapport vitesse/robustesse.

---

## 3. Modèle de données (tables PostgreSQL)

Le Context React actuel décrit déjà presque tout le schéma. Traduction en tables :

| Table | Colonnes clés | Vient du Context |
|-------|---------------|------------------|
| `utilisateurs` | id, nom, role, email, actif | PROFILS |
| `clients` | id, nom, ville, contact, tel, email | MOCK.clients |
| `catalogue_matieres` | code (PK), famille, type, designation, prix, unite, code_unite, chute, prefixe, epaisseur | MATIERES_SAMPLE (315 réfs) |
| `taux_horaires_mo` | code (PK), designation, taux, nb_operateurs | TAUX_HORAIRES (13 MO) |
| `taches_codes` | code (PK), libelle, categorie_mo, facturable | TACHES_CODES (43 codes) |
| `devis` | id, numero (n° racine), mode, client_id, chantier, objet, total_ht, frais_transport, statut, version, parent_devis_id, dates | devis (Context) |
| `affaires` | id, numero (= n° racine du devis accepté), mode, client_id, chantier, total_ht, statut, date_acceptation, devis_id | affaires (Context) |
| `etapes_affaire` | id, affaire_id, etape, fait, date | etapesByAffaire |
| `pieces` | id, affaire_id, type, ref1, ref2, designation, section_finie, nb, geometrie, dimensions (JSONB), prix, unite, pourcent_chute | piecesByAffaire |
| `heures_flashees` | id, affaire_id, code_tache, operateur_id, duree_min, date | heuresFlasheesByAffaire |
| `chutes` | id, matiere_code, designation, cat, long, larg, ep, affaire_origine, operateur_id, statut, affaire_consommation, prix_unit | chutes |
| `colis` | id, affaire_id, long, larg, haut, poids, date | colisByAffaire |
| `factures` | id, affaire_id, montant, statut, date_emission, date_paiement | factureByAffaire |
| `photos` | id, affaire_id, etape, url (Storage), date | (module Photos) |

- `dimensions` est stocké en **JSONB** (les champs varient selon Standard/Type_1/2/3) — PostgreSQL gère nativement le JSON.
- Les relations (`client_id`, `affaire_id`, `devis_id`…) sont des **clés étrangères** → intégrité garantie.
- Le **n° racine** (`C25-1020-03A`) reste l'identifiant métier continu devis→affaire→facture, comme dans la maquette.

---

## 4. Authentification & rôles

7 profils existants → 7 rôles dans Supabase Auth (champ `role` sur `utilisateurs`) :

| Rôle | Accès |
|------|-------|
| `admin` (Gilles, Laure) | tout |
| `compta` (Claire) | dashboard, clients, factures, heures, transport, RH, documents |
| `chef_prod` (André) | production + logistique + PR + chutes |
| `bureau_etudes` (Bertrand) | clients, chiffrage, devis, affaires, formulaire |
| `operateur` (Marc) | flashage, chutes, heures, colisage, pesée, impression, photos |
| `logistique` (Théo) | colisage, pesée, livraisons, transport, stock |

**Row Level Security** : pour chaque table, une policy SQL définit qui peut lire/écrire. Exemple : un `operateur` ne peut **pas** lire la table `affaires` (marges/prix sensibles) mais peut écrire dans `heures_flashees`. Cette règle est appliquée par PostgreSQL — impossible à contourner depuis le front, contrairement au filtrage React actuel.

---

## 5. Migration des données mockées → base réelle

| Donnée | Méthode de migration |
|--------|----------------------|
| Catalogue 315 matières | Import direct du fichier Excel `FEUILLE FORMULAIRE_ARBORESCENCE` (script CSV → table `catalogue_matieres`). **Déjà extrait** dans la maquette. |
| 13 taux MO + 43 codes tâches | Insert SQL one-shot (constantes déjà dans le code). |
| Clients | Import depuis l'export comptable existant (CSV) ou ressaisie. |
| Affaires en cours | Reprise manuelle des affaires actives au démarrage (quelques dizaines). |
| Historique | Optionnel : import des anciens fichiers `D_PR_*.xlsm` si besoin d'archives. |

Le **modèle de données de la maquette = le schéma cible**, donc la migration est surtout du « remplir les tables ». Aucune refonte conceptuelle.

---

## 6. Adaptation du front-end

Le React reste à **~90 % identique**. Seul change la **couche données** :

- Aujourd'hui : `useErpData()` lit/écrit un Context en mémoire.
- Demain : `useErpData()` appelle le **client Supabase** (lecture/écriture en base) + s'abonne au Realtime.

Concrètement, on remplace le contenu de `ErpDataProvider` (les `useState` + fonctions) par des requêtes Supabase. **Toute l'UI (écrans, formulaires, tableaux) ne bouge pas.** C'est l'intérêt d'avoir centralisé l'état dans le Context dès la maquette.

À prévoir aussi :
- Découper `App.jsx` (10 000 lignes) en fichiers par module — nécessaire pour la maintenabilité en production (pas bloquant mais fortement recommandé).
- Mode **hors-ligne flashage** : la tablette atelier peut perdre le réseau. Prévoir une file d'attente locale (IndexedDB) qui synchronise les pointages dès le retour du réseau. (Point déjà identifié comme « à spécifier » dans la maquette.)

---

## 7. Hébergement & coûts estimés

| Poste | Solution | Coût indicatif /mois |
|-------|----------|----------------------|
| Backend + base + auth + storage | Supabase Pro (région EU) | ~25 €/mois (offre Pro, 8 Go base, 100 Go storage) |
| Hébergement front (SPA) | Vercel / Netlify / Cloudflare Pages | 0–20 €/mois (gratuit possible au début) |
| Nom de domaine | erp.hans-coffrage.fr | ~15 €/an |
| Envoi mails (transport, devis) | Resend / Supabase SMTP | 0–20 €/mois selon volume |
| **Total** | | **~50–70 €/mois** au démarrage |

Volumétrie Hans Coffrage (PME, ~7 utilisateurs, quelques centaines d'affaires/an) → reste largement dans les offres d'entrée. Pas de besoin d'infrastructure lourde.

---

## 8. Plan de migration par phases

**Phase 0 — Préparation (la maquette, déjà faite)**
- ✅ Écrans validés, règles métier verrouillées, modèle de données stabilisé via le Context.

**Phase 1 — Socle backend (1–2 semaines)**
- Créer le projet Supabase, les tables, les policies RLS.
- Importer catalogue matières + taux MO + codes tâches.
- Brancher l'authentification réelle (7 rôles).

**Phase 2 — Branchement données (2–3 semaines)**
- Remplacer le Context en mémoire par les appels Supabase, module par module (devis → affaires → pièces → flashage → chutes → factures).
- Activer le Realtime sur flashage/PR.

**Phase 3 — Finitions production (1–2 semaines)**
- Découpage `App.jsx` en modules.
- Mode hors-ligne flashage (IndexedDB + sync).
- Génération PDF serveur (devis, BL, commande transport, fiche atelier).
- Sauvegardes automatiques (Supabase quotidien) + export.

**Phase 4 — Déploiement & reprise (1 semaine)**
- Déploiement sur domaine, formation utilisateurs.
- Reprise des affaires en cours.
- Bascule progressive (la maquette/Excel restent en secours quelques semaines).

**Estimation totale : ~6–8 semaines** de développement pour une mise en production complète.

---

## 9. Sécurité & conformité

- **RGPD** : hébergement EU, données clients/salariés en base européenne.
- **Sauvegardes** : automatiques quotidiennes (Supabase) + export mensuel téléchargeable.
- **Permissions** : appliquées en base (RLS), pas seulement dans l'UI.
- **Audit** : colonnes `created_at` / `updated_at` / `created_by` sur les tables sensibles (devis, factures, PR) pour la traçabilité.
- **Mots de passe** : gérés par Supabase Auth (hachés, jamais stockés en clair).

---

## 10. Ce qui reste à décider avec Hans

1. **Mode hors-ligne flashage** : priorité haute (atelier) ou acceptable de dépendre du réseau ?
2. **Reprise de l'historique** : on repart de zéro avec les affaires en cours, ou on importe les anciens `D_PR.xlsm` ?
3. **Emails sortants** : depuis quelle adresse (devis client, commande transport `rh@transports-rouillon.fr`) ?
4. **Hébergement** : Supabase Cloud (simple) ou auto-hébergé sur serveur Hans (plus de contrôle, plus de maintenance) ?
5. **Application tablette** : navigateur web (suffisant) ou vraie app installée (PWA) pour l'atelier ?

---

**Conclusion** : la maquette a servi de **spécification vivante**. Le modèle de données est prêt, l'UI est validée. Le passage en production consiste à poser le socle Supabase et à brancher la couche données — sans réécrire les écrans. Budget réaliste : ~6–8 semaines de dev + ~50–70 €/mois d'infrastructure.
