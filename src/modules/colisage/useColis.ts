import { useQuery, useMutation } from '@tanstack/react-query';
import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';
import type { ColisRow } from './colisData';
import type { CreerColisInput, PeserColisVars } from '../../lib/offlineMutations';

export type ColisAvecAffaire = ColisRow & { affaire?: { numero: string } | null };

export async function fetchColis(sb: SupabaseClient): Promise<ColisAvecAffaire[]> {
  const { data, error } = await sb
    .from('colis')
    .select('*, affaire:affaire_id(numero)')
    .order('date', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as ColisAvecAffaire[];
}

export function useColis() {
  return useQuery({ queryKey: ['colis'], queryFn: () => fetchColis(supabase) });
}

// mutationFn fournies par setMutationDefaults (offlineMutations.ts) → rejouables hors-ligne.
export function useCreerColis() {
  return useMutation<void, Error, CreerColisInput>({ mutationKey: ['creer-colis'] });
}
export function usePeserColis() {
  return useMutation<void, Error, PeserColisVars>({ mutationKey: ['peser-colis'] });
}
