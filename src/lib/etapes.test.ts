import { describe, it, expect } from 'vitest';
import { ETAPES, initialEtapes, calcAvancement, avancementPondere, prochaineEtape } from './etapes';

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

describe('ETAPES poids', () => {
  it('tous les éléments ont un champ poids', () => {
    expect(ETAPES.every((e) => typeof e.poids === 'number')).toBe(true);
  });
  it('la somme des poids est 100', () => {
    const total = ETAPES.reduce((acc, e) => acc + e.poids, 0);
    expect(total).toBe(100);
  });
  it('montage a poids 30', () => {
    const montage = ETAPES.find((e) => e.cle === 'montage');
    expect(montage?.poids).toBe(30);
  });
});

describe('avancementPondere', () => {
  it('retourne 0 si aucune étape faite', () => {
    expect(avancementPondere([])).toBe(0);
  });
  it('retourne 100 si toutes les étapes sont faites', () => {
    const all = ETAPES.map((e) => ({ etape: e.cle, fait: true }));
    expect(avancementPondere(all)).toBe(100);
  });
  it('retourne 50 pour montage + debit faits', () => {
    const etapes = [
      { etape: 'montage' as const, fait: true },
      { etape: 'debit' as const, fait: true },
    ];
    expect(avancementPondere(etapes)).toBe(50);
  });
  it('ignore les étapes inconnues', () => {
    const etapes = [{ etape: 'etape_inconnue' as never, fait: true }];
    expect(avancementPondere(etapes)).toBe(0);
  });
});

describe('prochaineEtape', () => {
  it('retourne devis_accepte si tableau vide', () => {
    const result = prochaineEtape([]);
    expect(result?.cle).toBe('devis_accepte');
  });
  it('retourne null si toutes les étapes sont faites', () => {
    const all = ETAPES.map((e) => ({ etape: e.cle, fait: true }));
    expect(prochaineEtape(all)).toBeNull();
  });
  it('retourne saisie_pieces si seul devis_accepte est fait', () => {
    const etapes = [{ etape: 'devis_accepte' as const, fait: true }];
    const result = prochaineEtape(etapes);
    expect(result?.cle).toBe('saisie_pieces');
  });
});
