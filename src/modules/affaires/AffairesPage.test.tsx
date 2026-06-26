import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
  useCreateAffaire: () => ({ mutate: vi.fn(), isPending: false, isError: false }),
}));

vi.mock('./useEtapes', () => ({
  useEtapes: () => ({ data: [], isLoading: false }),
  useToggleEtape: () => ({ mutate: vi.fn() }),
}));

vi.mock('../clients/useClients', () => ({
  useClients: () => ({ data: [{ id: 'c1', nom: 'BOUYGUES TP RF' }] }),
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

  it('ouvre la modale Nouvelle affaire au clic', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <AffairesPage />
      </MemoryRouter>,
    );
    await user.click(screen.getByRole('button', { name: /Nouvelle affaire/ }));
    expect(screen.getByText('Désignation')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Créer l'affaire/ })).toBeInTheDocument();
    expect(screen.getByText('BOUYGUES TP RF')).toBeInTheDocument();
  });
});
