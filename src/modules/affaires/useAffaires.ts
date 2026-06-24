import { useQuery } from '@tanstack/react-query';
import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';

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
