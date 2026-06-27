# Livraisons + Transport (incrément 2 logistique) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Porter fidèlement les pages Livraisons et Transport de la maquette sur données Supabase réelles, avec persistance (tables `livraisons` / `commandes_transport`), BL/étiquette/commande HTML imprimables, et commande Rouillon via mailto.

**Architecture:** Module `src/modules/livraisons/`. Couche données pure testée TDD (`livraisonsData.ts`), hooks React Query **online-only** (pas de socle offline : tâches de bureau), deux pages (`LivraisonsPage`, `TransportPage`) fidèles à la maquette, templates d'impression (`print/`). Deux nouvelles tables + FK `colis.livraison_id`, RLS `is_staff()` (opérateur refusé). Pas de Realtime.

**Tech Stack:** React 19 + TypeScript strict + Vite + Tailwind v4 + react-router v7 + @tanstack/react-query v5 + react-hook-form/zod, Supabase JS, Vitest. pnpm. TDD strict.

Spec : `docs/superpowers/specs/2026-06-27-erp-phase2-increment2-livraisons-transport-design.md`.
Maquette de référence : `C:\Users\aissa\Downloads\hans-erp-deploy\hans-erp-deploy\src\App.jsx` (PageLivraisons l.7300, PageTransport l.7390, ModalVoirLivraison l.2277, ModalNouvelleLivraison l.2325, ModalNouveauTransport l.2356).

**Convention** : commandes lancées depuis `C:\Users\aissa\Downloads\ERP_hans-coffrage`. Tests : `pnpm test --run <fichier>`. Lint : `pnpm lint`. Build : `pnpm build`.

---

## Task 0 : Migration DB + régénération des types

**Files:**
- Modify (via MCP Supabase, projet `qjmofktujdyxlmvzoklh`) : schéma DB
- Modify: `src/lib/database.types.ts`

- [ ] **Step 1 : Appliquer la migration**

Via MCP `mcp__a97dbf17…__apply_migration`, name `increment2_livraisons_transport`, query :

```sql
-- Table livraisons
create table public.livraisons (
  id uuid primary key default gen_random_uuid(),
  affaire_id uuid not null references public.affaires(id) on delete cascade,
  reference text not null,
  type text not null default 'standard',
  destination text,
  transporteur text not null default 'Transports ROUILLON',
  cout_transport numeric,
  date_prevue date,
  statut text not null default 'en_preparation',
  remarques text,
  created_at timestamptz not null default now(),
  created_by uuid default auth.uid()
);

-- Table commandes_transport
create table public.commandes_transport (
  id uuid primary key default gen_random_uuid(),
  affaire_id uuid not null references public.affaires(id) on delete cascade,
  livraison_id uuid references public.livraisons(id) on delete set null,
  reference text not null,
  cout numeric,
  date_enlevement date,
  date_livraison date,
  long_ml numeric,
  larg_ml numeric,
  haut_ml numeric,
  poids_t numeric,
  statut text not null default 'brouillon',
  created_at timestamptz not null default now(),
  created_by uuid default auth.uid()
);

-- Rattachement des colis à une livraison
alter table public.colis
  add column livraison_id uuid references public.livraisons(id) on delete set null;

-- RLS : staff uniquement (opérateur refusé), comme affaires/factures
alter table public.livraisons enable row level security;
alter table public.commandes_transport enable row level security;

create policy livraisons_select on public.livraisons for select to authenticated using (public.is_staff());
create policy livraisons_insert on public.livraisons for insert to authenticated with check (public.is_staff());
create policy livraisons_update on public.livraisons for update to authenticated using (public.is_staff()) with check (public.is_staff());

create policy commandes_transport_select on public.commandes_transport for select to authenticated using (public.is_staff());
create policy commandes_transport_insert on public.commandes_transport for insert to authenticated with check (public.is_staff());
create policy commandes_transport_update on public.commandes_transport for update to authenticated using (public.is_staff()) with check (public.is_staff());
```

- [ ] **Step 2 : Vérifier les tables**

Via MCP `list_tables` (schema `public`) : confirmer `livraisons`, `commandes_transport`, et la colonne `colis.livraison_id`. Via MCP `get_advisors` (type `security`) : confirmer aucune nouvelle alerte critique (RLS active sur les 2 tables).

- [ ] **Step 3 : Régénérer les types**

Via MCP `generate_typescript_types`. Mettre à jour les sections `livraisons`, `commandes_transport`, et `colis` (ajout `livraison_id`) de `src/lib/database.types.ts` par édition ciblée (ne pas écraser les éditions manuelles existantes des autres tables).

- [ ] **Step 4 : Build de contrôle**

Run: `pnpm build`
Expected: build OK (les nouveaux types compilent, rien ne les consomme encore).

- [ ] **Step 5 : Commit**

```bash
git add src/lib/database.types.ts
git commit -m "feat(logistique): migration livraisons + commandes_transport + colis.livraison_id"
```

---

## Task 1 : Couche données pure `livraisonsData.ts`

**Files:**
- Create: `src/modules/livraisons/livraisonsData.ts`
- Test: `src/modules/livraisons/livraisonsData.test.ts`

- [ ] **Step 1 : Écrire les tests**

