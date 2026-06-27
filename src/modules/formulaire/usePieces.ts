import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';
import type { Json } from '../../lib/database.types';
import type { PieceInput } from './pieceSchema';

export async function fetchPieces(sb: SupabaseClient, affaireId: string) {
  const { data, error } = await sb
    .from('pieces')
    .select('*')
    .eq('affaire_id', affaireId)
    .order('created_at');
  if (error) throw new Error(error.message);
  return data ?? [];
}

export function usePieces(affaireId: string | null) {
  return useQuery({
    queryKey: ['pieces', affaireId],
    queryFn: () => fetchPieces(supabase, affaireId!),
    enabled: !!affaireId,
  });
}

export function useCreatePiece() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: PieceInput) => {
      const { data, error } = await supabase
        .from('pieces')
        .insert({ ...input, fait: false, dimensions: (input.dimensions ?? null) as Json | null })
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: (_d, input) => {
      qc.invalidateQueries({ queryKey: ['pieces', input.affaire_id] });
    },
  });
}

export function useUpdatePiece() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { id: string; affaireId: string; patch: Partial<PieceInput> }) => {
      const { dimensions, ...rest } = vars.patch;
      const update = {
        ...rest,
        ...(dimensions !== undefined ? { dimensions: (dimensions ?? null) as Json | null } : {}),
      };
      const { error } = await supabase.from('pieces').update(update).eq('id', vars.id);
      if (error) throw new Error(error.message);
    },
    onSuccess: (_d, { affaireId }) => {
      qc.invalidateQueries({ queryKey: ['pieces', affaireId] });
    },
  });
}

export function useDeletePiece() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { id: string; affaireId: string }) => {
      const { error } = await supabase.from('pieces').delete().eq('id', vars.id);
      if (error) throw new Error(error.message);
    },
    onSuccess: (_d, { affaireId }) => {
      qc.invalidateQueries({ queryKey: ['pieces', affaireId] });
    },
  });
}

export function useTogglePieceFait() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { id: string; fait: boolean; faitPar: string | null; affaireId: string }) => {
      const { error } = await supabase
        .from('pieces')
        .update({
          fait: vars.fait,
          fait_par: vars.fait ? vars.faitPar : null,
          fait_date: vars.fait ? new Date().toISOString() : null,
        })
        .eq('id', vars.id);
      if (error) throw new Error(error.message);
    },
    onSuccess: (_d, { affaireId }) => {
      qc.invalidateQueries({ queryKey: ['pieces', affaireId] });
    },
  });
}

/**
 * Valide la fiche atelier : marque l'étape `saisie_pieces` de l'affaire comme faite.
 * Upsert robuste — l'affaire peut ne pas encore avoir d'étape `saisie_pieces`.
 */
export function useValiderFormulaire() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { affaireId: string; etapeId: string | null }) => {
      const now = new Date().toISOString();
      if (vars.etapeId) {
        const { error } = await supabase
          .from('etapes_affaire')
          .update({ fait: true, date: now })
          .eq('id', vars.etapeId);
        if (error) throw new Error(error.message);
      } else {
        const { error } = await supabase
          .from('etapes_affaire')
          .insert({ affaire_id: vars.affaireId, etape: 'saisie_pieces', fait: true, date: now });
        if (error) throw new Error(error.message);
      }
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['etapes', vars.affaireId] });
      qc.invalidateQueries({ queryKey: ['affaires'] });
    },
  });
}
