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
      statut: 'envoyee',
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
