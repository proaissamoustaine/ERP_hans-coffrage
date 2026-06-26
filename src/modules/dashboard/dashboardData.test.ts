import { describe, it, expect } from 'vitest';
import {
  affairesPrioritaires,
  countAffairesEnCours,
  caEnCours,
  formatK,
  isoWeek,
} from './dashboardData';

// ─── Type local ────────────────────────────────────────────────────────────────
type AffaireLite = {
  statut?: string | null;
  total_ht?: number | null;
  date_livraison?: string | null;
};

// ─── affairesPrioritaires ──────────────────────────────────────────────────────
describe('affairesPrioritaires', () => {
  it('trie par date_livraison ascendant (la plus proche en premier)', () => {
    const affaires: AffaireLite[] = [
      { date_livraison: '2026-08-15' },
      { date_livraison: '2026-07-01' },
      { date_livraison: '2026-09-30' },
    ];
    const result = affairesPrioritaires(affaires);
    expect(result[0].date_livraison).toBe('2026-07-01');
    expect(result[1].date_livraison).toBe('2026-08-15');
    expect(result[2].date_livraison).toBe('2026-09-30');
  });

  it('place les valeurs null en dernier', () => {
    const affaires: AffaireLite[] = [
      { date_livraison: null },
      { date_livraison: '2026-07-01' },
      { date_livraison: null },
      { date_livraison: '2026-08-15' },
    ];
    const result = affairesPrioritaires(affaires);
    expect(result[0].date_livraison).toBe('2026-07-01');
    expect(result[1].date_livraison).toBe('2026-08-15');
    expect(result[2].date_livraison).toBeNull();
    expect(result[3].date_livraison).toBeNull();
  });

  it('place les valeurs vides en dernier', () => {
    const affaires: AffaireLite[] = [
      { date_livraison: '' },
      { date_livraison: '2026-07-01' },
    ];
    const result = affairesPrioritaires(affaires);
    expect(result[0].date_livraison).toBe('2026-07-01');
    expect(result[1].date_livraison).toBe('');
  });

  it('respecte la limite (limit = 5 par défaut)', () => {
    const affaires: AffaireLite[] = Array.from({ length: 8 }, (_, i) => ({
      date_livraison: `2026-0${i + 1}-01`,
    }));
    const result = affairesPrioritaires(affaires);
    expect(result).toHaveLength(5);
  });

  it('respecte un limit personnalisé', () => {
    const affaires: AffaireLite[] = [
      { date_livraison: '2026-07-01' },
      { date_livraison: '2026-08-01' },
      { date_livraison: '2026-09-01' },
    ];
    const result = affairesPrioritaires(affaires, 2);
    expect(result).toHaveLength(2);
  });

  it("ne mute pas l'entrée originale", () => {
    const affaires: AffaireLite[] = [
      { date_livraison: '2026-09-01' },
      { date_livraison: '2026-07-01' },
    ];
    const copy = [...affaires];
    affairesPrioritaires(affaires);
    expect(affaires[0].date_livraison).toBe(copy[0].date_livraison);
    expect(affaires[1].date_livraison).toBe(copy[1].date_livraison);
  });
});

// ─── countAffairesEnCours ──────────────────────────────────────────────────────
describe('countAffairesEnCours', () => {
  it('compte le nombre exact d\'affaires "En cours"', () => {
    const affaires: AffaireLite[] = [
      { statut: 'En cours' },
      { statut: 'En cours' },
      { statut: 'Terminé' },
      { statut: 'En cours' },
    ];
    expect(countAffairesEnCours(affaires)).toBe(3);
  });

  it('ignore les autres statuts', () => {
    const affaires: AffaireLite[] = [
      { statut: 'Terminé' },
      { statut: 'Annulé' },
      { statut: null },
      { statut: undefined },
    ];
    expect(countAffairesEnCours(affaires)).toBe(0);
  });

  it('retourne 0 pour un tableau vide', () => {
    expect(countAffairesEnCours([])).toBe(0);
  });
});

// ─── caEnCours ─────────────────────────────────────────────────────────────────
describe('caEnCours', () => {
  it('somme les total_ht des affaires "En cours"', () => {
    const affaires: AffaireLite[] = [
      { statut: 'En cours', total_ht: 100000 },
      { statut: 'En cours', total_ht: 50000 },
      { statut: 'Terminé', total_ht: 200000 },
    ];
    expect(caEnCours(affaires)).toBe(150000);
  });

  it('ignore les total_ht null dans les affaires "En cours"', () => {
    const affaires: AffaireLite[] = [
      { statut: 'En cours', total_ht: 80000 },
      { statut: 'En cours', total_ht: null },
    ];
    expect(caEnCours(affaires)).toBe(80000);
  });

  it('ignore les affaires non "En cours"', () => {
    const affaires: AffaireLite[] = [
      { statut: 'Terminé', total_ht: 999999 },
      { statut: 'En cours', total_ht: 38500 },
    ];
    expect(caEnCours(affaires)).toBe(38500);
  });

  it('retourne 0 pour un tableau vide', () => {
    expect(caEnCours([])).toBe(0);
  });
});

// ─── formatK ───────────────────────────────────────────────────────────────────
describe('formatK', () => {
  it('formate 197600 en "197.6 k€"', () => {
    expect(formatK(197600)).toBe('197.6 k€');
  });

  it('formate 0 en "0.0 k€"', () => {
    expect(formatK(0)).toBe('0.0 k€');
  });

  it('formate 38500 en "38.5 k€"', () => {
    expect(formatK(38500)).toBe('38.5 k€');
  });
});

// ─── isoWeek ───────────────────────────────────────────────────────────────────
describe('isoWeek', () => {
  it('2026-01-01 → semaine 1', () => {
    expect(isoWeek(new Date('2026-01-01'))).toBe(1);
  });

  it('2026-06-26 → semaine 26', () => {
    expect(isoWeek(new Date('2026-06-26'))).toBe(26);
  });

  it('2026-12-31 → semaine 53', () => {
    expect(isoWeek(new Date('2026-12-31'))).toBe(53);
  });
});
