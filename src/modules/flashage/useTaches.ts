// src/modules/flashage/useTaches.ts
import { useQuery } from '@tanstack/react-query';
import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';
import type { Database } from '../../lib/database.types';

export type TacheRow = Database['public']['Tables']['taches_codes']['Row'];
export type CategorieHeuresRow = Database['public']['Tables']['categories_heures']['Row'];

export async function fetchTaches(sb: SupabaseClient): Promise<TacheRow[]> {
  const { data, error } = await sb.from('taches_codes').select('*').order('code');
  if (error) throw new Error(error.message);
  return (data ?? []) as TacheRow[];
}

export async function fetchCategoriesHeures(sb: SupabaseClient): Promise<CategorieHeuresRow[]> {
  const { data, error } = await sb.from('categories_heures').select('*').order('code');
  if (error) throw new Error(error.message);
  return (data ?? []) as CategorieHeuresRow[];
}

export function useTaches() {
  return useQuery({
    queryKey: ['taches_codes'],
    queryFn: () => fetchTaches(supabase),
    staleTime: 1000 * 60 * 60,
  });
}

export function useCategoriesHeures() {
  return useQuery({
    queryKey: ['categories_heures'],
    queryFn: () => fetchCategoriesHeures(supabase),
    staleTime: 1000 * 60 * 60,
  });
}