```ts
// src/modules/livraisons/livraisonsData.test.ts
import { describe, it, expect } from 'vitest';
import {
  nextReference,
  totalPoidsKg,
  poidsTonnes,
  encombrement,
  statutLivraisonLabel,
  mailtoCommande,
} from './livraisonsData';

describe('nextReference', () => {
  it('démarre à 001 quand aucune référence pour l’année', () => {
    expect(nextReference('LIV', [], 2026)).toBe('LIV-2026-001');
  });
  it('incrémente le max du compteur de l’année, padding 3', () => {
    expect(nextReference('LIV', ['LIV-2026-001', 'LIV-2026-004'], 2026)).toBe('LIV-2026-005');
  });
  it('ignore les références d’une autre année', () => {
    expect(nextReference('CT', ['CT-2025-009'], 2026)).toBe('CT-2026-001');
  });
});

describe('poids', () => {
  it('somme les poids (kg) en ignorant null', () => {
    expect(totalPoidsKg([{ poids: 860 }, { poids: null }, { poids: 140 }])).toBe(1000);
  });
  it('convertit kg → tonnes à 3 décimales', () => {
    expect(poidsTonnes(3530)).toBe(3.53);
  });
});

describe('encombrement', () => {
  it('agrège max longueur/largeur/hauteur (cm→ml) et somme poids (kg→t)', () => {
    const colis = [
      { longueur: 1360, largeur: 240, hauteur: 200, poids: 1600 },
      { longueur: 800, largeur: 240, hauteur: 211, poids: 1930 },
    ];
    expect(encombrement(colis)).toEqual({ long_ml: 13.6, larg_ml: 2.4, haut_ml: 2.11, poids_t: 3.53 });
  });
  it('renvoie des zéros pour une liste vide', () => {
    expect(encombrement([])).toEqual({ long_ml: 0, larg_ml: 0, haut_ml: 0, poids_t: 0 });
  });
});

describe('statutLivraisonLabel', () => {
  it('mappe les statuts techniques en libellés', () => {
    expect(statutLivraisonLabel('en_preparation')).toBe('En préparation');
    expect(statutLivraisonLabel('expedie')).toBe('Expédié');
    expect(statutLivraisonLabel('livre')).toBe('Livré');
  });
});

describe('mailtoCommande', () => {
  it('construit un mailto vers Rouillon avec sujet et détail colis', () => {
    const url = mailtoCommande({
      reference: 'CT-2026-001',
      affaireNumero: 'M25-1105-02',
      destinataire: 'EIFFAGE GENIE CIVIL',
      adresse: '101 RUE DE LA STATION, 93700 DRANCY',
      dateEnlevement: '2025-12-18',
      dateLivraison: '2025-12-22',
      cout: 630,
      encombrement: { long_ml: 13.6, larg_ml: 2.4, haut_ml: 2.11, poids_t: 3.53 },
      colis: [{ numero: 1, poids: 1600 }, { numero: 2, poids: 1930 }],
    });
    expect(url.startsWith('mailto:rh@transports-rouillon.fr?')).toBe(true);
    const decoded = decodeURIComponent(url);
    expect(decoded).toContain('CT-2026-001');
    expect(decoded).toContain('M25-1105-02');
    expect(decoded).toContain('Colis n° 1');
    expect(decoded).toContain('1600 kg');
    expect(decoded).toContain('3.53 t');
  });
});
```

- [ ] **Step 2 : Lancer les tests (échec attendu)**

Run: `pnpm test --run src/modules/livraisons/livraisonsData.test.ts`
Expected: FAIL (`livraisonsData` introuvable).

- [ ] **Step 3 : Implémenter**

```ts
// src/modules/livraisons/livraisonsData.ts
export type Dim = { longueur: number | null; largeur: number | null; hauteur: number | null; poids: number | null };
export type Encombrement = { long_ml: number; larg_ml: number; haut_ml: number; poids_t: number };

const round2 = (n: number) => Math.round(n * 100) / 100;
const round3 = (n: number) => Math.round(n * 1000) / 1000;

/** Prochaine référence `PREFIX-ANNEE-NNN` (compteur max de l’année + 1, padding 3). */
export function nextReference(prefix: 'LIV' | 'CT', refs: string[], annee: number): string {
  const re = new RegExp(`^${prefix}-${annee}-(\\d+)$`);
  const max = refs.reduce((m, r) => {
    const match = re.exec(r);
    return match ? Math.max(m, parseInt(match[1], 10)) : m;
  }, 0);
  return `${prefix}-${annee}-${String(max + 1).padStart(3, '0')}`;
}

export function totalPoidsKg(rows: { poids: number | null }[]): number {
  return rows.reduce((s, c) => s + (c.poids ?? 0), 0);
}

export function poidsTonnes(kg: number): number {
  return round3(kg / 1000);
}

/** Colis en cm/kg → encombrement en m linéaires / tonnes. */
export function encombrement(colis: Dim[]): Encombrement {
  if (colis.length === 0) return { long_ml: 0, larg_ml: 0, haut_ml: 0, poids_t: 0 };
  const maxCm = (k: keyof Dim) => Math.max(...colis.map((c) => (c[k] ?? 0) as number));
  return {
    long_ml: round2(maxCm('longueur') / 100),
    larg_ml: round2(maxCm('largeur') / 100),
    haut_ml: round2(maxCm('hauteur') / 100),
    poids_t: poidsTonnes(totalPoidsKg(colis)),
  };
}

const LIV_LABELS: Record<string, string> = {
  en_preparation: 'En préparation',
  expedie: 'Expédié',
  livre: 'Livré',
};
export function statutLivraisonLabel(statut: string): string {
  return LIV_LABELS[statut] ?? statut;
}

const CMD_LABELS: Record<string, string> = { brouillon: 'Brouillon', envoyee: 'Envoyée' };
export function statutCommandeLabel(statut: string): string {
  return CMD_LABELS[statut] ?? statut;
}

export type MailtoCommandeArgs = {
  reference: string;
  affaireNumero: string;
  destinataire: string;
  adresse: string;
  dateEnlevement: string | null;
  dateLivraison: string | null;
  cout: number | null;
  encombrement: Encombrement;
  colis: { numero: number | null; poids: number | null }[];
};

export function mailtoCommande(a: MailtoCommandeArgs): string {
  const e = a.encombrement;
  const lignesColis = a.colis
    .map((c) => `  - Colis n° ${c.numero ?? '?'} : ${(c.poids ?? 0).toLocaleString('fr-FR')} kg`)
    .join('\n');
  const body = [
    `Bonjour,`,
    ``,
    `Merci de prévoir un enlèvement pour la commande ${a.reference}.`,
    ``,
    `Affaire : ${a.affaireNumero}`,
    `Destinataire : ${a.destinataire}`,
    `Adresse : ${a.adresse}`,
    `Enlèvement : ${a.dateEnlevement ?? 'à convenir'}`,
    `Livraison : ${a.dateLivraison ?? 'à convenir'}`,
    ``,
    `Encombrement : ${e.long_ml} ml x ${e.larg_ml} ml x ${e.haut_ml} ml — ${e.poids_t} t`,
    `Détail par colis :`,
    lignesColis,
    ``,
    `Coût convenu : ${a.cout != null ? `${a.cout} €` : 'à confirmer'}`,
    ``,
    `Cordialement,`,
    `HANS COFFRAGE`,
  ].join('\n');
  const params = new URLSearchParams({
    subject: `Commande transport ${a.reference} — ${a.affaireNumero}`,
    body,
  });
  return `mailto:rh@transports-rouillon.fr?${params.toString()}`;
}
```

