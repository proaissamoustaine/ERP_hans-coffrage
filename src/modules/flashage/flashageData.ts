// src/modules/flashage/flashageData.ts
import type { Database } from '../../lib/database.types';

export type TacheRow = Database['public']['Tables']['taches_codes']['Row'];
export type EtapeCle = Database['public']['Enums']['etape_cle'];

/** Ordre métier des groupes de tâches (fidèle maquette TACHES_CODES).
 *  Les 3 premiers alimentent la sélection rapide de la tablette (slice(0,3)). */
export const ORDRE_GROUPES = [
  'Coffrages & Autres (facturable)',
  'SOTRADEST / SATEBA (facturable)',
  'Dessin BE (facturable)',
  'Non facturable',
  'Investissement (NF)',
  'Absences (NF)',
] as const;

export function fmtChrono(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return [h, m, s].map((n) => n.toString().padStart(2, '0')).join(':');
}

export function fmtDuree(min: number): string {
  return `${Math.floor(min / 60)}h ${(min % 60).toString().padStart(2, '0')}`;
}

export function totalMinutes<T extends { duree_min: number }>(
  flashs: T[],
  predicate: (f: T) => boolean,
): number {
  return flashs.filter(predicate).reduce((acc, f) => acc + (f.duree_min ?? 0), 0);
}

export function estAujourdhui(dateISO: string, ref: Date = new Date()): boolean {
  const d = new Date(dateISO);
  return (
    d.getFullYear() === ref.getFullYear() &&
    d.getMonth() === ref.getMonth() &&
    d.getDate() === ref.getDate()
  );
}

/** Début de semaine ISO (lundi 00:00) pour une date donnée. */
function lundiDeLaSemaine(ref: Date): Date {
  const d = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate());
  const jour = (d.getDay() + 6) % 7; // lundi=0 … dimanche=6
  d.setDate(d.getDate() - jour);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function estCetteSemaine(dateISO: string, ref: Date = new Date()): boolean {
  const lundi = lundiDeLaSemaine(ref);
  const dimancheSoir = new Date(lundi);
  dimancheSoir.setDate(lundi.getDate() + 7);
  const d = new Date(dateISO);
  return d >= lundi && d < dimancheSoir;
}

export type GroupeTaches = { groupe: string; codes: TacheRow[] };

export function groupTaches(rows: TacheRow[]): GroupeTaches[] {
  const parGroupe = new Map<string, TacheRow[]>();
  for (const r of rows) {
    const g = r.groupe ?? '—';
    if (!parGroupe.has(g)) parGroupe.set(g, []);
    parGroupe.get(g)!.push(r);
  }
  const ordon = (g: string) => {
    const i = (ORDRE_GROUPES as readonly string[]).indexOf(g);
    return i === -1 ? ORDRE_GROUPES.length : i;
  };
  return [...parGroupe.entries()]
    .map(([groupe, codes]) => ({ groupe, codes }))
    .sort((a, b) => ordon(a.groupe) - ordon(b.groupe));
}

export function estFlashable(etapes: { etape: EtapeCle; fait: boolean }[]): boolean {
  return etapes.some((e) => e.etape === 'saisie_pieces' && e.fait);
}

export function dureeMinDepuis(startMs: number, nowMs: number): number {
  return Math.max(1, Math.round((nowMs - startMs) / 60000));
}
