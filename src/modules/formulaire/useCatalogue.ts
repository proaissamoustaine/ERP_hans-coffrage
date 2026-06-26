import { useQuery } from '@tanstack/react-query';
import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';
import type { Tables } from '../../lib/database.types';

export type CatalogueRow = Tables<'catalogue_matieres'>;

export async function fetchCatalogue(sb: SupabaseClient): Promise<CatalogueRow[]> {
  const { data, error } = await sb
    .from('catalogue_matieres')
    .select('*')
    .order('cat')
    .order('famille')
    .order('ref');
  if (error) throw new Error(error.message);
  return data ?? [];
}

/**
 * Hook catalogue matières.
 * staleTime = Infinity car le catalogue est statique (ne change pas en cours de session).
 */
export function useCatalogue() {
  return useQuery({
    queryKey: ['catalogue'],
    queryFn: () => fetchCatalogue(supabase),
    staleTime: Infinity,
  });
}
