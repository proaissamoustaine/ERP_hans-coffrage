# ERP Phase 2 — Increment 2 : Chiffrage → Devis (plan)

> Exécution : subagent-driven + vérification rigoureuse par le contrôleur (build/lint/test relancés + relecture + preuve navigateur). TDD strict : un test ne se modifie pas pour passer.

**Goal :** Module Devis/Chiffrage branché Supabase — création d'un devis avec **n° racine** auto-généré (`T YY-MMJJ-NN` + version), 8 modes de chiffrage, frais transport, workflow de statut (brouillon → envoyé → accepté/refusé), et **révisions A→B→C** (même racine). Suit les patterns de l'Increment 1 (hook de données + page + TDD).

**Logique métier reprise fidèlement de la maquette** (`src/App.jsx` l.457-480, 722-742).

---

## Task 1 — `src/lib/numero.ts` (logique pure, TDD) — LE CŒUR

**Fichiers :** Create `src/lib/numero.ts`, `src/lib/numero.test.ts`.

Algorithme (identique maquette, mais **date injectable** pour des tests déterministes) :
- `MODE_TO_PREFIX`: coffrage→C, prefa→P, mannequin→M, sateba→S, vente→V, usinage→U, decor→D, autre→A.
- `generateNumeroRacine(mode, existingNumeros, date)` : `${prefix}${YY}-${MMJJ}-${NN}A` où `NN` = (nb de `existingNumeros` commençant par `prefix+YY-MMJJ`) + 1, paddé sur 2.
- `splitNumero(numero)` → `{ racine, version }` via regex `/^(.+?)([A-Z])$/`.
- `nextVersion(racine, existingNumeros)` → lettre = max des versions existantes sur cette racine + 1.

- [ ] **Step 1 — Test (échoue)** `src/lib/numero.test.ts` :
```ts
import { describe, it, expect } from 'vitest';
import { prefixForMode, generateNumeroRacine, splitNumero, nextVersion } from './numero';

const D = new Date('2025-10-20T09:00:00Z');
describe('numero racine', () => {
  it('préfixe par mode', () => {
    expect(prefixForMode('coffrage')).toBe('C');
    expect(prefixForMode('sateba')).toBe('S');
    expect(prefixForMode('autre')).toBe('A');
  });
  it('génère T YY-MMJJ-NN + version A, NN = compteur du jour', () => {
    expect(generateNumeroRacine('coffrage', [], D)).toBe('C25-1020-01A');
    expect(generateNumeroRacine('coffrage', ['C25-1020-01A'], D)).toBe('C25-1020-02A');
    // un autre mode/jour n'incrémente pas le compteur
    expect(generateNumeroRacine('coffrage', ['P25-1020-01A', 'C25-1019-09A'], D)).toBe('C25-1020-01A');
  });
  it('splitNumero sépare racine et version', () => {
    expect(splitNumero('C25-1020-03A')).toEqual({ racine: 'C25-1020-03', version: 'A' });
  });
  it('nextVersion = max + 1 sur la racine', () => {
    expect(nextVersion('C25-1020-03', ['C25-1020-03A'])).toBe('C25-1020-03B');
    expect(nextVersion('C25-1020-03', ['C25-1020-03A', 'C25-1020-03B'])).toBe('C25-1020-03C');
  });
});
```
- [ ] **Step 2** : lancer → FAIL.
- [ ] **Step 3 — Implémentation** `src/lib/numero.ts` :
```ts
import type { Database } from './database.types';
export type ModeChiffrage = Database['public']['Enums']['mode_chiffrage'];

export const MODE_TO_PREFIX: Record<ModeChiffrage, string> = {
  coffrage: 'C', prefa: 'P', mannequin: 'M', sateba: 'S',
  vente: 'V', usinage: 'U', decor: 'D', autre: 'A',
};
export const prefixForMode = (mode: ModeChiffrage): string => MODE_TO_PREFIX[mode] ?? 'A';

export function generateNumeroRacine(mode: ModeChiffrage, existingNumeros: string[], date: Date = new Date()): string {
  const prefix = prefixForMode(mode);
  const yy = date.getFullYear().toString().slice(-2);
  const mm = (date.getMonth() + 1).toString().padStart(2, '0');
  const dd = date.getDate().toString().padStart(2, '0');
  const base = `${prefix}${yy}-${mm}${dd}`;
  const count = existingNumeros.filter((n) => n.startsWith(base)).length + 1;
  return `${base}-${count.toString().padStart(2, '0')}A`;
}
export function splitNumero(numero: string): { racine: string; version: string } {
  const m = numero.match(/^(.+?)([A-Z])$/);
  return m ? { racine: m[1], version: m[2] } : { racine: numero, version: 'A' };
}
export function nextVersion(racine: string, existingNumeros: string[]): string {
  const versions = existingNumeros.filter((n) => n.startsWith(racine)).map((n) => splitNumero(n).version);
  const max = versions.reduce((acc, v) => (v > acc ? v : acc), 'A');
  return racine + String.fromCharCode(max.charCodeAt(0) + 1);
}
```
- [ ] **Step 4** : lancer → PASS. **Commit** `feat: logique n° racine + versions (TDD)`.

