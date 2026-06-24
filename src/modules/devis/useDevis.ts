import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';
import type { Database } from '../../lib/database.types';
import { generateNumeroRacine, splitNumero, nextVersion } from '../../lib/numero';
import type { DevisInput } from './devisSchema';

export async function fetchDevis(sb: SupabaseClient) {
  const { data, error } = await sb
    .from('devis')
    .select('*, clients(nom)')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export const useDevis = () =>
  useQuery({ queryKey: ['devis'], queryFn: () => fetchDevis(supabase) });

export function useCreateDevis() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: DevisInput) => {
      const { data: ex } = await supabase.from('devis').select('numero');
      const numero = generateNumeroRacine(
        input.mode,
        (ex ?? []).map((d) => d.numero),
        new Date(),
      );
      const { racine } = splitNumero(numero);
      const { data, error } = await supabase
        .from('devis')
        .insert({
          numero,
          numero_racine: racine,
          version: 'A',
          mode: input.mode,
          client_id: input.client_id || null,
          chantier: input.chantier || null,
          objet: input.objet || null,
          total_ht: input.total_ht,
          frais_transport: input.frais_transport ?? 0,
          statut: 'brouillon',
        })
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['devis'] }),
  });
}

export function useUpdateDevisStatut() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      statut,
    }: {
      id: string;
      statut: Database['public']['Enums']['devis_statut'];
    }) => {
      const { error } = await supabase
        .from('devis')
        .update({ statut })
        .eq('id', id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['devis'] }),
  });
}

export function useRevisionDevis() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (source: {
      id?: string;
      numero: string;
      mode: Database['public']['Enums']['mode_chiffrage'];
      client_id?: string | null;
      chantier?: string | null;
      objet?: string | null;
      total_ht: number;
      frais_transport?: number;
    }) => {
      const { data: ex } = await supabase.from('devis').select('numero');
      const existingNumeros = (ex ?? []).map((d) => d.numero);
      const { racine } = splitNumero(source.numero);
      const numero = nextVersion(racine, existingNumeros);
      const { version } = splitNumero(numero);
      const { data, error } = await supabase
        .from('devis')
        .insert({
          numero,
          numero_racine: racine,
          version,
          mode: source.mode,
          client_id: source.client_id ?? null,
          chantier: source.chantier ?? null,
          objet: source.objet ?? null,
          total_ht: source.total_ht,
          frais_transport: source.frais_transport ?? 0,
          statut: 'brouillon',
          parent_devis_id: source.id ?? null,
        })
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['devis'] }),
  });
}