- [ ] **Step 4 : Lancer les tests (succès attendu)**

Run: `pnpm test --run src/modules/livraisons/livraisonsData.test.ts`
Expected: PASS (tous les cas verts).

- [ ] **Step 5 : Commit**

```bash
git add src/modules/livraisons/livraisonsData.ts src/modules/livraisons/livraisonsData.test.ts
git commit -m "feat(livraisons): couche données pure (références, encombrement, mailto)"
```

---

## Task 2 : Hooks `useLivraisons.ts`

**Files:**
- Create: `src/modules/livraisons/useLivraisons.ts`
- Test: `src/modules/livraisons/useLivraisons.fetch.test.ts`

- [ ] **Step 1 : Écrire le test du fetch**

```ts
// src/modules/livraisons/useLivraisons.fetch.test.ts
import { describe, it, expect, vi } from 'vitest';
import { fetchLivraisons } from './useLivraisons';

describe('fetchLivraisons', () => {
  it('lit livraisons avec affaire/client et colis, triées par date desc', async () => {
    const rows = [{ id: 'l1', affaire_id: 'a', reference: 'LIV-2026-001' }];
    const order = vi.fn().mockResolvedValue({ data: rows, error: null });
    const select = vi.fn(() => ({ order }));
    const from = vi.fn(() => ({ select }));
    const res = await fetchLivraisons({ from } as never);
    expect(from).toHaveBeenCalledWith('livraisons');
    expect(order).toHaveBeenCalledWith('created_at', { ascending: false });
    expect(res).toEqual(rows);
  });
});
```

- [ ] **Step 2 : Lancer (échec attendu)**

Run: `pnpm test --run src/modules/livraisons/useLivraisons.fetch.test.ts`
Expected: FAIL (`fetchLivraisons` introuvable).

- [ ] **Step 3 : Implémenter les hooks**

```ts
// src/modules/livraisons/useLivraisons.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';
import type { Tables } from '../../lib/database.types';
import { nextReference } from './livraisonsData';

export type LivraisonRow = Tables<'livraisons'>;
export type LivraisonAvecAffaire = LivraisonRow & {
  affaire?: { numero: string; chantier: string | null; client?: { nom: string } | null } | null;
};

export async function fetchLivraisons(sb: SupabaseClient): Promise<LivraisonAvecAffaire[]> {
  const { data, error } = await sb
    .from('livraisons')
    .select('*, affaire:affaire_id(numero, chantier, client:client_id(nom))')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as LivraisonAvecAffaire[];
}

export function useLivraisons() {
  return useQuery({ queryKey: ['livraisons'], queryFn: () => fetchLivraisons(supabase) });
}

export type CreerLivraisonInput = {
  affaire_id: string;
  type: string;
  destination: string;
  transporteur: string;
  cout_transport: number | null;
  date_prevue: string | null;
  remarques: string | null;
  colisIds: string[]; // colis à rattacher
};

export async function creerLivraison(sb: SupabaseClient, input: CreerLivraisonInput): Promise<LivraisonRow> {
  // Génère la référence à partir des références existantes de l'année.
  const annee = new Date().getFullYear();
  const { data: existing, error: eRef } = await sb.from('livraisons').select('reference');
  if (eRef) throw new Error(eRef.message);
  const reference = nextReference('LIV', (existing ?? []).map((r) => r.reference as string), annee);

  const { data: liv, error } = await sb
    .from('livraisons')
    .insert({
      affaire_id: input.affaire_id,
      reference,
      type: input.type,
      destination: input.destination,
      transporteur: input.transporteur,
      cout_transport: input.cout_transport,
      date_prevue: input.date_prevue,
      remarques: input.remarques,
    })
    .select('*')
    .single();
  if (error) throw new Error(error.message);

  // Rattache les colis sélectionnés.
  if (input.colisIds.length > 0) {
    const { error: e2 } = await sb.from('colis').update({ livraison_id: liv.id }).in('id', input.colisIds);
    if (e2) throw new Error(e2.message);
  }

  // Marque l'étape "livraison" (robuste aux affaires sans étapes complètes).
  const { error: e3 } = await sb
    .from('etapes_affaire')
    .upsert(
      { affaire_id: input.affaire_id, etape: 'livraison', fait: true, date: new Date().toISOString() },
      { onConflict: 'affaire_id,etape' },
    );
  if (e3) throw new Error(e3.message);
  return liv as LivraisonRow;
}

export function useCreerLivraison() {
  const qc = useQueryClient();
  return useMutation<LivraisonRow, Error, CreerLivraisonInput>({
    mutationFn: (input) => creerLivraison(supabase, input),
    onSuccess: (_d, input) => {
      qc.invalidateQueries({ queryKey: ['livraisons'] });
      qc.invalidateQueries({ queryKey: ['colis'] });
      qc.invalidateQueries({ queryKey: ['etapes', input.affaire_id] });
      qc.invalidateQueries({ queryKey: ['affaires'] });
    },
  });
}

export async function majStatutLivraison(sb: SupabaseClient, vars: { id: string; statut: string }): Promise<void> {
  const { error } = await sb.from('livraisons').update({ statut: vars.statut }).eq('id', vars.id);
  if (error) throw new Error(error.message);
}

export function useMajStatutLivraison() {
  const qc = useQueryClient();
  return useMutation<void, Error, { id: string; statut: string }>({
    mutationFn: (vars) => majStatutLivraison(supabase, vars),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['livraisons'] }),
  });
}
```

