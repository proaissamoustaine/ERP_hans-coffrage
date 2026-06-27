// src/modules/flashage/useAffairesFlashables.ts
import { useQuery } from '@tanstack/react-query';
import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';

export async function fetchAffairesFlashables(sb: SupabaseClient) {
  const { data, error } = await sb
    .from('affaires')
    .select('*, clients(nom), etapes_affaire!inner(etape, fait)')
    .eq('etapes_affaire.etape', 'saisie_pieces')
    .eq('etapes_affaire.fait', true)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export function useAffairesFlashables() {
  return useQuery({
    queryKey: ['affaires_flashables'],
    queryFn: () => fetchAffairesFlashables(supabase),
  });
}
