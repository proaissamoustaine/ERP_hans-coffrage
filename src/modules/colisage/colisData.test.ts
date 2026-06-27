// src/modules/colisage/colisData.test.ts
import { describe, it, expect } from 'vitest';
import { nextNumeroColis, totalPoids, colisDuJour, groupByAffaire, fmtTonnes } from './colisData';

describe('nextNumeroColis', () => {
  it('1 si aucun colis, sinon max+1', () => {
    expect(nextNumeroColis([])).toBe(1);
    expect(nextNumeroColis([{ numero: 1 }, { numero: 3 }, { numero: 2 }])).toBe(4);
    expect(nextNumeroColis([{ numero: null }])).toBe(1);
  });
});

describe('totalPoids', () => {
  it('somme les poids (null = 0)', () => {
    expect(totalPoids([{ poids: 430 }, { poids: 1840 }, { poids: null }])).toBe(2270);
    expect(totalPoids([])).toBe(0);
  });
});

describe('colisDuJour', () => {
  const ref = new Date('2026-06-27T15:00:00Z');
  it('garde les colis du même jour que ref', () => {
    const rows = [
      { id: 'a', date: '2026-06-27T08:00:00Z' },
      { id: 'b', date: '2026-06-26T08:00:00Z' },
    ];
    expect(colisDuJour(rows, ref).map((r) => r.id)).toEqual(['a']);
  });
});

describe('groupByAffaire', () => {
  it('groupe par affaire_id', () => {
    const rows = [
      { affaire_id: 'x', numero: 1 },
      { affaire_id: 'x', numero: 2 },
      { affaire_id: 'y', numero: 1 },
    ];
    const g = groupByAffaire(rows);
    expect(g).toHaveLength(2);
    expect(g.find((x) => x.affaireId === 'x')?.colis).toHaveLength(2);
  });
});

describe('fmtTonnes', () => {
  it('kg → tonnes à 3 décimales', () => {
    expect(fmtTonnes(860)).toBe('0.860');
    expect(fmtTonnes(1840)).toBe('1.840');
  });
});
