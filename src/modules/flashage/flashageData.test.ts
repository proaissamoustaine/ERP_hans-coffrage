// src/modules/flashage/flashageData.test.ts
import { describe, it, expect } from 'vitest';
import {
  fmtChrono,
  fmtDuree,
  totalMinutes,
  estAujourdhui,
  estCetteSemaine,
  groupTaches,
  estFlashable,
  dureeMinDepuis,
  ORDRE_GROUPES,
  type TacheRow,
} from './flashageData';

describe('fmtChrono', () => {
  it('formate des millisecondes en HH:MM:SS', () => {
    expect(fmtChrono(0)).toBe('00:00:00');
    expect(fmtChrono(1000)).toBe('00:00:01');
    expect(fmtChrono(61_000)).toBe('00:01:01');
    expect(fmtChrono(3_661_000)).toBe('01:01:01');
  });
  it('clampe les valeurs négatives à 0', () => {
    expect(fmtChrono(-5000)).toBe('00:00:00');
  });
});

describe('fmtDuree', () => {
  it('formate des minutes en "Xh MM"', () => {
    expect(fmtDuree(0)).toBe('0h 00');
    expect(fmtDuree(90)).toBe('1h 30');
    expect(fmtDuree(8)).toBe('0h 08');
    expect(fmtDuree(125)).toBe('2h 05');
  });
});

describe('totalMinutes', () => {
  it('somme duree_min des entrées qui passent le prédicat', () => {
    const flashs = [
      { duree_min: 60, date: '2026-06-27T08:00:00Z' },
      { duree_min: 30, date: '2026-06-27T09:00:00Z' },
      { duree_min: 45, date: '2026-06-20T09:00:00Z' },
    ];
    expect(totalMinutes(flashs, () => true)).toBe(135);
    expect(totalMinutes(flashs, (f) => f.date.startsWith('2026-06-27'))).toBe(90);
    expect(totalMinutes([], () => true)).toBe(0);
  });
});

describe('estAujourdhui / estCetteSemaine', () => {
  const ref = new Date('2026-06-27T12:00:00Z'); // samedi
  it('estAujourdhui vrai le même jour, faux sinon', () => {
    expect(estAujourdhui('2026-06-27T08:00:00Z', ref)).toBe(true);
    expect(estAujourdhui('2026-06-26T08:00:00Z', ref)).toBe(false);
  });
  it('estCetteSemaine vrai dans la semaine ISO (lun→dim), faux avant', () => {
    expect(estCetteSemaine('2026-06-22T08:00:00Z', ref)).toBe(true); // lundi même semaine
    expect(estCetteSemaine('2026-06-21T08:00:00Z', ref)).toBe(false); // dimanche d'avant
  });
});

describe('groupTaches', () => {
  it('groupe par `groupe` selon ORDRE_GROUPES, codes dans l\'ordre d\'entrée', () => {
    const rows: TacheRow[] = [
      { code: 'BEAA', label: 'Dessin', groupe: 'Dessin BE (facturable)', categorie_heures: 'DESSIN', facturable: true },
      { code: 'CAC', label: 'Coffrage', groupe: 'Coffrages & Autres (facturable)', categorie_heures: 'MONTAGE', facturable: true },
      { code: 'CAF', label: 'Coffrage fab', groupe: 'Coffrages & Autres (facturable)', categorie_heures: 'MONTAGE', facturable: true },
    ];
    const g = groupTaches(rows);
    expect(g.map((x) => x.groupe)).toEqual([
      'Coffrages & Autres (facturable)',
      'Dessin BE (facturable)',
    ]);
    expect(g[0].codes.map((c) => c.code)).toEqual(['CAC', 'CAF']);
  });

  it('place les groupes inconnus de ORDRE_GROUPES à la fin', () => {
    const rows: TacheRow[] = [
      { code: 'ZZ', label: 'Inconnu', groupe: 'Groupe hors liste', categorie_heures: null, facturable: false },
      { code: 'CAC', label: 'Coffrage', groupe: ORDRE_GROUPES[0], categorie_heures: 'MONTAGE', facturable: true },
    ];
    expect(groupTaches(rows).map((x) => x.groupe)).toEqual([ORDRE_GROUPES[0], 'Groupe hors liste']);
  });
});

describe('estFlashable', () => {
  it('vrai si l\'étape saisie_pieces est faite', () => {
    expect(estFlashable([{ etape: 'saisie_pieces', fait: true }])).toBe(true);
    expect(estFlashable([{ etape: 'saisie_pieces', fait: false }])).toBe(false);
    expect(estFlashable([{ etape: 'devis_accepte', fait: true }])).toBe(false);
    expect(estFlashable([])).toBe(false);
  });
});

describe('dureeMinDepuis', () => {
  it('arrondit à la minute, minimum 1', () => {
    const start = 1_000_000;
    expect(dureeMinDepuis(start, start + 90_000)).toBe(2); // 1.5 min arrondi
    expect(dureeMinDepuis(start, start + 1_000)).toBe(1); // <1 min → 1
    expect(dureeMinDepuis(start, start + 600_000)).toBe(10);
  });
});
