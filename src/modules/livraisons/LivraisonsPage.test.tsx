import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import LivraisonsPage from './LivraisonsPage';

vi.mock('./useLivraisons', () => ({
  useLivraisons: () => ({ data: [], isLoading: false }),
  useCreerLivraison: () => ({ mutate: vi.fn(), isPending: false }),
  useMajStatutLivraison: () => ({ mutate: vi.fn(), isPending: false }),
}));
vi.mock('../affaires/useAffaires', () => ({ useAffaires: () => ({ data: [], isLoading: false }) }));
vi.mock('../colisage/useColis', () => ({ useColis: () => ({ data: [], isLoading: false }) }));

function wrap(ui: React.ReactNode) {
  const qc = new QueryClient();
  return render(<QueryClientProvider client={qc}><MemoryRouter>{ui}</MemoryRouter></QueryClientProvider>);
}

describe('LivraisonsPage', () => {
  it('affiche le titre et les KPI', () => {
    wrap(<LivraisonsPage />);
    expect(screen.getByText('Livraisons')).toBeInTheDocument();
    expect(screen.getByText('En préparation')).toBeInTheDocument();
  });
});
