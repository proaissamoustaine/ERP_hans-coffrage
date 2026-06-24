import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('./useAffaires', () => ({
  useAffaires: () => ({
    data: [
      {
        id: '1',
        numero: 'C26-0624-01',
        clients: { nom: 'EIFFAGE ALSACE' },
        chantier: 'ARCHIPEL',
        statut: 'En cours',
        avancement: 9,
      },
    ],
    isLoading: false,
    error: null,
  }),
}));

vi.mock('./useEtapes', () => ({
  useEtapes: () => ({ data: [], isLoading: false }),
  useToggleEtape: () => ({ mutate: vi.fn() }),
}));

import { AffairesPage } from './AffairesPage';

describe('AffairesPage', () => {
  it('affiche le numéro d\'affaire et le client', () => {
    render(
      <MemoryRouter>
        <AffairesPage />
      </MemoryRouter>,
    );
    expect(screen.getByText('C26-0624-01')).toBeInTheDocument();
    expect(screen.getByText('EIFFAGE ALSACE')).toBeInTheDocument();
  });
});