- [ ] **Step 4 : Lancer (succès attendu)**

Run: `pnpm test --run src/modules/livraisons/useLivraisons.fetch.test.ts`
Expected: PASS.

- [ ] **Step 5 : Commit**

```bash
git add src/modules/livraisons/useLivraisons.ts src/modules/livraisons/useLivraisons.fetch.test.ts
git commit -m "feat(livraisons): hooks fetch/créer/maj-statut livraison (online)"
```

---

## Task 3 : Hooks `useCommandesTransport.ts`

**Files:**
- Create: `src/modules/livraisons/useCommandesTransport.ts`
- Test: `src/modules/livraisons/useCommandesTransport.fetch.test.ts`

- [ ] **Step 1 : Écrire le test du fetch**

```ts
// src/modules/livraisons/useCommandesTransport.fetch.test.ts
import { describe, it, expect, vi } from 'vitest';
import { fetchCommandes } from './useCommandesTransport';

describe('fetchCommandes', () => {
  it('lit commandes_transport avec affaire, triées par date desc', async () => {
    const rows = [{ id: 'c1', affaire_id: 'a', reference: 'CT-2026-001' }];
    const order = vi.fn().mockResolvedValue({ data: rows, error: null });
    const select = vi.fn(() => ({ order }));
    const from = vi.fn(() => ({ select }));
    const res = await fetchCommandes({ from } as never);
    expect(from).toHaveBeenCalledWith('commandes_transport');
    expect(order).toHaveBeenCalledWith('created_at', { ascending: false });
    expect(res).toEqual(rows);
  });
});
```

- [ ] **Step 2 : Lancer (échec attendu)**

Run: `pnpm test --run src/modules/livraisons/useCommandesTransport.fetch.test.ts`
Expected: FAIL.

- [ ] **Step 3 : Implémenter**

```ts
// src/modules/livraisons/useCommandesTransport.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';
import type { Tables } from '../../lib/database.types';
import { nextReference, type Encombrement } from './livraisonsData';

export type CommandeRow = Tables<'commandes_transport'>;
export type CommandeAvecAffaire = CommandeRow & {
  affaire?: { numero: string; chantier: string | null } | null;
};

export async function fetchCommandes(sb: SupabaseClient): Promise<CommandeAvecAffaire[]> {
  const { data, error } = await sb
    .from('commandes_transport')
    .select('*, affaire:affaire_id(numero, chantier)')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as CommandeAvecAffaire[];
}

export function useCommandesTransport() {
  return useQuery({ queryKey: ['commandes_transport'], queryFn: () => fetchCommandes(supabase) });
}

export type CreerCommandeInput = {
  affaire_id: string;
  livraison_id: string | null;
  cout: number | null;
  date_enlevement: string | null;
  date_livraison: string | null;
  encombrement: Encombrement;
};

export async function creerCommande(sb: SupabaseClient, input: CreerCommandeInput): Promise<CommandeRow> {
  const annee = new Date().getFullYear();
  const { data: existing, error: eRef } = await sb.from('commandes_transport').select('reference');
  if (eRef) throw new Error(eRef.message);
  const reference = nextReference('CT', (existing ?? []).map((r) => r.reference as string), annee);

  const { data: cmd, error } = await sb
    .from('commandes_transport')
    .insert({
      affaire_id: input.affaire_id,
      livraison_id: input.livraison_id,
      reference,
      cout: input.cout,
      date_enlevement: input.date_enlevement,
      date_livraison: input.date_livraison,
      long_ml: input.encombrement.long_ml,
      larg_ml: input.encombrement.larg_ml,
      haut_ml: input.encombrement.haut_ml,
      poids_t: input.encombrement.poids_t,
      statut: 'envoyee', // créée au moment de l'envoi (mailto)
    })
    .select('*')
    .single();
  if (error) throw new Error(error.message);
  return cmd as CommandeRow;
}

export function useCreerCommande() {
  const qc = useQueryClient();
  return useMutation<CommandeRow, Error, CreerCommandeInput>({
    mutationFn: (input) => creerCommande(supabase, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['commandes_transport'] }),
  });
}
```

- [ ] **Step 4 : Lancer (succès attendu)**

Run: `pnpm test --run src/modules/livraisons/useCommandesTransport.fetch.test.ts`
Expected: PASS.

- [ ] **Step 5 : Commit**

```bash
git add src/modules/livraisons/useCommandesTransport.ts src/modules/livraisons/useCommandesTransport.fetch.test.ts
git commit -m "feat(transport): hooks fetch/créer commande transport"
```

---

## Task 4 : Templates d'impression `print/`

**Files:**
- Create: `src/modules/livraisons/print/BonLivraisonPrint.tsx`
- Create: `src/modules/livraisons/print/EtiquetteColisPrint.tsx`
- Create: `src/modules/livraisons/print/CommandeTransportPrint.tsx`
- Test: `src/modules/livraisons/print/print.test.tsx`

