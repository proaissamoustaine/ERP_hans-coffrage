// src/modules/chutes/chutesData.ts
import type { Tables } from '../../lib/database.types';

export type ChuteRow = Tables<'chutes'>;

export function surfaceM2(c: { longueur: number | null; largeur: number | null }): number {
  return ((c.longueur ?? 0) / 1000) * ((c.largeur ?? 0) / 1000);
}

export function valoriserChute(
  c: { longueur: number | null; largeur: number | null; prix_unit: number | null; unite: string | null },
): number {
  const prix = c.prix_unit ?? 0;
  const prixM2 = c.unite === '€/m²' ? prix : prix / 3.125;
  return surfaceM2(c) * prixM2;
}

export function chutesDispo<T extends { statut: string }>(rows: T[]): T[] {
  return rows.filter((c) => c.statut === 'disponible');
}

export function chutesConsommees<T extends { statut: string }>(rows: T[]): T[] {
  return rows.filter((c) => c.statut === 'consommee' || c.statut === 'reutilisee_partiel');
}

export function catsPresentes<T extends { cat: string | null }>(rows: T[]): string[] {
  return [...new Set(rows.map((c) => c.cat).filter((x): x is string => !!x))];
}

export function valeurTotale(
  rows: { longueur: number | null; largeur: number | null; prix_unit: number | null; unite: string | null }[],
): number {
  return rows.reduce((s, c) => s + valoriserChute(c), 0);
}
