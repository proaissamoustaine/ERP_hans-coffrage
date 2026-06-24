import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('./useDevis', () => ({
  useDevis: () => ({
    data: [
      {
        id: '1',
        numero: 'C25-1020-01A',
        mode: 'coffrage',
        clients: { nom: 'EIFFAGE ALSACE' },
        objet: 'Voiles R+5',
        total_ht: 32000,
        statut: 'brouillon',
        client_id: null,
        chantier: null,
        frais_transport: 0,
      },
    ],
    isLoading: false,
    error: null,
  }),
  useCreateDevis: () => ({ mutate: vi.fn(), isPending: false, isError: false }),
  useUpdateDevisStatut: () => ({ mutate: vi.fn(), isPending: false }),
  useRevisionDevis: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock('../clients/useClients', () => ({
  useClients: () => ({ data: [], isLoading: false, error: null }),
}));

import { DevisPage } from './DevisPage';

describe('DevisPage', () => {
  it('affiche le numéro de devis et le bouton Nouveau devis', () => {
    render(<DevisPage />);
    expect(screen.getByText('C25-1020-01A')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Nouveau devis' })).toBeInTheDocument();
  });
});