> **Référence gabarits** (à relire avant d'écrire le JSX, pour les champs exacts) :
> `C:\Users\aissa\Documents\hans-coffrage\saas_hans_coffrage\DEVELOPPEMENT ERP\BL_HANS_COFFRAGE.pdf`,
> `ETIQUETTE_VIERGE.pdf` + `ETIQUETTE_REMPLIE_EXEMPLE.pdf`, `Commande_Transport_exemple.pdf`.
> Les templates sont des composants purs (props → JSX). En-tête société : HANS COFFRAGE,
> 20 rue de la Haitroye, 88540 BUSSANG, SIRET 447 801 978 00019.

- [ ] **Step 1 : Écrire le test de rendu**

```tsx
// src/modules/livraisons/print/print.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BonLivraisonPrint } from './BonLivraisonPrint';
import { EtiquetteColisPrint } from './EtiquetteColisPrint';

const liv = {
  reference: 'LIV-2026-001',
  affaireNumero: 'C26-0627-01',
  client: 'EIFFAGE',
  chantier: 'STEP WASMUEL',
  destination: 'QUAREGNON BELGIQUE',
  date: '2026-06-27',
  colis: [{ numero: 1, longueur: 1200, largeur: 800, hauteur: 200, poids: 860 }],
};

describe('BonLivraisonPrint', () => {
  it('affiche la référence, le client et le colis', () => {
    render(<BonLivraisonPrint {...liv} />);
    expect(screen.getByText('LIV-2026-001')).toBeInTheDocument();
    expect(screen.getByText(/EIFFAGE/)).toBeInTheDocument();
    expect(screen.getByText(/860/)).toBeInTheDocument();
  });
});

describe('EtiquetteColisPrint', () => {
  it('affiche le n° de colis, l’affaire et le poids', () => {
    render(
      <EtiquetteColisPrint
        affaireNumero="C26-0627-01"
        client="EIFFAGE"
        chantier="STEP WASMUEL"
        colis={{ numero: 1, longueur: 1200, largeur: 800, hauteur: 200, poids: 860 }}
        total={5}
      />,
    );
    expect(screen.getByText(/1\s*\/\s*5/)).toBeInTheDocument();
    expect(screen.getByText('C26-0627-01')).toBeInTheDocument();
    expect(screen.getByText(/860/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2 : Lancer (échec attendu)**

Run: `pnpm test --run src/modules/livraisons/print/print.test.tsx`
Expected: FAIL (composants introuvables).

- [ ] **Step 3 : Implémenter les 3 templates**

Composants purs typés. Utiliser les couleurs `C` (`../../lib/theme`) et `formatDate` (`../../lib/format`). Structure minimale (à enrichir visuellement selon les gabarits) :

```tsx
// src/modules/livraisons/print/BonLivraisonPrint.tsx
import { C } from '../../../lib/theme';
import { formatDate } from '../../../lib/format';

export type BLColis = { numero: number | null; longueur: number | null; largeur: number | null; hauteur: number | null; poids: number | null };
export type BonLivraisonPrintProps = {
  reference: string;
  affaireNumero: string;
  client: string;
  chantier: string;
  destination: string;
  date: string;
  colis: BLColis[];
};

export function BonLivraisonPrint(p: BonLivraisonPrintProps) {
  const totalKg = p.colis.reduce((s, c) => s + (c.poids ?? 0), 0);
  return (
    <div className="print-doc bl" style={{ fontFamily: 'Georgia, serif', color: C.text, padding: 24 }}>
      <header style={{ borderBottom: `2px solid ${C.primary}`, paddingBottom: 8, marginBottom: 16 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700 }}>HANS COFFRAGE</h1>
        <div style={{ fontSize: 11 }}>20 rue de la Haitroye · 88540 BUSSANG · SIRET 447 801 978 00019</div>
        <h2 style={{ fontSize: 16, marginTop: 8 }}>Bon de livraison <span style={{ fontFamily: 'monospace' }}>{p.reference}</span></h2>
      </header>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16, fontSize: 12 }}>
        <div><strong>Affaire :</strong> {p.affaireNumero}</div>
        <div><strong>Date :</strong> {formatDate(p.date)}</div>
        <div><strong>Client :</strong> {p.client}</div>
        <div><strong>Chantier :</strong> {p.chantier}</div>
        <div style={{ gridColumn: '1 / 3' }}><strong>Destination :</strong> {p.destination}</div>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
        <thead>
          <tr style={{ backgroundColor: C.bgSoft }}>
            {['Colis', 'L (cm)', 'l (cm)', 'h (cm)', 'Poids (kg)'].map((h) => (
              <th key={h} style={{ textAlign: 'left', padding: '6px 8px', borderBottom: `1px solid ${C.border}` }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {p.colis.map((c) => (
            <tr key={c.numero}>
              <td style={{ padding: '6px 8px' }}>n° {c.numero}</td>
              <td style={{ padding: '6px 8px' }}>{c.longueur}</td>
              <td style={{ padding: '6px 8px' }}>{c.largeur}</td>
              <td style={{ padding: '6px 8px' }}>{c.hauteur}</td>
              <td style={{ padding: '6px 8px', fontFamily: 'monospace' }}>{c.poids}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr><td colSpan={4} style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 700 }}>Total</td>
            <td style={{ padding: '6px 8px', fontFamily: 'monospace', fontWeight: 700 }}>{totalKg}</td></tr>
        </tfoot>
      </table>
      <div style={{ marginTop: 40, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, fontSize: 12 }}>
        <div>Signature expéditeur :</div>
        <div>Signature destinataire :</div>
      </div>
    </div>
  );
}
```

```tsx
// src/modules/livraisons/print/EtiquetteColisPrint.tsx
import { C } from '../../../lib/theme';

export type EtiquetteColis = { numero: number | null; longueur: number | null; largeur: number | null; hauteur: number | null; poids: number | null };
export type EtiquetteColisPrintProps = {
  affaireNumero: string;
  client: string;
  chantier: string;
  colis: EtiquetteColis;
  total: number;
};

// Étiquette A5 paysage (210 x 148 mm).
export function EtiquetteColisPrint(p: EtiquetteColisPrintProps) {
  return (
    <div
      className="print-doc etiquette"
      style={{ width: '210mm', height: '148mm', boxSizing: 'border-box', padding: 24, fontFamily: 'Georgia, serif', color: C.text, border: `2px solid ${C.text}` }}
    >
      <div style={{ fontSize: 22, fontWeight: 700 }}>HANS COFFRAGE</div>
      <div style={{ fontSize: 48, fontWeight: 700, fontFamily: 'monospace', margin: '16px 0' }}>{p.colis.numero} / {p.total}</div>
      <div style={{ fontSize: 20, fontFamily: 'monospace' }}>{p.affaireNumero}</div>
      <div style={{ fontSize: 18, marginTop: 8 }}>{p.client} · {p.chantier}</div>
      <div style={{ display: 'flex', gap: 24, marginTop: 24, fontSize: 18 }}>
        <div><strong>Dim.</strong> {p.colis.longueur}×{p.colis.largeur}×{p.colis.hauteur} cm</div>
        <div><strong>Poids</strong> {p.colis.poids} kg</div>
      </div>
    </div>
  );
}
```

```tsx
// src/modules/livraisons/print/CommandeTransportPrint.tsx
import { C } from '../../../lib/theme';
import { formatDate } from '../../../lib/format';
import type { Encombrement } from '../livraisonsData';

export type CommandeTransportPrintProps = {
  reference: string;
  affaireNumero: string;
  destinataire: string;
  adresse: string;
  conducteur: string | null;
  conducteurTel: string | null;
  dateEnlevement: string | null;
  dateLivraison: string | null;
  cout: number | null;
  encombrement: Encombrement;
  colis: { numero: number | null; poids: number | null }[];
};

export function CommandeTransportPrint(p: CommandeTransportPrintProps) {
  const e = p.encombrement;
  return (
    <div className="print-doc commande" style={{ fontFamily: 'Georgia, serif', color: C.text, padding: 24 }}>
      <header style={{ borderBottom: `2px solid ${C.primary}`, paddingBottom: 8, marginBottom: 16 }}>
        <h1 style={{ fontSize: 18, fontWeight: 700 }}>Commande transport — Transports ROUILLON</h1>
        <div style={{ fontFamily: 'monospace' }}>{p.reference} · Affaire {p.affaireNumero}</div>
      </header>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 12, marginBottom: 16 }}>
        <div><strong>Destinataire :</strong> {p.destinataire}</div>
        <div><strong>Adresse :</strong> {p.adresse}</div>
        <div><strong>Conducteur :</strong> {p.conducteur ?? '—'} {p.conducteurTel ?? ''}</div>
        <div><strong>Enlèvement :</strong> {p.dateEnlevement ? formatDate(p.dateEnlevement) : '—'}</div>
        <div><strong>Livraison :</strong> {p.dateLivraison ? formatDate(p.dateLivraison) : '—'}</div>
        <div><strong>Coût convenu :</strong> {p.cout != null ? `${p.cout} €` : '—'}</div>
      </div>
      <div style={{ fontSize: 12, marginBottom: 12 }}>
        <strong>Encombrement :</strong> {e.long_ml} ml × {e.larg_ml} ml × {e.haut_ml} ml — {e.poids_t} t
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
        <thead><tr style={{ backgroundColor: C.bgSoft }}>
          <th style={{ textAlign: 'left', padding: '6px 8px' }}>Colis</th>
          <th style={{ textAlign: 'left', padding: '6px 8px' }}>Poids (kg)</th>
        </tr></thead>
        <tbody>
          {p.colis.map((c) => (
            <tr key={c.numero}>
              <td style={{ padding: '6px 8px' }}>n° {c.numero}</td>
              <td style={{ padding: '6px 8px', fontFamily: 'monospace' }}>{(c.poids ?? 0).toLocaleString('fr-FR')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 4 : Lancer (succès attendu)**

Run: `pnpm test --run src/modules/livraisons/print/print.test.tsx`
Expected: PASS.

- [ ] **Step 5 : Commit**

```bash
git add src/modules/livraisons/print/
git commit -m "feat(livraisons): templates impression BL / étiquette A5 / commande transport"
```

---

## Task 5 : `LivraisonsPage.tsx` + route

**Files:**
- Create: `src/modules/livraisons/LivraisonsPage.tsx`
- Create: `src/modules/livraisons/LivraisonsPage.test.tsx`
- Modify: `src/App.tsx` (import lazy + route + retirer `livraisons` de `BUILT_IDS`)

> **Référence maquette** : PageLivraisons l.7300–7388, ModalNouvelleLivraison l.2325, ModalVoirLivraison l.2277. Reproduire la structure exacte (PageHeader, 4 KPI, carte « Affaires prêtes à expédier », tableau, modals). Données réelles via `useLivraisons` / `useAffaires` / `useColis`. Le bouton « Marquer livré » crée une livraison rapide OU passe le statut — pour la fidélité maquette, ici il **ouvre la modale Nouvelle livraison pré-remplie sur l'affaire**. Pré-remplir `destination` depuis `affaire.chantier` + client. Les colis sélectionnables = colis de l'affaire **sans** `livraison_id`.

- [ ] **Step 1 : Écrire un test de rendu (smoke + KPI)**

```tsx
// src/modules/livraisons/LivraisonsPage.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import LivraisonsPage from './LivraisonsPage';

vi.mock('./useLivraisons', () => ({
  useLivraisons: () => ({ data: [], isLoading: false }),
  useCreerLivraison: () => ({ mutate: vi.fn(), isPending: false }),
  useMajStatutLivraison: () => ({ mutate: vi.fn(), isPending: false }),
}));
vi.mock('../affaires/useAffaires', () => ({ useAffaires: () => ({ data: [], isLoading: false }) }));
vi.mock('../colisage/useColis', () => ({ useColis: () => ({ data: [], isLoading: false }) }));

function wrap(ui: React.ReactNode) {
  const qc = new QueryClient();
  return render(<QueryClientProvider client={qc}><MemoryRouter>{ui}</MemoryRouter></QueryClientProvider>);
}

describe('LivraisonsPage', () => {
  it('affiche le titre et les KPI', () => {
    wrap(<LivraisonsPage />);
    expect(screen.getByText('Livraisons')).toBeInTheDocument();
    expect(screen.getByText('En préparation')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2 : Lancer (échec attendu)**

Run: `pnpm test --run src/modules/livraisons/LivraisonsPage.test.tsx`
Expected: FAIL (page introuvable).

- [ ] **Step 3 : Implémenter la page**

Porter `PageLivraisons` (maquette l.7300) en TS/TSX avec les primitives du projet (`PageHeader`, `Card`, `KPI`, `Btn`, `Badge`, `StatusBadge`, `Modal`, `Field`, `Input`, `Select`). KPI calculés du réel : `En préparation` = livraisons statut `en_preparation`, `Expédiés` = `expedie`, `Livrés ce mois` = `livre` créées ce mois, `Tonnage total` = somme poids colis rattachés / 1000. Carte « Affaires prêtes à expédier » = affaires avec ≥1 colis sans `livraison_id`. `ModalNouvelleLivraison` utilise `react-hook-form` + cases colis (colis de l'affaire sans `livraison_id`) → `useCreerLivraison`. `ModalVoirLivraison` → bouton BL ouvre la vue d'impression (Task 7 wiring), bouton « Confirmer expédition » → `useMajStatutLivraison({ statut: 'expedie' })`. (Structure détaillée : suivre la maquette ligne à ligne ; voir aussi `ColisagePage.tsx` pour le pattern modal+rhf du module.)

- [ ] **Step 4 : Câbler la route**

Dans `src/App.tsx` :
- ajouter `const LivraisonsPage = lazy(() => import('./modules/livraisons/LivraisonsPage'));`
- ajouter `'livraisons'` à `BUILT_IDS`
- ajouter la route :
```tsx
<Route path="livraisons" element={<ProtectedRoute page="livraisons"><LivraisonsPage /></ProtectedRoute>} />
```

- [ ] **Step 5 : Lancer tests + build**

Run: `pnpm test --run src/modules/livraisons/LivraisonsPage.test.tsx && pnpm build`
Expected: PASS + build OK.

- [ ] **Step 6 : Commit**

```bash
git add src/modules/livraisons/LivraisonsPage.tsx src/modules/livraisons/LivraisonsPage.test.tsx src/App.tsx
git commit -m "feat(livraisons): page Livraisons fidèle maquette + route"
```

---

## Task 6 : `TransportPage.tsx` + route

**Files:**
- Create: `src/modules/livraisons/TransportPage.tsx`
- Create: `src/modules/livraisons/TransportPage.test.tsx`
- Modify: `src/App.tsx` (import lazy + route + `BUILT_IDS`)

> **Référence maquette** : PageTransport l.7390–7470, ModalNouveauTransport l.2356. Reproduire : 4 KPI, carte « Nouvelle commande transport » (affaire → encombrement & détail colis **auto** via `encombrement(colis)`, dates, coût, coordonnées destinataire auto depuis affaire+client), carte « Vérification factures Rouillon » (liste des commandes). Bouton « Envoyer la commande » = `useCreerCommande` puis `window.location.href = mailtoCommande(...)`. Bouton « Aperçu » = vue d'impression `CommandeTransportPrint`.

- [ ] **Step 1 : Écrire un test de rendu**

```tsx
// src/modules/livraisons/TransportPage.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import TransportPage from './TransportPage';

vi.mock('./useCommandesTransport', () => ({
  useCommandesTransport: () => ({ data: [], isLoading: false }),
  useCreerCommande: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));
vi.mock('../affaires/useAffaires', () => ({ useAffaires: () => ({ data: [], isLoading: false }) }));
vi.mock('../colisage/useColis', () => ({ useColis: () => ({ data: [], isLoading: false }) }));

function wrap(ui: React.ReactNode) {
  const qc = new QueryClient();
  return render(<QueryClientProvider client={qc}><MemoryRouter>{ui}</MemoryRouter></QueryClientProvider>);
}

describe('TransportPage', () => {
  it('affiche le titre et la carte commande', () => {
    wrap(<TransportPage />);
    expect(screen.getByText('Transport')).toBeInTheDocument();
    expect(screen.getByText(/Nouvelle commande transport/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2 : Lancer (échec attendu)**

Run: `pnpm test --run src/modules/livraisons/TransportPage.test.tsx`
Expected: FAIL.

- [ ] **Step 3 : Implémenter la page**

Porter `PageTransport`. Sélecteur d'affaire → charge ses colis (via `useColis` filtré `affaire_id`) → `encombrement(colis)` remplit Long./Larg./Haut./Poids (lecture seule + override possible) + détail par colis. Coordonnées destinataire auto : `affaire.client.nom`, adresse client, `affaire.conducteur` / `affaire.conducteur_tel`. « Envoyer la commande » : `await useCreerCommande().mutateAsync(input)` puis `window.location.href = mailtoCommande({...})`. KPI : commandes ce mois, coût ce mois (somme `cout`), coût moyen, régions (placeholder honnête si non calculable). Carte factures = tableau des commandes (date/affaire/destination/coût).

- [ ] **Step 4 : Câbler la route**

Dans `src/App.tsx` : `const TransportPage = lazy(() => import('./modules/livraisons/TransportPage'));`, ajouter `'transport'` à `BUILT_IDS`, route :
```tsx
<Route path="transport" element={<ProtectedRoute page="transport"><TransportPage /></ProtectedRoute>} />
```

- [ ] **Step 5 : Lancer tests + build**

Run: `pnpm test --run src/modules/livraisons/TransportPage.test.tsx && pnpm build`
Expected: PASS + build OK.

- [ ] **Step 6 : Commit**

```bash
git add src/modules/livraisons/TransportPage.tsx src/modules/livraisons/TransportPage.test.tsx src/App.tsx
git commit -m "feat(transport): page Transport (commande Rouillon + mailto) + route"
```

---

## Task 7 : Vue d'impression (BL / étiquette / commande) branchée

**Files:**
- Create: `src/modules/livraisons/print/PrintView.tsx` (overlay plein écran imprimable)
- Modify: `LivraisonsPage.tsx` / `TransportPage.tsx` (déclencheurs)
- Modify: `src/index.css` (règles `@media print`)

- [ ] **Step 1 : Implémenter `PrintView`**

Composant qui prend un `kind` (`bl` | `etiquettes` | `commande`) + données, affiche le(s) template(s) dans un overlay, et expose un bouton « Imprimer » → `window.print()` + « Fermer ». Pour `etiquettes`, mapper chaque colis sur `EtiquetteColisPrint` avec `page-break-after: always`.

```tsx
// src/modules/livraisons/print/PrintView.tsx
import { C } from '../../../lib/theme';

export function PrintView({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="print-overlay" style={{ position: 'fixed', inset: 0, backgroundColor: 'white', zIndex: 50, overflow: 'auto' }}>
      <div className="no-print" style={{ position: 'sticky', top: 0, display: 'flex', gap: 8, padding: 12, borderBottom: `1px solid ${C.border}`, backgroundColor: C.bgSoft }}>
        <button onClick={() => window.print()} style={{ padding: '6px 12px', backgroundColor: C.primary, color: 'white', borderRadius: 6 }}>Imprimer</button>
        <button onClick={onClose} style={{ padding: '6px 12px', border: `1px solid ${C.border}`, borderRadius: 6 }}>Fermer</button>
        <span style={{ alignSelf: 'center', fontWeight: 700 }}>{title}</span>
      </div>
      <div className="print-area">{children}</div>
    </div>
  );
}
```

- [ ] **Step 2 : Règles d'impression**

Ajouter dans `src/index.css` :

```css
@media print {
  .no-print { display: none !important; }
  .print-doc.etiquette { page-break-after: always; }
}
```

- [ ] **Step 3 : Brancher les déclencheurs**

Dans `LivraisonsPage`, le bouton « BL » de `ModalVoirLivraison` ouvre `<PrintView title="Bon de livraison"><BonLivraisonPrint .../></PrintView>` ; ajouter un bouton « Étiquettes » qui rend la liste d'`EtiquetteColisPrint`. Dans `TransportPage`, « Aperçu » ouvre `<PrintView><CommandeTransportPrint .../></PrintView>`.

- [ ] **Step 4 : Lancer suite + build**

Run: `pnpm test --run && pnpm build`
Expected: tous les tests PASS + build OK.

- [ ] **Step 5 : Commit**

```bash
git add src/modules/livraisons/print/PrintView.tsx src/index.css src/modules/livraisons/LivraisonsPage.tsx src/modules/livraisons/TransportPage.tsx
git commit -m "feat(livraisons): vue d'impression BL/étiquettes/commande branchée"
```

---

## Task 8 : Vérification contrôleur + preuve navigateur + push

- [ ] **Step 1 : Suite complète + lint + build**

Run: `pnpm test --run && pnpm lint && pnpm build`
Expected: tout vert (≈ +15 tests vs base 209).

- [ ] **Step 2 : Preuve navigateur (compte ADMIN Gilles)**

`preview_start` → login Gilles (credentials `comptes-hans-coffrage.csv`). Scénario :
1. Créer une affaire de test + 2 colis (la base est vide — cf. piège affaire démo).
2. `/livraisons` → « Nouvelle livraison » sur l'affaire, cocher les 2 colis → créer. Vérifier : réf `LIV-2026-001`, colis rattachés (`livraison_id`), étape `livraison` faite (vérif SQL via MCP `execute_sql`).
3. Ouvrir la livraison → imprimer BL + étiquettes (vérif rendu via snapshot, le screenshot peut timeouter — cf. note infra renderer).
4. `/transport` → sélectionner l'affaire → encombrement auto rempli → « Envoyer » → commande `CT-2026-001` créée (`statut envoyee`) + mailto généré (vérifier l'URL `mailto:rh@transports-rouillon.fr`).
5. **Nettoyer** : supprimer commandes_transport, livraisons (les colis repassent `livraison_id null` ou sont supprimés), colis, affaire de test via MCP `execute_sql`.

- [ ] **Step 3 : Push**

```bash
git push origin main
```

- [ ] **Step 4 : Mettre à jour la mémoire**

Mettre à jour `hans-coffrage-prod-backend.md` : module Livraisons + Transport terminé, nouvel `origin/main`, nombre de tests, tables ajoutées, et marquer l'incrément logistique 2 fait.

---

## Notes de fidélité / pièges

- **Piège affaire démo `C26-0701-01`** : étapes incomplètes → toujours `upsert onConflict:'affaire_id,etape'` pour l'étape `livraison` (déjà prévu Task 2).
- **Unités** : colis stockés en **cm** (dimensions) et **kg** (poids) ; commande transport affiche **ml** et **t** ; conversion dans `encombrement()`.
- **Offline** : ne PAS greffer le socle B1 (online-only). Ne pas enregistrer de `setMutationDefaults`.
- **RLS** : opérateur n'a pas accès (pages non listées dans `roles.ts` pour `operateur`) ; les policies refusent aussi côté DB.
- **Screenshots preview** : `preview_screenshot` peut timeouter (infra renderer) → preuve via snapshot accessibilité + vérif SQL (méthode déjà utilisée pour Flashage).
```
