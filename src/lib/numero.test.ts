import { describe, it, expect } from 'vitest';
import { prefixForMode, generateNumeroRacine, splitNumero, nextVersion } from './numero';
const D = new Date('2025-10-20T09:00:00Z');
describe('numero racine', () => {
  it('préfixe par mode', () => {
    expect(prefixForMode('coffrage')).toBe('C');
    expect(prefixForMode('sateba')).toBe('S');
    expect(prefixForMode('autre')).toBe('A');
  });
  it('génère prefix+YY-MMJJ-NN + version A, NN = compteur du jour', () => {
    expect(generateNumeroRacine('coffrage', [], D)).toBe('C25-1020-01A');
    expect(generateNumeroRacine('coffrage', ['C25-1020-01A'], D)).toBe('C25-1020-02A');
    expect(generateNumeroRacine('coffrage', ['P25-1020-01A', 'C25-1019-09A'], D)).toBe('C25-1020-01A');
  });
  it('splitNumero sépare racine et version', () => {
    expect(splitNumero('C25-1020-03A')).toEqual({ racine: 'C25-1020-03', version: 'A' });
  });
  it('nextVersion = max + 1 sur la racine', () => {
    expect(nextVersion('C25-1020-03', ['C25-1020-03A'])).toBe('C25-1020-03B');
    expect(nextVersion('C25-1020-03', ['C25-1020-03A', 'C25-1020-03B'])).toBe('C25-1020-03C');
  });
});
