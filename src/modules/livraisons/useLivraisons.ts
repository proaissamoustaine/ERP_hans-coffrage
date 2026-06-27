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
  colisIds: string[];
};

export async function creerLivraison(sb: SupabaseClient, input: CreerLivraisonInput): Promise<LivraisonRow> {
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

  if (input.colisIds.length > 0) {
    const { error: e2 } = await sb.from('colis').update({ livraison_id: liv.id }).in('id', input.colisIds);
    if (e2) throw new Error(e2.message);
  }

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
