import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';
import { nextAffaireNumero } from '../../lib/numero';
import { initialEtapes } from '../../lib/etapes';
import type { AffaireInput } from './affaireSchema';

export async function fetchAffaires(sb: SupabaseClient) {
  const { data, error } = await sb
    .from('affaires')
    .select('*, clients(nom)')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export const useAffaires = () =>
  useQuery({ queryKey: ['affaires'], queryFn: () => fetchAffaires(supabase) });

export function useCreateAffaire() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: AffaireInput) => {
      const { data: existing } = await supabase.from('affaires').select('numero');
      const numero = nextAffaireNumero(input.mode, (existing ?? []).map((a) => a.numero));
      const { data: affaire, error } = await supabase
        .from('affaires')
        .insert({
          numero,
          mode: input.mode,
          client_id: input.client_id,
          chantier: input.chantier || null,
          objet: input.objet || null,
          total_ht: input.total_ht,
          statut: 'En cours',
          avancement: 9,
          date_acceptation: new Date().toISOString().slice(0, 10),
          date_livraison: input.date_livraison || null,
        })
        .select()
        .single();
      if (error) throw new Error(error.message);
      const { error: e2 } = await supabase.from('etapes_affaire').insert(initialEtapes(affaire.id));
      if (e2) throw new Error(e2.message);
      return affaire;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['affaires'] }),
  });
}
