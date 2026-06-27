// src/modules/flashage/useHeuresFlashees.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';
import type { Database } from '../../lib/database.types';

export type HeureFlashee = Database['public']['Tables']['heures_flashees']['Row'];

export type FlashInput = {
  affaire_id: string;
  code_tache: string;
  operateur_id: string;
  operateur_nom: string;
  duree_min: number;
  /** ISO fixé côté client au moment du début du pointage (compat offline). */
  date: string;
};

export async function fetchHeuresFlashees(sb: SupabaseClient): Promise<HeureFlashee[]> {
  const { data, error } = await sb
    .from('heures_flashees')
    .select('*')
    .order('date', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as HeureFlashee[];
}

export async function insertFlash(sb: SupabaseClient, input: FlashInput): Promise<void> {
  const { error } = await sb.from('heures_flashees').insert(input);
  if (error) throw new Error(error.message);
}

export function useHeuresFlashees() {
  return useQuery({
    queryKey: ['heures_flashees'],
    queryFn: () => fetchHeuresFlashees(supabase),
  });
}

export function useFlasherHeures() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: FlashInput) => insertFlash(supabase, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['heures_flashees'] }),
  });
}
