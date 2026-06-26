import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

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
});
