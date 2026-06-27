// src/modules/flashage/FlashagePage.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import FlashagePage from './FlashagePage';

vi.mock('./useAffairesFlashables', () => ({ useAffairesFlashables: () => ({ data: [], isLoading: false }) }));
vi.mock('./useHeuresFlashees', () => ({
  useHeuresFlashees: () => ({ data: [], isLoading: false }),
  useFlasherHeures: () => ({ mutate: vi.fn(), isPending: false }),
}));
vi.mock('./useTaches', () => ({
  useTaches: () => ({ data: [], isLoading: false }),
  useCategoriesHeures: () => ({ data: [], isLoading: false }),
}));
vi.mock('../formulaire/usePieces', () => ({
  usePieces: () => ({ data: [], isLoading: false }),
  useTogglePieceFait: () => ({ mutate: vi.fn() }),
}));
vi.mock('../../lib/useRealtimeTable', () => ({ useRealtimeTable: () => undefined }));
vi.mock('../../auth/AuthProvider', () => ({ useAuth: () => ({ profil: { id: 'u', nom: 'Gilles TUAILLON', role: 'admin' } }) }));

function renderPage() {
  const qc = new QueryClient();
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter><FlashagePage /></MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('FlashagePage', () => {
  it('rend l\'en-tête Flashage atelier', () => {
    renderPage();
    expect(screen.getByText(/Flashage atelier/i)).toBeInTheDocument();
  });
  it('affiche le message « aucune affaire prête » quand 0 flashable', () => {
    renderPage();
    expect(screen.getByText(/valider un formulaire/i)).toBeInTheDocument();
  });
});
