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

export type DeclarerChuteInput = {
  id: string; // uuid client → idempotence
  matiere_code: string;
  designation: string;
  cat: string;
  longueur: number;
  largeur: number;
  epaisseur: number;
  prix_unit: number;
  unite: string | null;
  affaire_origine: string | null;
  operateur_id: string;
};

export type ReutiliserChuteVars = {
  id: string; // chute source
  affaireConsoId: string | null;
  mode: 'totale' | 'partielle';
  resteJete: boolean;
  reste?: { id: string; longueur: number; largeur: number };
  source?: {
    matiere_code: string;
    designation: string;
    cat: string;
    epaisseur: number;
    prix_unit: number;
    unite: string | null;
    affaire_origine: string | null;
    operateur_id: string;
  };
};

export async function insertChute(sb: SupabaseClient, input: DeclarerChuteInput): Promise<void> {
  const { error } = await sb
    .from('chutes')
    .upsert({ ...input, statut: 'disponible' as const }, { onConflict: 'id', ignoreDuplicates: true });
  if (error) throw new Error(error.message);
}

export async function reutiliserChuteDb(sb: SupabaseClient, vars: ReutiliserChuteVars): Promise<void> {
  const statut = (vars.mode === 'totale' ? 'consommee' : 'reutilisee_partiel') as 'consommee' | 'reutilisee_partiel';
  const { error } = await sb
    .from('chutes')
    .update({
      statut,
      affaire_consommation: vars.affaireConsoId,
      mode_reutilisation: vars.mode,
      reste_jete: vars.resteJete,
      date_consommation: new Date().toISOString(),
    })
    .eq('id', vars.id);
  if (error) throw new Error(error.message);
  if (vars.reste && vars.source) {
    const { error: e2 } = await sb.from('chutes').upsert(
      {
        id: vars.reste.id,
        matiere_code: vars.source.matiere_code,
        designation: vars.source.designation,
        cat: vars.source.cat,
        longueur: vars.reste.longueur,
        largeur: vars.reste.largeur,
        epaisseur: vars.source.epaisseur,
        prix_unit: vars.source.prix_unit,
        unite: vars.source.unite,
        affaire_origine: vars.source.affaire_origine,
        operateur_id: vars.source.operateur_id,
        issu_de: vars.id,
        statut: 'disponible' as const,
      },
      { onConflict: 'id', ignoreDuplicates: true },
    );
    if (e2) throw new Error(e2.message);
  }
}

export type CreerColisInput = {
  id: string; // uuid client → idempotence
  affaire_id: string;
  numero: number;
  longueur: number;
  largeur: number;
  hauteur: number;
  poids: number;
};

export type PeserColisVars = {
  id: string;
  affaireId?: string;
  poids: number;
  longueur?: number;
  largeur?: number;
  hauteur?: number;
};

export async function insertColis(sb: SupabaseClient, input: CreerColisInput): Promise<void> {
  const { error } = await sb.from('colis').upsert(input, { onConflict: 'id', ignoreDuplicates: true });
  if (error) throw new Error(error.message);
  // Déclenche l'étape colisage (existe toujours — semée à la création de l'affaire).
  const { error: e2 } = await sb
    .from('etapes_affaire')
    .update({ fait: true, date: new Date().toISOString() })
    .eq('affaire_id', input.affaire_id)
    .eq('etape', 'colisage');
  if (e2) throw new Error(e2.message);
}

export async function peserColis(sb: SupabaseClient, vars: PeserColisVars): Promise<void> {
  const patch: Record<string, number> = { poids: vars.poids };
  if (vars.longueur != null) patch.longueur = vars.longueur;
  if (vars.largeur != null) patch.largeur = vars.largeur;
  if (vars.hauteur != null) patch.hauteur = vars.hauteur;
  const { error } = await sb.from('colis').update(patch).eq('id', vars.id);
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
  qc.setMutationDefaults(['declarer-chute'], {
    mutationFn: (input: DeclarerChuteInput) => insertChute(supabase, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['chutes'] }),
  });
  qc.setMutationDefaults(['reutiliser-chute'], {
    mutationFn: (vars: ReutiliserChuteVars) => reutiliserChuteDb(supabase, vars),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['chutes'] }),
  });
  qc.setMutationDefaults(['creer-colis'], {
    mutationFn: (input: CreerColisInput) => insertColis(supabase, input),
    onSuccess: (_d, input) => {
      const i = input as CreerColisInput;
      qc.invalidateQueries({ queryKey: ['colis'] });
      qc.invalidateQueries({ queryKey: ['etapes', i.affaire_id] });
      qc.invalidateQueries({ queryKey: ['affaires'] });
    },
  });
  qc.setMutationDefaults(['peser-colis'], {
    mutationFn: (vars: PeserColisVars) => peserColis(supabase, vars),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['colis'] }),
  });
}
