// src/lib/offlineMutations.ts
import type { QueryClient } from '@tanstack/react-query';
import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from './supabase';

export type FlashInput = {
  id: string; // uuid généré côté client → idempotence au rejeu
  affaire_id: string;
  code_tache: string;
  operateur_id: string;
  operateur_nom: string;
  duree_min: number;
  date: string;
};

export type PieceFaitVars = {
  id: string;
  fait: boolean;
  faitPar: string | null;
  affaireId?: string; // pour invalider ['pieces', affaireId]
};

export async function upsertFlash(sb: SupabaseClient, input: FlashInput): Promise<void> {
  const { error } = await sb
    .from('heures_flashees')
    .upsert(input, { onConflict: 'id', ignoreDuplicates: true });
  if (error) throw new Error(error.message);
}

export async function updatePieceFait(sb: SupabaseClient, vars: PieceFaitVars): Promise<void> {
  const { error } = await sb
    .from('pieces')
    .update({
      fait: vars.fait,
      fait_par: vars.fait ? vars.faitPar : null,
      fait_date: vars.fait ? new Date().toISOString() : null,
    })
    .eq('id', vars.id);
  if (error) throw new Error(error.message);
}

/**
 * Enregistre les mutationFn par défaut au démarrage. Indispensable pour que les
 * mutations persistées (mises en file hors-ligne) retrouvent leur fonction après un reload.
 */
export function registerOfflineMutationDefaults(qc: QueryClient): void {
  qc.setMutationDefaults(['flasher-heures'], {
    mutationFn: (input: FlashInput) => upsertFlash(supabase, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['heures_flashees'] });
    },
  });
  qc.setMutationDefaults(['cocher-piece'], {
    mutationFn: (vars: PieceFaitVars) => updatePieceFait(supabase, vars),
    onSuccess: (_data, vars) => {
      const v = vars as PieceFaitVars;
      if (v.affaireId) qc.invalidateQueries({ queryKey: ['pieces', v.affaireId] });
    },
  });
}
