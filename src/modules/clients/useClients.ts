import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';
import type { ClientInput } from './clientSchema';

export async function fetchClients(sb: SupabaseClient) {
  const { data, error } = await sb.from('clients').select('*').order('nom');
  if (error) throw new Error(error.message);
  return data ?? [];
}

export const useClients = () =>
  useQuery({ queryKey: ['clients'], queryFn: () => fetchClients(supabase) });

export function useCreateClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: ClientInput) => {
      const { data, error } = await supabase
        .from('clients')
        .insert(input)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clients'] }),
  });
}
