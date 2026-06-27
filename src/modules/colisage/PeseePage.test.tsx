import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import PeseePage from './PeseePage';

vi.mock('./useColis', () => ({
  useColis: () => ({ data: [], isLoading: false }),
  useCreerColis: () => ({ mutate: vi.fn() }),
  usePeserColis: () => ({ mutate: vi.fn() }),
}));
vi.mock('../../lib/useRealtimeTable', () => ({ useRealtimeTable: () => undefined }));
vi.mock('../../auth/AuthProvider', () => ({ useAuth: () => ({ profil: { nom: 'Gilles TUAILLON', role: 'admin' }, session: { user: { id: 'u' } } }) }));

function renderPage() {
  const qc = new QueryClient();
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter><PeseePage /></MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('PeseePage', () => {
  it('rend l\'en-tête Pesée', () => {
    renderPage();
    expect(screen.getByText(/Pesée des colis/i)).toBeInTheDocument();
  });
});
