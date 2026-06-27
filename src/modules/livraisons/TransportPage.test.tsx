import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import TransportPage from './TransportPage';

vi.mock('./useCommandesTransport', () => ({
  useCommandesTransport: () => ({ data: [], isLoading: false }),
  useCreerCommande: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));
vi.mock('../affaires/useAffaires', () => ({ useAffaires: () => ({ data: [], isLoading: false }) }));
vi.mock('../colisage/useColis', () => ({ useColis: () => ({ data: [], isLoading: false }) }));

function wrap(ui: React.ReactNode) {
  const qc = new QueryClient();
  return render(<QueryClientProvider client={qc}><MemoryRouter>{ui}</MemoryRouter></QueryClientProvider>);
}

describe('TransportPage', () => {
  it('affiche le titre et la carte commande', () => {
    wrap(<TransportPage />);
    expect(screen.getByText('Transport')).toBeInTheDocument();
    expect(screen.getByText(/Nouvelle commande transport/)).toBeInTheDocument();
  });
});
