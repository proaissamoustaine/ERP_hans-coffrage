import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AppShell } from './AppShell';

vi.mock('../../auth/AuthProvider', () => ({
  useAuth: () => ({
    profil: { nom: 'Gilles TUAILLON', role: 'admin' },
    role: 'admin',
    signOut: vi.fn(),
  }),
}));

function renderShell() {
  render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<div>contenu</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe('AppShell — navigation mobile', () => {
  it('le drawer mobile est absent au départ', () => {
    renderShell();
    expect(screen.queryByTestId('mobile-nav')).toBeNull();
  });

  it('le bouton hamburger ouvre le drawer mobile avec les liens de nav', async () => {
    const user = userEvent.setup();
    renderShell();

    const hamburger = screen.getByRole('button', { name: 'Ouvrir le menu' });
    await user.click(hamburger);

    expect(screen.getByTestId('mobile-nav')).toBeInTheDocument();
    // Le drawer doit contenir au moins un lien "Tableau de bord"
    expect(screen.getAllByText('Tableau de bord').length).toBeGreaterThan(0);
  });

  it('un clic sur le fond ferme le drawer', async () => {
    const user = userEvent.setup();
    renderShell();

    await user.click(screen.getByRole('button', { name: 'Ouvrir le menu' }));
    expect(screen.getByTestId('mobile-nav')).toBeInTheDocument();

    // Clic sur le backdrop (le div absolu inset-0)
    const backdrop = screen.getByTestId('mobile-nav').querySelector('div');
    if (backdrop) await user.click(backdrop);

    expect(screen.queryByTestId('mobile-nav')).toBeNull();
  });
});
