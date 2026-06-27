import { useQuery, useMutation } from '@tanstack/react-query';
import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';
import type { Database } from '../../lib/database.types';
import type { FlashInput } from '../../lib/offlineMutations';
export type { FlashInput } from '../../lib/offlineMutations';

export type HeureFlashee = Database['public']['Tables']['heures_flashees']['Row'];

export async function fetchHeuresFlashees(sb: SupabaseClient): Promise<HeureFlashee[]> {
  const { data, error } = await sb
    .from('heures_flashees')
    .select('*')
    .order('date', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as HeureFlashee[];
}

export function useHeuresFlashees() {
  return useQuery({
    queryKey: ['heures_flashees'],
    queryFn: () => fetchHeuresFlashees(supabase),
  });
}

// La mutationFn vient de setMutationDefaults(['flasher-heures']) (offlineMutations.ts)
// → mutation rejouable après reload hors-ligne.
export function useFlasherHeures() {
  return useMutation<void, Error, FlashInput>({ mutationKey: ['flasher-heures'] });
}
