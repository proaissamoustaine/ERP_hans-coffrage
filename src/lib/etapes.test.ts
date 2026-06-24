import { describe, it, expect } from 'vitest';
import { ETAPES, initialEtapes, calcAvancement } from './etapes';

describe('ETAPES', () => {
  it('contient 11 étapes', () => {
    expect(ETAPES).toHaveLength(11);
  });
  it('commence par devis_accepte', () => {
    expect(ETAPES[0].cle).toBe('devis_accepte');
  });
  it('se termine par paiement', () => {
    expect(ETAPES[10].cle).toBe('paiement');
  });
});

describe('initialEtapes', () => {
  it('retourne 11 lignes', () => {
    expect(initialEtapes('x')).toHaveLength(11);
  });
  it('seule devis_accepte a fait===true', () => {
    const rows = initialEtapes('x');
    const faits = rows.filter((r) => r.fait);
    expect(faits).toHaveLength(1);
    expect(faits[0].etape).toBe('devis_accepte');
  });
  it('devis_accepte a une date non-nulle', () => {
    const rows = initialEtapes('x');
    const row = rows.find((r) => r.etape === 'devis_accepte');
    expect(row?.date).not.toBeNull();
  });
  it('les autres ont fait===false et date===null', () => {
    const rows = initialEtapes('x');
    const others = rows.filter((r) => r.etape !== 'devis_accepte');
    expect(others.every((r) => r.fait === false && r.date === null)).toBe(true);
  });
  it('affecte l\'affaireId passé', () => {
    const rows = initialEtapes('abc-123');
    expect(rows.every((r) => r.affaire_id === 'abc-123')).toBe(true);
  });
});

describe('calcAvancement', () => {
  it('retourne 0 pour un tableau vide', () => {
    expect(calcAvancement([])).toBe(0);
  });
  it('retourne 100 si toutes les étapes sont faites (11/11)', () => {
    const all = Array.from({ length: 11 }, () => ({ fait: true }));
    expect(calcAvancement(all)).toBe(100);
  });
  it('retourne 27 pour 3 étapes sur 11', () => {
    const etapes = [
      { fait: true },
      { fait: true },
      { fait: true },
      ...Array.from({ length: 8 }, () => ({ fait: false })),
    ];
    expect(calcAvancement(etapes)).toBe(27);
  });
});
