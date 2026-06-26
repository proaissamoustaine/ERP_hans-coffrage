import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../affaires/useAffaires', () => ({
  useAffaires: () => ({
    data: [
      {
        id: 'a1',
        numero: 'C26-0626-01',
        mode: 'coffrage',
        clients: { nom: 'EIFFAGE ALSACE' },
        chantier: 'ARCHIPEL',
        avancement: 40,
        statut: 'En cours',
        total_ht: 38500,
        date_livraison: '2026-09-12',
      },
    ],
    isLoading: false,
  }),
}));

vi.mock('../../auth/AuthProvider', () => ({
  useAuth: () => ({ profil: { nom: 'Gilles TUAILLON' } }),
}));

import DashboardPage from './DashboardPage';

describe('DashboardPage', () => {
  function renderPage() {
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    );
  }

  it('salue l\'utilisateur par son prénom', () => {
    renderPage();
    expect(screen.getByText(/Bonjour Gilles/)).toBeInTheDocument();
  });

  it('affiche les 4 libellés KPI', () => {
    renderPage();
    expect(screen.getByText('Affaires actives')).toBeInTheDocument();
    expect(screen.getByText('CA en cours (HT)')).toBeInTheDocument();
    expect(screen.getByText('Heures semaine')).toBeInTheDocument();
    expect(screen.getByText('Livraisons à venir')).toBeInTheDocument();
  });

  it('affiche les affaires prioritaires réelles', () => {
    renderPage();
    expect(screen.getByText('Affaires prioritaires')).toBeInTheDocument();
    expect(screen.getByText('C26-0626-01')).toBeInTheDocument();
  });

  it('marque les widgets stub comme « Démo »', () => {
    renderPage();
    expect(screen.getAllByText('Démo').length).toBeGreaterThan(0);
  });
});
