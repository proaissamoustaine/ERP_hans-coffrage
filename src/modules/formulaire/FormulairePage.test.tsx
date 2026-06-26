import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../affaires/useAffaires', () => ({
  useAffaires: () => ({
    data: [
      {
        id: 'a1',
        numero: 'C26-0626-01',
        clients: { nom: 'EIFFAGE' },
        chantier: 'Pont A',
        date_livraison: '2026-09-01',
      },
    ],
    isLoading: false,
    error: null,
  }),
}));

vi.mock('./useCatalogue', () => ({
  useCatalogue: () => ({
    data: [
      {
        code: 'Bastaing',
        cat: 'Accessoires',
        famille: 'Barres',
        ref: 'Bastaing épicéa',
        prix: 12.5,
        unite: '€/ml',
        code_unite: 1,
        chute: 6,
        epaisseur: null,
      },
      {
        code: 'CP18',
        cat: 'CP_Filmé',
        famille: 'Panneaux',
        ref: 'Contreplaqué 18mm',
        prix: 45,
        unite: '€/m²',
        code_unite: 2,
        chute: 12,
        epaisseur: 18,
      },
    ],
  }),
}));

vi.mock('./useTauxMO', () => ({
  useTauxMO: () => ({
    data: [{ code: 'MO_BE', des: 'Bureau Etude', taux: 72.4, op: 1 }],
  }),
}));

vi.mock('./usePieces', () => ({
  usePieces: () => ({ data: [], isLoading: false }),
  useCreatePiece: () => ({ mutate: vi.fn(), isPending: false }),
  useDeletePiece: () => ({ mutate: vi.fn(), isPending: false }),
  useUpdatePiece: () => ({ mutate: vi.fn(), isPending: false }),
}));

import FormulairePage from './FormulairePage';

function renderPage() {
  return render(
    <MemoryRouter>
      <FormulairePage />
    </MemoryRouter>,
  );
}

describe('FormulairePage', () => {
  it('affiche le sélecteur d\'affaire avec le numéro', () => {
    renderPage();
    expect(screen.getByRole('option', { name: 'C26-0626-01' })).toBeInTheDocument();
  });

  it('propose un type de TYPES_MATIERE (« Accessoires ») dans le select Type', () => {
    renderPage();
    expect(screen.getByRole('option', { name: 'Accessoires' })).toBeInTheDocument();
  });

  it('peuple Réf_1 (famille) après sélection d\'un type', async () => {
    const user = userEvent.setup();
    renderPage();
    // Avant sélection, la famille « Barres » n'est pas dans une option
    expect(screen.queryByRole('option', { name: 'Barres' })).not.toBeInTheDocument();
    // Le select Type est celui qui contient l'option « Accessoires »
    const typeSelect = screen.getByRole('option', { name: 'Accessoires' })
      .closest('select') as HTMLSelectElement;
    await user.selectOptions(typeSelect, 'Accessoires');
    expect(screen.getByRole('option', { name: 'Barres' })).toBeInTheDocument();
  });

  it('affiche l\'onglet de géométrie « Type 1 »', () => {
    renderPage();
    expect(screen.getByRole('button', { name: 'Type 1' })).toBeInTheDocument();
  });

  it('affiche l\'état vide des tables quand aucune pièce n\'est saisie', () => {
    renderPage();
    expect(
      screen.getByText(/Aucune pièce saisie pour cette affaire/),
    ).toBeInTheDocument();
  });
});
