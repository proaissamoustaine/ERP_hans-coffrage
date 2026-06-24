import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('./useClients', () => ({
  useClients: () => ({
    data: [{ id: '1', nom: 'EIFFAGE ALSACE', ville: 'STRASBOURG' }],
    isLoading: false,
    error: null,
  }),
  useCreateClient: () => ({ mutate: vi.fn(), isPending: false }),
}));

import { ClientsPage } from './ClientsPage';

describe('ClientsPage', () => {
  it('affiche les clients', () => {
    render(<ClientsPage />);
    expect(screen.getByText('EIFFAGE ALSACE')).toBeInTheDocument();
  });
});
