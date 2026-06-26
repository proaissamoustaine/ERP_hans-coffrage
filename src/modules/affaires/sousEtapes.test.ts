import { describe, it, expect } from 'vitest';
import { sousEtapesPonderees } from './sousEtapes';

describe('sousEtapesPonderees', () => {
  it('retourne une liste de 10 éléments', () => {
    expect(sousEtapesPonderees(0)).toHaveLength(10);
  });

  it('tous val===0 pour avancement=0', () => {
    const result = sousEtapesPonderees(0);
    expect(result.every((s) => s.val === 0)).toBe(true);
  });

  it('tous val===100 pour avancement=100', () => {
    const result = sousEtapesPonderees(100);
    expect(result.every((s) => s.val === 100)).toBe(true);
  });

  it('avancement=40 → deb_d.val===100, deb_f.val===0, mont.val===0', () => {
    const result = sousEtapesPonderees(40);
    const deb_d = result.find((s) => s.key === 'deb_d');
    const deb_f = result.find((s) => s.key === 'deb_f');
    const mont = result.find((s) => s.key === 'mont');
    expect(deb_d?.val).toBe(100);
    expect(deb_f?.val).toBe(0);
    expect(mont?.val).toBe(0);
  });

  it('chaque élément a les propriétés key, group, sub, weight, val', () => {
    const result = sousEtapesPonderees(50);
    for (const item of result) {
      expect(typeof item.key).toBe('string');
      expect(typeof item.group).toBe('string');
      expect(typeof item.sub).toBe('string');
      expect(typeof item.weight).toBe('number');
      expect(typeof item.val).toBe('number');
    }
  });
});
