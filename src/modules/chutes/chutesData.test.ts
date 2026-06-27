// src/modules/chutes/chutesData.test.ts
import { describe, it, expect } from 'vitest';
import { surfaceM2, valoriserChute, chutesDispo, chutesConsommees, catsPresentes, valeurTotale } from './chutesData';

const base = { longueur: 1200, largeur: 800, epaisseur: 15, prix_unit: 65.5594, unite: '€/U', cat: 'CP_Filmé', statut: 'disponible' as const };

describe('surfaceM2', () => {
  it('calcule la surface en m²', () => {
    expect(surfaceM2({ longueur: 1200, largeur: 800 })).toBeCloseTo(0.96, 5);
    expect(surfaceM2({ longueur: null, largeur: 800 })).toBe(0);
  });
});

describe('valoriserChute', () => {
  it('unité €/U : prix ramené au m² via /3.125', () => {
    expect(valoriserChute(base)).toBeCloseTo(0.96 * (65.5594 / 3.125), 4);
  });
  it('unité €/m² : prix_unit pris tel quel', () => {
    expect(valoriserChute({ ...base, unite: '€/m²', prix_unit: 50 })).toBeCloseTo(0.96 * 50, 4);
  });
});

describe('filtres', () => {
  const rows = [
    { ...base, statut: 'disponible' as const, cat: 'CP_Filmé' },
    { ...base, statut: 'consommee' as const, cat: 'CP_Filmé' },
    { ...base, statut: 'reutilisee_partiel' as const, cat: 'CP_Résineux' },
    { ...base, statut: 'rebut' as const, cat: 'X' },
  ];
  it('chutesDispo = statut disponible', () => {
    expect(chutesDispo(rows)).toHaveLength(1);
  });
  it('chutesConsommees = consommee ou reutilisee_partiel', () => {
    expect(chutesConsommees(rows)).toHaveLength(2);
  });
  it('catsPresentes = cats distinctes des dispo', () => {
    expect(catsPresentes(chutesDispo(rows))).toEqual(['CP_Filmé']);
  });
  it('valeurTotale somme les valorisations', () => {
    expect(valeurTotale(chutesDispo(rows))).toBeCloseTo(valoriserChute(base), 4);
  });
});
