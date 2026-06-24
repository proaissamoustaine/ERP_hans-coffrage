import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import type { Database } from '../../lib/database.types';
import { splitNumero } from '../../lib/numero';
import { initialEtapes } from '../../lib/etapes';

type AccepterDevisInput = {
  id: string;
  numero: string;
  mode: Database['public']['Enums']['mode_chiffrage'];
  client_id: string | null;
  chantier: string | null;
  objet: string | null;
  total_ht: number;
};

export function useAccepterDevis() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (devis: AccepterDevisInput) => {
      // Step 1: mark devis as accepte
      const { error: errDevis } = await supabase
        .from('devis')
        .update({ statut: 'accepte' })
        .eq('id', devis.id);
      if (errDevis) throw new Error(errDevis.message);

      // Step 2: extract racine from numero
      const { racine } = splitNumero(devis.numero);

      // Step 3: check if affaire already exists
      const { data: existing } = await supabase
        .from('affaires')
        .select('id')
        .eq('numero', racine)
        .maybeSingle();
      if (existing) return existing;

      // Step 4: insert affaire
      const { data: affaire, error: errAffaire } = await supabase
        .from('affaires')
        .insert({
          numero: racine,
          mode: devis.mode,
          client_id: devis.client_id,
          devis_id: devis.id,
          chantier: devis.chantier,
          objet: devis.objet,
          total_ht: devis.total_ht,
          statut: 'En cours',
          avancement: 9,
          date_acceptation: new Date().toISOString().slice(0, 10),
        })
        .select()
        .single();
      if (errAffaire) throw new Error(errAffaire.message);

      // Step 5: seed étapes
      const { error: errEtapes } = await supabase
        .from('etapes_affaire')
        .insert(initialEtapes(affaire.id));
      if (errEtapes) throw new Error(errEtapes.message);

      return affaire;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['devis'] });
      qc.invalidateQueries({ queryKey: ['affaires'] });
    },
  });
}