---

## Task 2 — `src/modules/devis/devisSchema.ts` (zod, TDD)
Champs : `mode` (enum mode_chiffrage), `client_id` (uuid optionnel), `chantier?`, `objet?`, `total_ht` (number ≥ 0), `frais_transport` (number ≥ 0, défaut 0). Test : accepte un devis valide ; refuse `total_ht` négatif ; refuse un `mode` hors enum. (zod v4 : `z.enum([...])`, `z.number().min(0)`.)

---

## Task 3 — `src/modules/devis/useDevis.ts` (+ fetch test, TDD)
- `fetchDevis(sb)` : `from('devis').select('*, clients(nom)').order('created_at', { ascending: false })` ; throw sur erreur. (TDD comme `fetchClients`.)
- `useDevis()` (useQuery `['devis']`).
- `useCreateDevis()` : génère le n° racine via `generateNumeroRacine(mode, numerosExistants, new Date())` (les numéros existants viennent du cache `['devis']`), insère `{ numero, numero_racine, version:'A', mode, client_id, chantier, objet, total_ht, frais_transport, statut:'brouillon' }`, invalide `['devis']`.
- `useUpdateDevisStatut()` : `update({ statut }).eq('id', id)` (brouillon→envoye→accepte/refuse), invalide.
- `useRevisionDevis()` : sur un devis source, calcule `nextVersion(splitNumero(source.numero).racine, numerosExistants)`, insère un nouveau devis (statut brouillon, mêmes données, `numero`=nouvelle version, `parent_devis_id`=source.id), passe la source à `revise` (ou garde statut + flag). Invalide.

---

## Task 4 — `src/modules/devis/DevisPage.tsx` (+ RTL test)
- Liste (table : N° racine, Mode, Client, Objet, Total HT, Statut [pastille couleur], Actions) via `useDevis` (loading/error/empty).
- Bouton « Nouveau devis » → formulaire rhf+zod (mode select 8 modes, client select depuis `useClients`, chantier, objet, total HT, frais transport) → `useCreateDevis`.
- Actions par ligne selon statut : brouillon→Envoyer ; envoyé→Accepter/Refuser/Réviser ; (accepté/refusé → lecture seule).
- Test RTL : mock `useDevis` → 1 devis affiché ; mock `useClients`.
- Réutilise primitives `ui/` + thème `C` + pastilles de statut.

---

## Task 5 — Câblage
- `src/components/nav.ts` : l'item `devis` existe déjà.
- `src/App.tsx` : route `/devis` → `ProtectedRoute page="devis"` → `DevisPage` (remplace `ComingSoonPage`).

---

## DoD & vérif (contrôleur)
- `pnpm test` + `pnpm lint` + `pnpm build` verts.
- Preuve navigateur : login `bureau_etudes` (Davy) → /devis → créer un devis (mode Coffrage) → n° racine `C25-….-NNA` généré, devis listé ; réviser → version B même racine.
- Commits par tâche ; push sur accord.

## Self-review
- n° racine : algorithme identique maquette, date injectée (déterministe). ✓
- RLS : `devis` lisible/écrivable par admin/direction/bureau_etudes (pas operateur) — déjà en base. ✓
- Patterns Increment 1 réutilisés (hook+page+TDD+primitives). ✓
