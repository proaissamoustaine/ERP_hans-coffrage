import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import ChutesPage from './ChutesPage';

vi.mock('./useChutes', () => ({
  useChutes: () => ({ data: [], isLoading: false }),
  useDeclarerChute: () => ({ mutate: vi.fn() }),
  useReutiliserChute: () => ({ mutate: vi.fn() }),
}));
vi.mock('../formulaire/useCatalogue', () => ({ useCatalogue: () => ({ data: [], isLoading: false }) }));
vi.mock('../affaires/useAffaires', () => ({ useAffaires: () => ({ data: [], isLoading: false }) }));
vi.mock('../../lib/useRealtimeTable', () => ({ useRealtimeTable: () => undefined }));
vi.mock('../../auth/AuthProvider', () => ({ useAuth: () => ({ profil: { nom: 'Gilles TUAILLON', role: 'admin' }, session: { user: { id: 'u' } } }) }));

function renderPage() {
  const qc = new QueryClient();
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter><ChutesPage /></MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('ChutesPage', () => {
  it('rend l\'en-tête chutothèque', () => {
    renderPage();
    expect(screen.getByText(/chutoth[èe]que/i)).toBeInTheDocument();
  });
  it('affiche l\'état vide du stock', () => {
    renderPage();
    expect(screen.getByText(/Aucune chute disponible/i)).toBeInTheDocument();
  });
});
