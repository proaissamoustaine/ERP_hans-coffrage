import type { Database } from './database.types';
export type EtapeCle = Database['public']['Enums']['etape_cle'];

export const ETAPES: { cle: EtapeCle; label: string }[] = [
  { cle: 'devis_accepte', label: 'Devis accepté' },
  { cle: 'saisie_pieces', label: 'Saisie des pièces' },
  { cle: 'pr_valide', label: 'PR validé' },
  { cle: 'dessin_be', label: 'Dessin BE' },
  { cle: 'debit', label: 'Débit' },
  { cle: 'montage', label: 'Montage' },
  { cle: 'finition', label: 'Finition' },
  { cle: 'colisage', label: 'Colisage' },
  { cle: 'livraison', label: 'Livraison' },
  { cle: 'facturation', label: 'Facturation' },
  { cle: 'paiement', label: 'Paiement' },
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
