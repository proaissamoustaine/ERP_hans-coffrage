// src/modules/colisage/colisData.ts
import type { Tables } from '../../lib/database.types';

export type ColisRow = Tables<'colis'>;

export function nextNumeroColis(colisAffaire: { numero: number | null }[]): number {
  return colisAffaire.reduce((m, c) => Math.max(m, c.numero ?? 0), 0) + 1;
}

export function totalPoids(rows: { poids: number | null }[]): number {
  return rows.reduce((s, c) => s + (c.poids ?? 0), 0);
}

function memeJour(dateISO: string, ref: Date): boolean {
  const d = new Date(dateISO);
  return (
    d.getFullYear() === ref.getFullYear() &&
    d.getMonth() === ref.getMonth() &&
    d.getDate() === ref.getDate()
  );
}

export function colisDuJour<T extends { date: string }>(rows: T[], ref: Date = new Date()): T[] {
  return rows.filter((r) => memeJour(r.date, ref));
}

export function groupByAffaire<T extends { affaire_id: string }>(
  rows: T[],
): { affaireId: string; colis: T[] }[] {
  const map = new Map<string, T[]>();
  for (const r of rows) {
    if (!map.has(r.affaire_id)) map.set(r.affaire_id, []);
    map.get(r.affaire_id)!.push(r);
  }
  return [...map.entries()].map(([affaireId, colis]) => ({ affaireId, colis }));
}

export function fmtTonnes(kg: number): string {
  return (kg / 1000).toFixed(3);
}
