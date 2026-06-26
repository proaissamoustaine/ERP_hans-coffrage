import type { Database } from './database.types';
export type ModeChiffrage = Database['public']['Enums']['mode_chiffrage'];

export const MODE_TO_PREFIX: Record<ModeChiffrage, string> = {
  coffrage: 'C', prefa: 'P', mannequin: 'M', sateba: 'S',
  vente: 'V', usinage: 'U', decor: 'D', autre: 'A',
};
export const prefixForMode = (mode: ModeChiffrage): string => MODE_TO_PREFIX[mode] ?? 'A';

export function generateNumeroRacine(mode: ModeChiffrage, existingNumeros: string[], date: Date = new Date()): string {
  const prefix = prefixForMode(mode);
  const yy = date.getFullYear().toString().slice(-2);
  const mm = (date.getMonth() + 1).toString().padStart(2, '0');
  const dd = date.getDate().toString().padStart(2, '0');
  const base = `${prefix}${yy}-${mm}${dd}`;
  const count = existingNumeros.filter((n) => n.startsWith(base)).length + 1;
  return `${base}-${count.toString().padStart(2, '0')}A`;
}
export function splitNumero(numero: string): { racine: string; version: string } {
  const m = numero.match(/^(.+?)([A-Z])$/);
  return m ? { racine: m[1], version: m[2] } : { racine: numero, version: 'A' };
}
export function nextVersion(racine: string, existingNumeros: string[]): string {
  const versions = existingNumeros.filter((n) => n.startsWith(racine)).map((n) => splitNumero(n).version);
  const max = versions.reduce((acc, v) => (v > acc ? v : acc), 'A');
  return racine + String.fromCharCode(max.charCodeAt(0) + 1);
}

export function nextAffaireNumero(mode: ModeChiffrage, existingNumeros: string[], date: Date = new Date()): string {
  return splitNumero(generateNumeroRacine(mode, existingNumeros, date)).racine;
}

export function decodeNumero(numero: string): {
  lettre: string;
  annee: string;
  mmjj: string;
  nn: string;
  version: string | null;
  element: string | null;
} | null {
  const m = numero.match(/^([A-Z])(\d{2})-(\d{4})-(\d{2})([A-Z]?)(?:-(\d{2}))?$/);
  if (!m) return null;
  return {
    lettre:  m[1],
    annee:   m[2],
    mmjj:    m[3],
    nn:      m[4],
    version: m[5] || null,
    element: m[6] ?? null,
  };
}
