import { describe, it, expect } from 'vitest';
import { affaireSchema } from './affaireSchema';

const VALID = {
  mode: 'coffrage' as const,
  client_id: 'c1',
  chantier: 'CHANTIER A',
  objet: 'Fabrication coffrages',
  total_ht: 38500,
  date_livraison: '2026-12-01',
};

describe('affaireSchema', () => {
  it('accepte un objet valide', () => {
    expect(affaireSchema.safeParse(VALID).success).toBe(true);
  });

  it('refuse un client_id vide', () => {
    expect(affaireSchema.safeParse({ ...VALID, client_id: '' }).success).toBe(false);
  });

  it('refuse un mode invalide', () => {
    expect(affaireSchema.safeParse({ ...VALID, mode: 'inconnu' }).success).toBe(false);
  });

  it('refuse un total_ht négatif', () => {
    expect(affaireSchema.safeParse({ ...VALID, total_ht: -1 }).success).toBe(false);
  });

  it('accepte total_ht = 0 (valeur min)', () => {
    const result = affaireSchema.safeParse({ ...VALID, total_ht: 0 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.total_ht).toBe(0);
    }
  });

  it('accepte des champs optionnels absents', () => {
    expect(affaireSchema.safeParse({ mode: 'prefa', client_id: 'c2', total_ht: 0 }).success).toBe(true);
  });
});
