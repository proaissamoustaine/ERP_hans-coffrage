import { describe, it, expect } from 'vitest';
import { categories, famillesFor, matieresFor, pieceTotal } from './catalogue';
import type { MatiereLite } from './catalogue';

// Petit dataset de test couvrant la cascade cat → famille → ref/code
const ITEMS: MatiereLite[] = [
  { cat: 'BOIS', famille: 'Panneau', ref: 'PLY', code: 'B001' },
  { cat: 'BOIS', famille: 'Panneau', ref: 'OSB', code: 'B002' },
  { cat: 'BOIS', famille: 'Madrier', ref: 'SAP', code: 'B003' },
  { cat: 'ACIER', famille: 'Tube', ref: 'RND', code: 'A001' },
  { cat: 'ACIER', famille: 'Tube', ref: 'CAR', code: 'A002' },
  { cat: 'ACIER', famille: null, ref: 'PLT', code: 'A003' },
  { cat: 'VISSERIE', famille: 'Boulon', ref: 'M10', code: 'V001' },
];

describe('categories', () => {
  it('retourne les catégories distinctes triées', () => {
    expect(categories(ITEMS)).toEqual(['ACIER', 'BOIS', 'VISSERIE']);
  });

  it('retourne [] si liste vide', () => {
    expect(categories([])).toEqual([]);
  });

  it('déduplique les catégories', () => {
    const items: MatiereLite[] = [
      { cat: 'BOIS', code: 'B1' },
      { cat: 'BOIS', code: 'B2' },
      { cat: 'ACIER', code: 'A1' },
    ];
    expect(categories(items)).toEqual(['ACIER', 'BOIS']);
  });
});

describe('famillesFor', () => {
  it('retourne les familles distinctes d\'une cat, triées', () => {
    expect(famillesFor(ITEMS, 'BOIS')).toEqual(['Madrier', 'Panneau']);
  });

  it('exclut les familles nulles ou vides', () => {
    // ACIER a un item avec famille null (A003)
    expect(famillesFor(ITEMS, 'ACIER')).toEqual(['Tube']);
  });

  it('retourne [] si aucune famille pour cette cat', () => {
    expect(famillesFor(ITEMS, 'INCONNU')).toEqual([]);
  });

  it('déduplique les familles', () => {
    // BOIS/Panneau est présent 2 fois
    expect(famillesFor(ITEMS, 'BOIS')).not.toContainEqual('Panneau'.repeat(2));
    expect(famillesFor(ITEMS, 'BOIS').filter(f => f === 'Panneau')).toHaveLength(1);
  });
});

describe('matieresFor', () => {
  it('filtre par cat + famille, trie par ref puis code', () => {
    const result = matieresFor(ITEMS, 'BOIS', 'Panneau');
    expect(result).toHaveLength(2);
    expect(result[0].ref).toBe('OSB');
    expect(result[1].ref).toBe('PLY');
  });

  it('trie par code quand ref est identique', () => {
    const items: MatiereLite[] = [
      { cat: 'X', famille: 'Y', ref: 'Z', code: 'Z002' },
      { cat: 'X', famille: 'Y', ref: 'Z', code: 'Z001' },
    ];
    const result = matieresFor(items, 'X', 'Y');
    expect(result[0].code).toBe('Z001');
    expect(result[1].code).toBe('Z002');
  });

  it('retourne [] si cat ou famille ne correspond pas', () => {
    expect(matieresFor(ITEMS, 'BOIS', 'Inconnu')).toEqual([]);
    expect(matieresFor(ITEMS, 'Inconnu', 'Panneau')).toEqual([]);
  });
});

describe('pieceTotal', () => {
  it('MO : prix × nb', () => {
    expect(pieceTotal({ type: 'Main_Oeuvre', prix: 50, nb: 3, pourcent_chute: 0 })).toBeCloseTo(150);
  });

  it('MO : ignore le pourcent_chute', () => {
    expect(pieceTotal({ type: 'Main_Oeuvre', prix: 50, nb: 3, pourcent_chute: 20 })).toBeCloseTo(150);
  });

  it('matière chute 0 : prix × nb (coef = 1)', () => {
    expect(pieceTotal({ type: 'BOIS', prix: 10, nb: 5, pourcent_chute: 0 })).toBeCloseTo(50);
  });

  it('matière chute 12% : prix × nb / 0.88', () => {
    const expected = 10 * 5 / 0.88;
    expect(pieceTotal({ type: 'BOIS', prix: 10, nb: 5, pourcent_chute: 12 })).toBeCloseTo(expected, 5);
  });

  it('matière chute >= 100 : coef forcé à 1 (sécurité division par zéro)', () => {
    expect(pieceTotal({ type: 'BOIS', prix: 10, nb: 5, pourcent_chute: 100 })).toBeCloseTo(50);
    expect(pieceTotal({ type: 'BOIS', prix: 10, nb: 5, pourcent_chute: 120 })).toBeCloseTo(50);
  });

  it('valeurs nulles/undefined → traités comme 0', () => {
    expect(pieceTotal({ type: 'Main_Oeuvre', prix: null, nb: null, pourcent_chute: null })).toBe(0);
    expect(pieceTotal({ type: 'BOIS', prix: undefined, nb: undefined, pourcent_chute: undefined })).toBe(0);
  });
});
