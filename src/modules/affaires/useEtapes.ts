import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';
import { calcAvancement } from '../../lib/etapes';

export async function fetchEtapes(sb: SupabaseClient, affaireId: string) {
  const { data, error } = await sb
    .from('etapes_affaire')
    .select('*')
    .eq('affaire_id', affaireId);
  if (error) throw new Error(error.message);
  return data ?? [];
}

export function useEtapes(affaireId: string | null) {
  return useQuery({
    queryKey: ['etapes', affaireId],
    queryFn: () => fetchEtapes(supabase, affaireId!),
    enabled: !!affaireId,
  });
}

export function useToggleEtape() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      etapeId,
      fait,
      affaireId,
      etapes,
    }: {
      etapeId: string;
      fait: boolean;
      affaireId: string;
      etapes: { id: string; fait: boolean }[];
    }) => {
      // Step 1: update etapes_affaire
      const { error: errEtape } = await supabase
        .from('etapes_affaire')
        .update({ fait, date: fait ? new Date().toISOString() : null })
        .eq('id', etapeId);
      if (errEtape) throw new Error(errEtape.message);

      // Step 2: recompute avancement and update affaire
      const newEtapes = etapes.map((e) => (e.id === etapeId ? { ...e, fait } : e));
      const avancement = calcAvancement(newEtapes);
      const { error: errAffaire } = await supabase
        .from('affaires')
        .update({ avancement })
        .eq('id', affaireId);
      if (errAffaire) throw new Error(errAffaire.message);
    },
    onSuccess: (_data, { affaireId }) => {
      qc.invalidateQueries({ queryKey: ['etapes', affaireId] });
      qc.invalidateQueries({ queryKey: ['affaires'] });
    },
  });
}
