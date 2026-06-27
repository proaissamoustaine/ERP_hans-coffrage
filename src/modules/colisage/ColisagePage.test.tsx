import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import ColisagePage from './ColisagePage';

vi.mock('./useColis', () => ({
  useColis: () => ({ data: [], isLoading: false }),
  useCreerColis: () => ({ mutate: vi.fn() }),
  usePeserColis: () => ({ mutate: vi.fn() }),
}));
vi.mock('../affaires/useAffaires', () => ({ useAffaires: () => ({ data: [], isLoading: false }) }));
vi.mock('../../lib/useRealtimeTable', () => ({ useRealtimeTable: () => undefined }));
vi.mock('../../auth/AuthProvider', () => ({ useAuth: () => ({ profil: { nom: 'Gilles TUAILLON', role: 'admin' }, session: { user: { id: 'u' } } }) }));

function renderPage() {
  const qc = new QueryClient();
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter><ColisagePage /></MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('ColisagePage', () => {
  it('rend l\'en-tête Colisage', () => {
    renderPage();
    expect(screen.getByText('Colisage')).toBeInTheDocument();
  });
  it('affiche la carte d\'ajout de colis', () => {
    renderPage();
    expect(screen.getByText(/Ajouter un colis pour une affaire/i)).toBeInTheDocument();
  });
});
