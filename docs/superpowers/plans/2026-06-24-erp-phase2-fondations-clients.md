# ERP Phase 2 — Incrément 1 : Fondations + module Clients (plan d'implémentation)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (recommandé ici : tâches séquentielles dépendantes sur un même dépôt) ou superpowers:subagent-driven-development. Étapes en cases à cocher (`- [ ]`).

**Goal :** Mettre en place le dépôt ERP modulaire (Vite + React 19 + TypeScript) branché sur Supabase — auth réelle, navigation par rôle, référentiels live — avec un premier module (Clients) câblé bout-en-bout en TDD, le tout testé/lint/build vert et déployable sur Vercel.

**Architecture :** SPA React modulaire. État serveur via React Query (remplace le Context mémoire). Auth Supabase + RLS (Phase 1) ; le rôle (`profils.role`) pilote sidebar et routes. Un module = une page + un hook de données. Logique pure isolée dans `src/lib/` et testée en premier.

**Tech Stack :** Vite, React 19, TypeScript strict, Tailwind v4, lucide-react, @supabase/supabase-js v2, react-router-dom v7, @tanstack/react-query v5, react-hook-form + zod, Vitest + @testing-library/react, ESLint + Prettier, pnpm, GitHub Actions, Vercel.

**Référence visuelle/fonctionnelle :** maquette `C:\Users\aissa\Downloads\hans-erp-deploy\hans-erp-deploy\src\App.jsx` (ne PAS modifier — source à porter).

**Règle TDD (non négociable) :** un test qui échoue ⇒ on corrige le **code**, jamais le test (sauf test manifestement erroné, corrigé explicitement). `pnpm test` vert avant chaque commit.

---

## Structure de fichiers (cible de l'incrément)

```
ERP_hans-coffrage/
  .github/workflows/ci.yml          CI : install → lint → test → build
  .env.local (non commité) / .env.example
  vite.config.ts                    plugins react + tailwind + bloc test (vitest)
  tsconfig*.json                    strict: true
  eslint.config.js / .prettierrc
  src/
    main.tsx  App.tsx  index.css  vite-env.d.ts  test/setup.ts
    lib/
      env.ts            validateEnv() + export config (TDD)
      supabase.ts       client unique
      database.types.ts types générés (Supabase)
      theme.ts          tokens couleur C (repris maquette)
    auth/
      roles.ts          UserRole, ROLE_PAGES, canAccess() (TDD)
      AuthProvider.tsx  session + profil ; useAuth()
      LoginPage.tsx     email + mot de passe (react-hook-form + zod)
      ProtectedRoute.tsx
    components/
      ui/               Btn, Card, Field, Input, Select, Spinner (portés)
      layout/           AppShell, Sidebar (filtrée), Topbar, ErrorBoundary
      nav.ts            NAV_ITEMS + visibleNavItems() (TDD)
    hooks/useReferentiels.ts
    modules/
      dashboard/DashboardPage.tsx
      clients/
        clientSchema.ts     zod (TDD)
        useClients.ts       fetch/insert/update via supabase + react-query (TDD sur les fns pures)
        ClientsPage.tsx     liste + création/édition (RTL)
```

---

## Task 1 : Cloner le dépôt + scaffold Vite React-TS

**Files :** tout `ERP_hans-coffrage/` (généré).

- [ ] **Step 1 :** Cloner le dépôt vide.
```bash
cd /c/Users/aissa/Downloads && git clone https://github.com/proaissamoustaine/ERP_hans-coffrage.git
```
Attendu : dossier `ERP_hans-coffrage/` (vide, pas de branche).

- [ ] **Step 2 :** Activer pnpm (corepack) ; fallback npm si indisponible.
```bash
corepack enable pnpm && pnpm --version
```
Attendu : un numéro de version. Si erreur → utiliser `npm` dans toutes les commandes suivantes.

