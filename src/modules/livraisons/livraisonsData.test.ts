import { describe, it, expect } from 'vitest';
import {
  nextReference,
  totalPoidsKg,
  poidsTonnes,
  encombrement,
  statutLivraisonLabel,
  mailtoCommande,
} from './livraisonsData';

describe('nextReference', () => {
  it("demarre a 001 quand aucune reference pour l'annee", () => {
    expect(nextReference('LIV', [], 2026)).toBe('LIV-2026-001');
  });
  it("incremente le max du compteur de l'annee, padding 3", () => {
    expect(nextReference('LIV', ['LIV-2026-001', 'LIV-2026-004'], 2026)).toBe('LIV-2026-005');
  });
  it("ignore les references d'une autre annee", () => {
    expect(nextReference('CT', ['CT-2025-009'], 2026)).toBe('CT-2026-001');
  });
});

describe('poids', () => {
  it('somme les poids (kg) en ignorant null', () => {
    expect(totalPoidsKg([{ poids: 860 }, { poids: null }, { poids: 140 }])).toBe(1000);
  });
  it('convertit kg en tonnes a 3 decimales', () => {
    expect(poidsTonnes(3530)).toBe(3.53);
  });
});

describe('encombrement', () => {
  it('agregue max longueur/largeur/hauteur (cm->ml) et somme poids (kg->t)', () => {
    const colis = [
      { longueur: 1360, largeur: 240, hauteur: 200, poids: 1600 },
      { longueur: 800, largeur: 240, hauteur: 211, poids: 1930 },
    ];
    expect(encombrement(colis)).toEqual({ long_ml: 13.6, larg_ml: 2.4, haut_ml: 2.11, poids_t: 3.53 });
  });
  it('renvoie des zeros pour une liste vide', () => {
    expect(encombrement([])).toEqual({ long_ml: 0, larg_ml: 0, haut_ml: 0, poids_t: 0 });
  });
});

describe('statutLivraisonLabel', () => {
  it('mappe les statuts techniques en libelles', () => {
    expect(statutLivraisonLabel('en_preparation')).toBe('En préparation');
    expect(statutLivraisonLabel('expedie')).toBe('Expédié');
    expect(statutLivraisonLabel('livre')).toBe('Livré');
  });
});

describe('mailtoCommande', () => {
  it('construit un mailto vers Rouillon avec sujet et detail colis', () => {
    const url = mailtoCommande({
      reference: 'CT-2026-001',
      affaireNumero: 'M25-1105-02',
      destinataire: 'EIFFAGE GENIE CIVIL',
      adresse: '101 RUE DE LA STATION, 93700 DRANCY',
      dateEnlevement: '2025-12-18',
      dateLivraison: '2025-12-22',
      cout: 630,
      encombrement: { long_ml: 13.6, larg_ml: 2.4, haut_ml: 2.11, poids_t: 3.53 },
      colis: [{ numero: 1, poids: 1600 }, { numero: 2, poids: 1930 }],
    });
    expect(url.startsWith('mailto:rh@transports-rouillon.fr?')).toBe(true);
    const decoded = decodeURIComponent(url);
    expect(decoded).toContain('CT-2026-001');
    expect(decoded).toContain('M25-1105-02');
    expect(decoded).toContain('Colis n° 1');
    expect(decoded).toContain('1600 kg');
    expect(decoded).toContain('3.53 t');
  });
});
