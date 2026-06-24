# ERP Hans Coffrage — Phase 2 : front modulaire branché Supabase (design)

**Date** : 2026-06-24
**Statut** : design validé (brainstorming) — à transformer en plan d'implémentation
**Dépôt cible** : `https://github.com/proaissamoustaine/ERP_hans-coffrage.git` (vide), cloné en local dans `C:\Users\aissa\Downloads\ERP_hans-coffrage`
**Backend** : projet Supabase `qjmofktujdyxlmvzoklh` (eu-west-3) — Phase 1 terminée (19 tables + RLS + 19 comptes Auth + référentiels seedés)

---

## 1. Objectif

Passer de la maquette React (monolithe `App.jsx`, état en mémoire, gate `hans2026`) à une **vraie application modulaire**, typée, branchée sur Supabase : authentification réelle (les 19 comptes), données persistées et partagées, permissions par rôle appliquées en base (RLS déjà en place), mises à jour live (Realtime).

Décision d'architecture (validée) : **découper en modules pendant le port** (pas de monolithe), et avancer **module par module** sur plusieurs sessions, chaque étape laissée propre et commitée.

## 2. Stack (dernières versions stables, résolues au scaffold)

| Rôle | Choix |
|------|-------|
| Build/dev | **Vite** (latest) |
| UI | **React 19** + **TypeScript** (latest) |
| Style | **Tailwind CSS v4** (config CSS-first) + tokens couleur repris de la maquette (objet `C`) |
| Icônes | **lucide-react** (latest) |
| Données/Auth/Realtime | **@supabase/supabase-js** v2 (latest) |
| Routing | **react-router-dom** v7 (latest) |
| État serveur | **@tanstack/react-query** v5 (latest) |
| Formulaires & validation | **react-hook-form** + **zod** (latest) |
| Tests | **Vitest** + **@testing-library/react** + jest-dom (latest) |
| Qualité | **ESLint** + **Prettier**, TypeScript `strict` |
| CI | **GitHub Actions** (install → lint → test → build) |
| Paquets | **pnpm** (via corepack ; fallback npm) |
| Hébergement | **Vercel** (intégration Supabase déjà liée) |

Règle : toujours `@latest` fiable ; versions exactes verrouillées par le lockfile au scaffold.
Types Supabase générés (`generate_typescript_types`) → `src/lib/database.types.ts` pour typer toute la couche données.

## 3. Arborescence (frontières claires, un fichier = une responsabilité)

```
ERP_hans-coffrage/
  .env.local                       VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY
  src/
    main.tsx
    App.tsx                        Providers (QueryClient, Auth, Router) + déclaration des routes
    index.css                      Tailwind v4 + thème
    lib/
      supabase.ts                  client unique
      database.types.ts            types générés depuis Supabase
      theme.ts                     tokens couleur C (repris maquette)
    auth/
      AuthProvider.tsx             session + profil (nom, rôle) ; expose useAuth()
      LoginPage.tsx                email + mot de passe
      ProtectedRoute.tsx           garde de route (connecté + rôle autorisé)
      roles.ts                     rôle → liste de pages autorisées (repris de PROFILS.allowed)
    components/
      ui/                          primitives portées : Btn, Card, Field, Input, Select, Badge, Modal, Table, StatutPill…
      layout/                      AppShell, Sidebar (filtrée par rôle), Topbar (user + logout)
    hooks/
      useReferentiels.ts           catalogue_matieres / taux_horaires_mo / taches_codes / categories_heures / parametres / types_debit / machines
    modules/
      dashboard/  clients/  chiffrage/  devis/  affaires/  formulaire/
      flashage/  chutes/  heures/  colisage/  livraisons/  factures/  prix-revient/  rh/  …
```

Chaque module = **une page** (`<Domaine>Page.tsx`) + **un hook de données** (`use<Domaine>.ts`) + sous-composants éventuels. Le hook encapsule lecture/écriture Supabase et Realtime ; la page ne connaît que le hook.

## 4. Couche données — React Query remplace le Context en mémoire

- Lectures : `useQuery(['affaires'], () => supabase.from('affaires').select())` etc.
- Écritures : `useMutation` + `queryClient.invalidateQueries` (cohérence du cache).
- Realtime : abonnement `supabase.channel(...).on('postgres_changes', …)` → invalidation des queries concernées (ex. un flashage ⇒ rafraîchit le PR de l'affaire en direct).
- La **RLS** (déjà en place) garantit que chaque rôle ne lit/écrit que son périmètre ; le front n'a pas à re-filtrer la sécurité (juste l'UX).
- Les helpers métier de la maquette (n° racine, coef chute = 1/(1−chute%), FDS 5 %, valorisation MO, avancement pondéré) sont **repris tels quels** dans `src/lib/` (logique pure, testable).

## 5. Authentification & rôles

- `AuthProvider` : au montage, `supabase.auth.getSession()` ; écoute `onAuthStateChange`. Si pas de session → `LoginPage`.
- Après login : lecture de `profils` (id = `auth.uid()`) → `{ nom, role }` en contexte.
- Le **rôle** pilote la **Sidebar** (pages visibles) et les **ProtectedRoute** (accès direct par URL), via `roles.ts` repris de `PROFILS.allowed` de la maquette :
  - `admin` / `direction` → tout
  - `compta` → dashboard, clients, factures, heures, transport, rh, documents
  - `chef_prod` → production + logistique + PR + stock + chantiers
  - `bureau_etudes` → clients, chiffrage, devis, affaires, formulaire, photos, documents
  - `operateur` → flashage, chutes, heures, colisage, pesee, impression, photos (**pas** affaires/devis/factures)
