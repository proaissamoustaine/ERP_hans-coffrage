import { useQuery, useMutation } from '@tanstack/react-query';
import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';
import type { ChuteRow } from './chutesData';
import type { DeclarerChuteInput, ReutiliserChuteVars } from '../../lib/offlineMutations';

export type ChuteAvecAffaires = ChuteRow & {
  origine?: { numero: string } | null;
  conso?: { numero: string } | null;
};

export async function fetchChutes(sb: SupabaseClient): Promise<ChuteAvecAffaires[]> {
  const { data, error } = await sb
    .from('chutes')
    .select('*, origine:affaire_origine(numero), conso:affaire_consommation(numero)')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as ChuteAvecAffaires[];
}

export function useChutes() {
  return useQuery({ queryKey: ['chutes'], queryFn: () => fetchChutes(supabase) });
}

// mutationFn fournies par setMutationDefaults (offlineMutations.ts) → rejouables hors-ligne.
export function useDeclarerChute() {
  return useMutation<void, Error, DeclarerChuteInput>({ mutationKey: ['declarer-chute'] });
}
export function useReutiliserChute() {
  return useMutation<void, Error, ReutiliserChuteVars>({ mutationKey: ['reutiliser-chute'] });
}
