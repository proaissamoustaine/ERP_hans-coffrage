import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('./useClients', () => ({
  useClients: () => ({
    data: [{ id: '1', nom: 'EIFFAGE ALSACE', ville: 'STRASBOURG', type: 'BTP', contact: null, tel: null, email: null }],
    isLoading: false,
    error: null,
  }),
  useCreateClient: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock('../affaires/useAffaires', () => ({
  useAffaires: () => ({ data: [], isLoading: false, error: null }),
}));

import { ClientsPage } from './ClientsPage';

describe('ClientsPage', () => {
  it('affiche les clients', () => {
    render(<ClientsPage />);
    expect(screen.getAllByText('EIFFAGE ALSACE').length).toBeGreaterThan(0);
  });
  it('affiche les champs entreprise dans la modale Nouveau client', async () => {
    const user = userEvent.setup();
    render(<ClientsPage />);
    await user.click(screen.getByRole('button', { name: 'Nouveau client' }));
    expect(screen.getByText('SIRET')).toBeInTheDocument();
    expect(screen.getByText('N° TVA intracom')).toBeInTheDocument();
    expect(screen.getByText('Pays')).toBeInTheDocument();
    expect(screen.getByText('Adresse')).toBeInTheDocument();
    expect(screen.getByText('Code postal')).toBeInTheDocument();
  });
});
