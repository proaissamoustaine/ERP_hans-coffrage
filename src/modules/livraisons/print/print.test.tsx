import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BonLivraisonPrint } from './BonLivraisonPrint';
import { EtiquetteColisPrint } from './EtiquetteColisPrint';

const liv = {
  reference: 'LIV-2026-001',
  affaireNumero: 'C26-0627-01',
  client: 'EIFFAGE',
  chantier: 'STEP WASMUEL',
  destination: 'QUAREGNON BELGIQUE',
  date: '2026-06-27',
  colis: [{ numero: 1, longueur: 1200, largeur: 800, hauteur: 200, poids: 860 }],
};

describe('BonLivraisonPrint', () => {
  it('affiche la reference, le client et le colis', () => {
    render(<BonLivraisonPrint {...liv} />);
    expect(screen.getByText('LIV-2026-001')).toBeInTheDocument();
    expect(screen.getByText(/EIFFAGE/)).toBeInTheDocument();
    expect(screen.getByText(/860/)).toBeInTheDocument();
  });
});

describe('EtiquetteColisPrint', () => {
  it('affiche le numero de colis, l affaire et le poids', () => {
    render(
      <EtiquetteColisPrint
        affaireNumero="C26-0627-01"
        client="EIFFAGE"
        chantier="STEP WASMUEL"
        colis={{ numero: 1, longueur: 1200, largeur: 800, hauteur: 200, poids: 860 }}
        total={5}
      />,
    );
    expect(screen.getByText(/1\s*\/\s*5/)).toBeInTheDocument();
    expect(screen.getByText('C26-0627-01')).toBeInTheDocument();
    expect(screen.getByText(/860/)).toBeInTheDocument();
  });
});
