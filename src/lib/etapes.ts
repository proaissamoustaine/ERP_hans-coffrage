import type { Database } from './database.types';
export type EtapeCle = Database['public']['Enums']['etape_cle'];

export const ETAPES: { cle: EtapeCle; label: string; poids: number }[] = [
  { cle: 'devis_accepte', label: 'Devis accepté',      poids: 0  },
  { cle: 'saisie_pieces', label: 'Saisie pièces',      poids: 5  },
  { cle: 'pr_valide',     label: 'PR initial validé',  poids: 0  },
  { cle: 'dessin_be',     label: 'Dessin BE',           poids: 15 },
  { cle: 'debit',         label: 'Débit',               poids: 20 },
  { cle: 'montage',       label: 'Montage atelier',     poids: 30 },
  { cle: 'finition',      label: 'Finition + contrôle', poids: 10 },
  { cle: 'colisage',      label: 'Colisage + pesée',    poids: 5  },
  { cle: 'livraison',     label: 'Livré',               poids: 10 },
  { cle: 'facturation',   label: 'Facturé',             poids: 0  },
  { cle: 'paiement',      label: 'Payé / Soldé',        poids: 5  },
];

export function initialEtapes(affaireId: string) {
  const today = new Date().toISOString();
  return ETAPES.map((e) => ({
    affaire_id: affaireId,
    etape: e.cle,
    fait: e.cle === 'devis_accepte',
    date: e.cle === 'devis_accepte' ? today : null,
  }));
}

export function calcAvancement(etapes: { fait: boolean }[]): number {
  if (etapes.length === 0) return 0;
  const faits = etapes.filter((e) => e.fait).length;
  return Math.round((faits / etapes.length) * 100);
}

export function avancementPondere(etapes: { etape: EtapeCle; fait: boolean }[]): number {
  return etapes.reduce((acc, row) => {
    if (!row.fait) return acc;
    const def = ETAPES.find((e) => e.cle === row.etape);
    return acc + (def?.poids ?? 0);
  }, 0);
}

export function prochaineEtape(
  etapes: { etape: EtapeCle; fait: boolean }[],
): { cle: EtapeCle; label: string; poids: number } | null {
  for (const def of ETAPES) {
    const row = etapes.find((e) => e.etape === def.cle);
    if (!row || !row.fait) return def;
  }
  return null;
}