- Remplace le gate `hans2026` et le sélecteur de profil. Logout dans la Topbar.

## 6. Env & déploiement

- `.env.local` (non commité) : `VITE_SUPABASE_URL=https://qjmofktujdyxlmvzoklh.supabase.co`, `VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_…` (clé publique, sûre avec RLS).
- Déploiement Vercel ; les variables d'env y sont fournies par l'intégration Supabase (ou ajoutées manuellement).
- `.gitignore` : `node_modules`, `.env.local`, `dist`.

## 7. Ordre de migration (dépendances métier)

1. **Fondations** : clone repo, scaffold Vite+TS, Tailwind v4, libs, client Supabase, types générés, thème, primitives `ui/`, `AppShell`+`Sidebar`+`Topbar`, Auth + LoginPage + ProtectedRoute, `useReferentiels`, Dashboard minimal. → **app runnable, login réel, navigation par rôle.**
2. **Clients** (module témoin, patron réutilisable) : `useClients` (CRUD) + page liste/fiche.
3. **Chiffrage → Devis** : création, versions A/B/C, n° racine, frais transport.
4. **Affaires** (+ `etapes_affaire`, timeline 11 étapes) : génération depuis devis accepté.
5. **Formulaire / Pièces** : cascade catalogue, géométries, validation → `formulaires_valides`.
6. **Flashage / Heures** : chrono, `heures_flashees`, Realtime vers le PR.
7. **Chutes** (chutothèque), **Colisage/Livraisons**, **Factures**, **Prix de revient**, **RH/Admin**.

Chaque module est livré câblé (lecture+écriture+RLS+Realtime si pertinent), commité, avant de passer au suivant. « Le plus loin possible » = on enchaîne dans cet ordre, sur plusieurs sessions, en s'arrêtant à des points propres.

## 8. TDD, qualité & robustesse (exigence : digne des normes actuelles)

**Test-Driven Development — discipline stricte (NON négociable)**
- Cycle **RED → GREEN → REFACTOR** pour chaque unité : on écrit d'abord le test (il échoue), puis le minimum de code pour le faire passer, puis on refactore.
- **Un test ne se modifie pas pour le faire passer.** Le test encode le comportement attendu (le contrat) ; s'il échoue, **c'est le CODE qui change**, jamais le test. (Seule exception : un test manifestement erroné — on le corrige alors explicitement, en le justifiant, ce n'est pas le réflexe par défaut.)
- Tests committés avec le code ; `pnpm test` doit être **vert** avant chaque commit / fin de module.

**Couverture**
- **Logique métier pure** (`src/lib/`), priorité absolue, 100 % testée : génération n° racine `T25-MMJJ-NN[V]-EE`, coef chute = 1/(1−chute%), FDS 5 %, marge & seuil d'alerte 15 %, valorisation MO (estimé vs flashé), avancement pondéré (10 sous-étapes). → **Vitest**, écrit en TDD.
- **Composants & intégration** : flux critiques (gate auth + accès par rôle, CRUD d'un module, cascade catalogue du Formulaire) avec **@testing-library/react** + client Supabase mocké.
- **RLS** : déjà prouvée e2e en Phase 1 ; re-testable avec données.

**Qualité & robustesse**
- **TypeScript `strict`** ; types DB générés = source de vérité des formes de données ; pas de `any` non justifié.
- **ESLint + Prettier** (config TS) appliqués partout.
- États **loading / error** systématiques (React Query) ; **Error Boundary** global ; messages d'erreur lisibles pour l'utilisateur.
- **Validation des entrées** : formulaires via **react-hook-form + zod** (montants, dates, champs requis) — aucune donnée invalide envoyée à la base.
- **Validation de l'environnement** au démarrage (URL + clé Supabase présentes) ; échec explicite sinon.
- **CI GitHub Actions** sur le dépôt ERP : `install → lint → test → build` à chaque push / PR — **rien ne merge si c'est rouge**.
- Vérif `pnpm build` à la fin de chaque module.

## 9. Points hors-périmètre Phase 2 (notés pour plus tard)

- Mode hors-ligne flashage (file IndexedDB + sync) — cahier des charges §10.
- Génération PDF serveur (devis, BL, fiche atelier) via Edge Functions.
- Emails sortants (devis, transport Rouillon).
- Reprise de l'historique `D_PR.xlsm` / affaires en cours (Phase 4).

## 10. Risques & décisions assumées

- **Port JSX→TSX d'un monolithe ~11k lignes** : fait progressivement, module par module (pas un big-bang). La maquette reste la référence visuelle/fonctionnelle.
- **Tailwind v4** : config CSS-first (différente de la v3 de la maquette) ; l'usage maquette (utilitaires de layout + couleurs en `style` inline via `C`) se porte sans accroc.
- **React 19** : compatible avec le code maquette (React 18) moyennant ajustements mineurs.
- **pnpm** : si indisponible/instable sur la machine → bascule npm (lockfile au choix).