- [ ] **Step 3 :** Scaffolder Vite React-TS dans le dossier cloné (sans écraser `.git`).
```bash
cd /c/Users/aissa/Downloads/ERP_hans-coffrage && pnpm create vite@latest . --template react-ts
pnpm install
```
Attendu : `src/main.tsx`, `src/App.tsx`, `vite.config.ts`, `package.json` créés ; install OK.

- [ ] **Step 4 :** `.gitignore` (ajouter si absent) puis premier commit.
```bash
printf "\nnode_modules\ndist\n.env.local\n.env\n*.local\n" >> .gitignore
git add -A && git commit -m "chore: scaffold Vite React TS (ERP Hans Coffrage)"
```
Attendu : commit créé. (Push différé en fin d'incrément, sur accord utilisateur.)

---

## Task 2 : Dépendances + Tailwind v4 + Vitest + ESLint/Prettier + tsconfig strict

**Files :** `package.json`, `vite.config.ts`, `src/index.css`, `src/test/setup.ts`, `tsconfig.app.json`, `.prettierrc`.

- [ ] **Step 1 :** Installer les libs (versions latest résolues par pnpm).
```bash
pnpm add @supabase/supabase-js react-router-dom @tanstack/react-query react-hook-form zod lucide-react
pnpm add -D tailwindcss @tailwindcss/vite vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event prettier
```

- [ ] **Step 2 :** `vite.config.ts` — plugins react + tailwind + bloc test.
```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: { environment: 'jsdom', globals: true, setupFiles: './src/test/setup.ts' },
});
```

- [ ] **Step 3 :** `src/index.css` — Tailwind v4.
```css
@import "tailwindcss";
```

- [ ] **Step 4 :** `src/test/setup.ts`.
```ts
import '@testing-library/jest-dom';
```

- [ ] **Step 5 :** Scripts `package.json` : ajouter
```json
"scripts": { "dev": "vite", "build": "tsc -b && vite build", "preview": "vite preview", "test": "vitest run", "test:watch": "vitest", "lint": "eslint .", "format": "prettier --write ." }
```

- [ ] **Step 6 :** `tsconfig.app.json` → s'assurer de `"strict": true` (déjà mis par le template ; vérifier). `.prettierrc` :
```json
{ "singleQuote": true, "semi": true, "printWidth": 100 }
```

- [ ] **Step 7 :** Vérifier que l'outillage tourne.
```bash
pnpm test   # 0 test pour l'instant → "no tests" OK (exit 0 avec --passWithNoTests si besoin)
pnpm build
```
Attendu : build OK. Commit : `git add -A && git commit -m "chore: deps + tailwind v4 + vitest + tooling"`.

---

## Task 3 : Validation de l'environnement (TDD)

**Files :** Create `src/lib/env.ts`, `src/lib/env.test.ts`, `.env.example`, `.env.local`.

- [ ] **Step 1 : Test qui échoue** — `src/lib/env.test.ts`
```ts
import { describe, it, expect } from 'vitest';
import { validateEnv } from './env';

describe('validateEnv', () => {
  it('renvoie la config quand URL et clé sont présentes', () => {
    const cfg = validateEnv({ VITE_SUPABASE_URL: 'https://x.supabase.co', VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_x' });
    expect(cfg).toEqual({ url: 'https://x.supabase.co', key: 'sb_publishable_x' });
  });
  it('jette une erreur explicite si une variable manque', () => {
    expect(() => validateEnv({ VITE_SUPABASE_URL: '', VITE_SUPABASE_PUBLISHABLE_KEY: 'k' })).toThrow(/VITE_SUPABASE_URL/);
    expect(() => validateEnv({ VITE_SUPABASE_URL: 'u', VITE_SUPABASE_PUBLISHABLE_KEY: '' })).toThrow(/VITE_SUPABASE_PUBLISHABLE_KEY/);
  });
});
```
- [ ] **Step 2 : Lancer** `pnpm test src/lib/env.test.ts` → FAIL (`validateEnv` introuvable).
- [ ] **Step 3 : Implémentation minimale** — `src/lib/env.ts`
```ts
type RawEnv = { VITE_SUPABASE_URL?: string; VITE_SUPABASE_PUBLISHABLE_KEY?: string };
export function validateEnv(env: RawEnv) {
  const url = env.VITE_SUPABASE_URL;
  const key = env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url) throw new Error('Config manquante : VITE_SUPABASE_URL');
  if (!key) throw new Error('Config manquante : VITE_SUPABASE_PUBLISHABLE_KEY');
  return { url, key };
}
export const config = validateEnv(import.meta.env as unknown as RawEnv);
```
- [ ] **Step 4 : Lancer** `pnpm test src/lib/env.test.ts` → PASS.
- [ ] **Step 5 :** `.env.example` et `.env.local` :
```
VITE_SUPABASE_URL=https://qjmofktujdyxlmvzoklh.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_wU2IRlJGmrWHYK20HjBOAQ_51fxCnSW
```
(`.env.local` non commité ; `.env.example` commité.)
- [ ] **Step 6 : Commit** `git add -A && git commit -m "feat: validation env Supabase (TDD)"`.

---

## Task 4 : Types Supabase générés + client + thème

**Files :** Create `src/lib/database.types.ts`, `src/lib/supabase.ts`, `src/lib/theme.ts`.

- [ ] **Step 1 :** Générer les types depuis Supabase (outil MCP `generate_typescript_types`, project_id `qjmofktujdyxlmvzoklh`) → coller le résultat dans `src/lib/database.types.ts`.
- [ ] **Step 2 :** `src/lib/supabase.ts`
```ts
import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';
import { config } from './env';
export const supabase = createClient<Database>(config.url, config.key);
```
- [ ] **Step 3 :** `src/lib/theme.ts` — reprendre l'objet `C` (couleurs) depuis la maquette `App.jsx` (chercher `const C = {`), exporté en `export const C = { … } as const;`.
- [ ] **Step 4 :** `pnpm build` → OK. Commit : `feat: client Supabase typé + thème`.

---

## Task 5 : Rôles & permissions (TDD)

**Files :** Create `src/auth/roles.ts`, `src/auth/roles.test.ts`.

- [ ] **Step 1 : Test qui échoue** — `src/auth/roles.test.ts`
```ts
import { describe, it, expect } from 'vitest';
import { canAccess } from './roles';

describe('canAccess', () => {
  it('admin et direction accèdent à tout', () => {
    expect(canAccess('admin', 'factures')).toBe(true);
    expect(canAccess('direction', 'affaires')).toBe(true);
  });
  it("operateur n'accède PAS aux affaires/devis/factures", () => {
    expect(canAccess('operateur', 'affaires')).toBe(false);
    expect(canAccess('operateur', 'devis')).toBe(false);
    expect(canAccess('operateur', 'factures')).toBe(false);
  });
  it('operateur accède à flashage et clients=false, compta accède factures', () => {
    expect(canAccess('operateur', 'flashage')).toBe(true);
    expect(canAccess('operateur', 'clients')).toBe(false);
    expect(canAccess('compta', 'factures')).toBe(true);
    expect(canAccess('bureau_etudes', 'devis')).toBe(true);
  });
});
```
- [ ] **Step 2 : Lancer** → FAIL.
- [ ] **Step 3 : Implémentation** — `src/auth/roles.ts` (mapping repris de `PROFILS.allowed` de la maquette)
```ts
export type UserRole = 'admin' | 'direction' | 'compta' | 'chef_prod' | 'bureau_etudes' | 'operateur';
export const ROLE_PAGES: Record<UserRole, 'all' | string[]> = {
  admin: 'all',
  direction: 'all',
  compta: ['dashboard', 'clients', 'factures', 'heures', 'transport', 'rh', 'documents'],
  chef_prod: ['dashboard', 'affaires', 'chantiers', 'planning', 'formulaire', 'fiche-atelier', 'flashage', 'chutes', 'heures', 'photos', 'prix-revient', 'colisage', 'pesee', 'livraisons', 'impression', 'transport', 'stock', 'documents'],
  bureau_etudes: ['dashboard', 'clients', 'devis', 'chiffrage', 'affaires', 'formulaire', 'photos', 'documents'],
  operateur: ['flashage', 'chutes', 'heures', 'colisage', 'pesee', 'impression', 'photos'],
};
export function canAccess(role: UserRole, page: string): boolean {
  const pages = ROLE_PAGES[role];
  return pages === 'all' || pages.includes(page);
}
```
- [ ] **Step 4 : Lancer** → PASS.
- [ ] **Step 5 : Commit** `feat: rôles & permissions canAccess (TDD)`.

---

## Task 6 : Navigation filtrée par rôle (TDD)

**Files :** Create `src/components/nav.ts`, `src/components/nav.test.ts`.

- [ ] **Step 1 : Test qui échoue** — `src/components/nav.test.ts`
```ts
import { describe, it, expect } from 'vitest';
import { NAV_ITEMS, visibleNavItems } from './nav';

describe('visibleNavItems', () => {
  it('operateur ne voit pas Affaires ni Factures', () => {
    const ids = visibleNavItems('operateur').map((i) => i.id);
    expect(ids).toContain('flashage');
    expect(ids).not.toContain('affaires');
    expect(ids).not.toContain('factures');
  });
  it('admin voit tout', () => {
    expect(visibleNavItems('admin').length).toBe(NAV_ITEMS.length);
  });
});
```
- [ ] **Step 2 : Lancer** → FAIL.
- [ ] **Step 3 : Implémentation** — `src/components/nav.ts` (sous-ensemble pour l'incrément ; complété au fil des modules)
```ts
import { LayoutDashboard, Users, FileText, Briefcase, ScanLine, Receipt } from 'lucide-react';
import type { ComponentType } from 'react';
import { canAccess, type UserRole } from '../auth/roles';

export type NavItem = { id: string; label: string; path: string; icon: ComponentType<{ size?: number }> };
export const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Tableau de bord', path: '/', icon: LayoutDashboard },
  { id: 'clients', label: 'Clients', path: '/clients', icon: Users },
  { id: 'devis', label: 'Devis', path: '/devis', icon: FileText },
  { id: 'affaires', label: 'Affaires', path: '/affaires', icon: Briefcase },
  { id: 'flashage', label: 'Flashage', path: '/flashage', icon: ScanLine },
  { id: 'factures', label: 'Factures', path: '/factures', icon: Receipt },
];
export function visibleNavItems(role: UserRole): NavItem[] {
  return NAV_ITEMS.filter((i) => canAccess(role, i.id));
}
```
- [ ] **Step 4 : Lancer** → PASS. **Commit** `feat: navigation filtrée par rôle (TDD)`.

---

## Task 7 : Auth (AuthProvider, useAuth, LoginPage, ProtectedRoute)

**Files :** Create `src/auth/AuthProvider.tsx`, `src/auth/LoginPage.tsx`, `src/auth/ProtectedRoute.tsx`, `src/auth/AuthProvider.test.tsx`.

- [ ] **Step 1 : Test d'intégration qui échoue** — `src/auth/AuthProvider.test.tsx` (supabase mocké : pas de session → enfant non rendu, état "déconnecté").
```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
    },
    from: vi.fn(),
  },
}));
import { AuthProvider, useAuth } from './AuthProvider';
function Probe() { const { loading, session } = useAuth(); return <div>{loading ? 'loading' : session ? 'in' : 'out'}</div>; }

describe('AuthProvider', () => {
  it('passe à l’état déconnecté quand pas de session', async () => {
    render(<AuthProvider><Probe /></AuthProvider>);
    await waitFor(() => expect(screen.getByText('out')).toBeInTheDocument());
  });
});
```
- [ ] **Step 2 : Lancer** → FAIL.
- [ ] **Step 3 : Implémenter** `AuthProvider.tsx` : contexte `{ session, profil, role, loading, signOut }` ; `getSession()` + `onAuthStateChange` ; à session présente, charge `profils` (`select('nom, role').eq('id', user.id).single()`). `useAuth()` hook. (Code complet à écrire — interface ci-dessus figée.)
- [ ] **Step 4 : Lancer** → PASS.
- [ ] **Step 5 :** `LoginPage.tsx` (react-hook-form + zod : email valide + password requis ; `supabase.auth.signInWithPassword` ; affiche l'erreur). `ProtectedRoute.tsx` : si `loading`→spinner ; si pas de session→`<Navigate to="/login">` ; si `page` non autorisée pour le rôle→page « accès refusé ».
- [ ] **Step 6 : Lancer** `pnpm test` (tout vert) + `pnpm build`. **Commit** `feat: auth Supabase (provider, login, route protégée)`.

---

## Task 8 : UI primitives + AppShell + ErrorBoundary + App.tsx (providers + router)

**Files :** Create `src/components/ui/*`, `src/components/layout/AppShell.tsx`, `Sidebar.tsx`, `Topbar.tsx`, `ErrorBoundary.tsx`, `src/modules/dashboard/DashboardPage.tsx`, Modify `src/App.tsx`, `src/main.tsx`.

- [ ] **Step 1 :** Porter les primitives minimales depuis la maquette `App.jsx` en TSX typé : `Btn`, `Card`, `Field`, `Input`, `Select`, `Spinner` (chercher leurs définitions dans la maquette). Une primitive par fichier sous `components/ui/`.
- [ ] **Step 2 :** `ErrorBoundary.tsx` (class component React qui attrape et affiche un message lisible).
- [ ] **Step 3 :** `Sidebar.tsx` utilise `visibleNavItems(role)` + `NavLink` ; `Topbar.tsx` affiche `profil.nom` + bouton logout (`signOut`) ; `AppShell.tsx` compose Sidebar+Topbar+`<Outlet/>`.
- [ ] **Step 4 :** `DashboardPage.tsx` : stub simple (titre + nom utilisateur).
- [ ] **Step 5 :** `main.tsx` : `<ErrorBoundary><QueryClientProvider><BrowserRouter><AuthProvider><App/></AuthProvider></BrowserRouter></QueryClientProvider></ErrorBoundary>`. `App.tsx` : `<Routes>` — `/login` public ; routes protégées sous `AppShell` (`/`=Dashboard, `/clients`=ClientsPage en Task 10), chaque route enveloppée d'un `ProtectedRoute page="…"`.
- [ ] **Step 6 :** `pnpm build` OK. **Vérif manuelle** : `pnpm dev` → la page login s'affiche ; connexion avec un compte réel (ex. `gilles.tuaillon@hanscoffrage.fr`, mot de passe depuis `comptes-hans-coffrage.csv`) → dashboard + sidebar complète ; déconnexion OK. **Commit** `feat: app shell, routing, providers, dashboard`.

---

## Task 9 : Référentiels depuis Supabase (TDD sur la fonction de fetch)

**Files :** Create `src/hooks/useReferentiels.ts`, `src/hooks/referentiels.fetch.ts`, `src/hooks/referentiels.fetch.test.ts`.

- [ ] **Step 1 : Test qui échoue** — `referentiels.fetch.test.ts` (supabase mocké renvoyant des lignes ; la fn doit retourner les données ou jeter sur erreur).
```ts
import { describe, it, expect, vi } from 'vitest';
import { fetchTable } from './referentiels.fetch';

const makeSb = (result: any) => ({ from: () => ({ select: () => Promise.resolve(result) }) }) as any;

describe('fetchTable', () => {
  it('retourne data si pas d’erreur', async () => {
    const sb = makeSb({ data: [{ code: 'MO_HB' }], error: null });
    await expect(fetchTable(sb, 'taux_horaires_mo')).resolves.toEqual([{ code: 'MO_HB' }]);
  });
  it('jette si erreur Supabase', async () => {
    const sb = makeSb({ data: null, error: { message: 'boom' } });
    await expect(fetchTable(sb, 'taux_horaires_mo')).rejects.toThrow('boom');
  });
});
```
- [ ] **Step 2 : Lancer** → FAIL.
- [ ] **Step 3 : Implémenter** `referentiels.fetch.ts`
```ts
import type { SupabaseClient } from '@supabase/supabase-js';
export async function fetchTable(sb: SupabaseClient, table: string) {
  const { data, error } = await sb.from(table).select('*');
  if (error) throw new Error(error.message);
  return data;
}
```
- [ ] **Step 4 : Lancer** → PASS.
- [ ] **Step 5 :** `useReferentiels.ts` : hooks React Query (`useQuery`) appelant `fetchTable(supabase, …)` pour `catalogue_matieres`, `taux_horaires_mo`, `taches_codes`, `categories_heures`, `parametres`, `types_debit`, `machines` (staleTime long — données de référence).
- [ ] **Step 6 :** `pnpm test` + `pnpm build`. **Commit** `feat: référentiels Supabase via React Query (TDD)`.

---

## Task 10 : Module Clients bout-en-bout (TDD)

**Files :** Create `src/modules/clients/clientSchema.ts` (+ `.test.ts`), `src/modules/clients/useClients.ts` (+ `clients.fetch.test.ts`), `src/modules/clients/ClientsPage.tsx` (+ `.test.tsx`). Modify `src/App.tsx` (route `/clients`), `src/components/nav.ts` (déjà présent).

- [ ] **Step 1 : Test schéma qui échoue** — `clientSchema.test.ts`
```ts
import { describe, it, expect } from 'vitest';
import { clientSchema } from './clientSchema';
describe('clientSchema', () => {
  it('accepte un client valide', () => {
    expect(clientSchema.safeParse({ nom: 'EIFFAGE', type: 'BTP', ville: 'STRASBOURG', contact: 'M. X', tel: '06', email: 'a@b.fr' }).success).toBe(true);
  });
  it('refuse un nom vide et un email invalide', () => {
    expect(clientSchema.safeParse({ nom: '', email: 'x' }).success).toBe(false);
    expect(clientSchema.safeParse({ nom: 'OK', email: 'pas-un-email' }).success).toBe(false);
  });
});
```
- [ ] **Step 2 :** Lancer → FAIL. **Implémenter** `clientSchema.ts`
```ts
import { z } from 'zod';
export const clientSchema = z.object({
  nom: z.string().min(1, 'Nom requis'),
  type: z.string().optional().or(z.literal('')),
  ville: z.string().optional().or(z.literal('')),
  contact: z.string().optional().or(z.literal('')),
  tel: z.string().optional().or(z.literal('')),
  email: z.union([z.string().email('Email invalide'), z.literal('')]).optional(),
});
export type ClientInput = z.infer<typeof clientSchema>;
```
Lancer → PASS.

- [ ] **Step 3 : Test fetch qui échoue** — `clients.fetch.test.ts` (mock supabase ; `fetchClients` trie par nom et propage l'erreur).
```ts
import { describe, it, expect, vi } from 'vitest';
import { fetchClients } from './useClients';
const sb = (r: any) => ({ from: () => ({ select: () => ({ order: () => Promise.resolve(r) }) }) }) as any;
describe('fetchClients', () => {
  it('retourne la liste', async () => {
    await expect(fetchClients(sb({ data: [{ id: '1', nom: 'A' }], error: null }))).resolves.toHaveLength(1);
  });
  it('jette sur erreur', async () => {
    await expect(fetchClients(sb({ data: null, error: { message: 'x' } }))).rejects.toThrow('x');
  });
});
```
- [ ] **Step 4 :** Lancer → FAIL. **Implémenter** dans `useClients.ts` la fn pure `fetchClients(sb)` + le hook React Query + `useCreateClient`/`useUpdateClient` (`useMutation` + invalidation `['clients']`).
```ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';
import type { ClientInput } from './clientSchema';
export async function fetchClients(sb: SupabaseClient) {
  const { data, error } = await sb.from('clients').select('*').order('nom');
  if (error) throw new Error(error.message); return data;
}
export const useClients = () => useQuery({ queryKey: ['clients'], queryFn: () => fetchClients(supabase) });
export function useCreateClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: ClientInput) => {
      const { data, error } = await supabase.from('clients').insert(input).select().single();
      if (error) throw new Error(error.message); return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clients'] }),
  });
}
```
Lancer → PASS.

- [ ] **Step 5 : Test page qui échoue** — `ClientsPage.test.tsx` (mock `useClients` → liste ; vérifie que les noms s'affichent ; états loading/error).
```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
vi.mock('./useClients', () => ({
  useClients: () => ({ data: [{ id: '1', nom: 'EIFFAGE ALSACE', ville: 'STRASBOURG' }], isLoading: false, error: null }),
  useCreateClient: () => ({ mutate: vi.fn(), isPending: false }),
}));
import { ClientsPage } from './ClientsPage';
describe('ClientsPage', () => {
  it('affiche les clients', () => {
    render(<ClientsPage />);
    expect(screen.getByText('EIFFAGE ALSACE')).toBeInTheDocument();
  });
});
```
- [ ] **Step 6 :** Lancer → FAIL. **Implémenter** `ClientsPage.tsx` : `useClients()` → états loading (Spinner) / error (message) / table (nom, type, ville, contact). Bouton « Nouveau client » → formulaire react-hook-form + zodResolver(clientSchema) → `useCreateClient().mutate`. Porter le visuel depuis la maquette (module Clients). Lancer → PASS.
- [ ] **Step 7 :** Brancher la route `/clients` (`ProtectedRoute page="clients"`) dans `App.tsx`.
- [ ] **Step 8 :** `pnpm test` (tout vert) + `pnpm build`. **Vérif manuelle** : login `bureau_etudes` (Davy) → voit Clients (les 8 seedés) ; login `operateur` (Zhour) → Clients absent de la sidebar + `/clients` en accès refusé. **Commit** `feat: module Clients bout-en-bout (TDD)`.

---

## Task 11 : CI GitHub Actions

**Files :** Create `.github/workflows/ci.yml`.

- [ ] **Step 1 :**
```yaml
name: CI
on: [push, pull_request]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm test
      - run: pnpm build
```
- [ ] **Step 2 :** Commit `ci: lint + test + build (GitHub Actions)`.

---

## Task 12 : Finalisation de l'incrément

- [ ] **Step 1 :** `pnpm lint && pnpm test && pnpm build` → tout vert.
- [ ] **Step 2 :** Recopier les docs `docs/superpowers/` de la maquette dans le repo ERP (spec Phase 2 + ce plan) pour qu'ils vivent avec le code.
- [ ] **Step 3 :** Sur **accord utilisateur**, pousser : `git push -u origin main` (le dépôt distant ERP est vide).
- [ ] **Step 4 :** (Optionnel) déploiement Vercel : lier le projet + variables d'env (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`).

---

## Self-review

**Couverture spec** : §2 stack (Tasks 1–2) ✓ ; §3 arborescence (toutes tasks) ✓ ; §4 data layer React Query (Tasks 9–10) ✓ ; §5 auth & rôles (Tasks 5–8) ✓ ; §6 env/déploiement (Tasks 3, 11–12) ✓ ; §7 ordre — Fondations + Clients = cet incrément ✓ (modules suivants = plans ultérieurs) ; §8 TDD/qualité/CI (TDD Tasks 3,5,6,9,10 ; ESLint/Prettier Task 2 ; CI Task 11) ✓. Realtime (§4) : pas nécessaire pour Clients → reporté au 1er module temps réel (Flashage).

**Placeholders** : les fns/composants montrent du code réel ; là où l'interface est figée mais le corps long (AuthProvider, primitives UI, ClientsPage visuel), le contrat (types/props/comportement attendu) est explicite et la source de portage (maquette) précisée — pas de « TODO » vague.

**Cohérence types** : `UserRole`, `canAccess`, `ROLE_PAGES`, `NavItem`, `fetchClients`, `clientSchema/ClientInput`, `useClients/useCreateClient` utilisés de façon identique entre tasks. `validateEnv` → `config` → `supabase` chaîne cohérente.
