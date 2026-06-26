import { describe, it, expect } from 'vitest';
import { pieceSchema } from './pieceSchema';

describe('pieceSchema', () => {
  const VALID_MINIMAL = {
    affaire_id: 'aff-uuid-123',
    type: 'BOIS',
    nb: 2,
    pourcent_chute: 0,
  };

  it('accepte un objet minimal valide (affaire_id, type, nb, pourcent_chute)', () => {
    expect(pieceSchema.safeParse(VALID_MINIMAL).success).toBe(true);
  });

  it('accepte un objet complet avec tous les champs optionnels', () => {
    const full = {
      ...VALID_MINIMAL,
      ref1: 'R1',
      ref2: 'R2',
      designation: 'Panneau bois 20mm',
      matiere_code: 'B001',
      section_finie: '200x20',
      geometrie: 'rect',
      dimensions: { longueur: 2000, largeur: 200 },
      prix: 12.5,
      unite: 'm²',
    };
    expect(pieceSchema.safeParse(full).success).toBe(true);
  });

  it('refuse affaire_id vide', () => {
    expect(pieceSchema.safeParse({ ...VALID_MINIMAL, affaire_id: '' }).success).toBe(false);
  });

  it('refuse type vide', () => {
    expect(pieceSchema.safeParse({ ...VALID_MINIMAL, type: '' }).success).toBe(false);
  });

  it('refuse nb négatif', () => {
    expect(pieceSchema.safeParse({ ...VALID_MINIMAL, nb: -1 }).success).toBe(false);
  });

  it('accepte nb = 0 (valeur limite basse)', () => {
    expect(pieceSchema.safeParse({ ...VALID_MINIMAL, nb: 0 }).success).toBe(true);
  });

  it('refuse pourcent_chute non entier', () => {
    expect(pieceSchema.safeParse({ ...VALID_MINIMAL, pourcent_chute: 12.5 }).success).toBe(false);
  });

  it('refuse pourcent_chute négatif', () => {
    expect(pieceSchema.safeParse({ ...VALID_MINIMAL, pourcent_chute: -1 }).success).toBe(false);
  });

  it('accepte dimensions comme objet jsonb (record)', () => {
    const r = pieceSchema.safeParse({
      ...VALID_MINIMAL,
      dimensions: { longueur: 1500, largeur: 300, epaisseur: 20 },
    });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.dimensions).toMatchObject({ longueur: 1500 });
    }
  });

  it('refuse si affaire_id manquant', () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { affaire_id: _omit, ...rest } = VALID_MINIMAL;
    expect(pieceSchema.safeParse(rest).success).toBe(false);
  });
});
