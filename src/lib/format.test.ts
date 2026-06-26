import { describe, it, expect } from 'vitest';
import { formatDate } from './format';

describe('formatDate', () => {
  it('retourne "—" pour null', () => {
    expect(formatDate(null)).toBe('—');
  });

  it('formate une date ISO en fr-FR', () => {
    const iso = '2025-04-15';
    const expected = new Date(iso).toLocaleDateString('fr-FR');
    expect(formatDate(iso)).toBe(expected);
  });
});
