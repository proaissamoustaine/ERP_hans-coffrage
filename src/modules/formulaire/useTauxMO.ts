import { useQuery } from '@tanstack/react-query';
import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';
import type { Tables } from '../../lib/database.types';

export type TauxMORow = Tables<'taux_horaires_mo'>;

export async function fetchTauxMO(sb: SupabaseClient): Promise<TauxMORow[]> {
  const { data, error } = await sb.from('taux_horaires_mo').select('*').order('code');
  if (error) throw new Error(error.message);
  return data ?? [];
}

/**
 * Hook taux horaires main d'œuvre.
 * staleTime = Infinity car les taux sont statiques (ne changent pas en cours de session).
 */
export function useTauxMO() {
  return useQuery({
    queryKey: ['taux_mo'],
    queryFn: () => fetchTauxMO(supabase),
    staleTime: Infinity,
  });
}
