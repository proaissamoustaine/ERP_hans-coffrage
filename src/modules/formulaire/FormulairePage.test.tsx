import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../affaires/useAffaires', () => ({
  useAffaires: () => ({
    data: [
      { id: 'a1', numero: 'C26-0626-01', clients: { nom: 'EIFFAGE' }, chantier: 'X' },
    ],
    isLoading: false,
    error: null,
  }),
}));

vi.mock('./useCatalogue', () => ({
  useCatalogue: () => ({
    data: [
      { code: 'Bastaing', cat: 'Bois', famille: 'Barres', ref: 'Bastaing épicéa', prix: 12.5, unite: '€/ml', chute: 6 },
      { code: 'CP18', cat: 'Bois', famille: 'Panneaux', ref: 'Contreplaqué 18mm', prix: 45, unite: '€/m²', chute: 12 },
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
  it('affiche le titre « Formulaire »', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: 'Formulaire' })).toBeInTheDocument();
  });

  it('propose la catégorie « Bois » dans le select Catégorie', () => {
    renderPage();
    expect(screen.getByRole('option', { name: 'Bois' })).toBeInTheDocument();
  });

  it('affiche l\'option « MO_BE » après bascule sur Main d\'œuvre', async () => {
    const user = userEvent.setup();
    renderPage();
    // En mode Matière, l'option MO n'est pas présente
    expect(screen.queryByRole('option', { name: /MO_BE/ })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Main d'œuvre/ }));
    expect(screen.getByRole('option', { name: /MO_BE/ })).toBeInTheDocument();
  });

  it('affiche l\'état vide quand aucune pièce n\'est saisie', () => {
    renderPage();
    expect(screen.getByText('Aucune pièce saisie pour cette affaire')).toBeInTheDocument();
  });
});
