import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const mockUseAuth = vi.fn();
vi.mock('./AuthProvider', () => ({ useAuth: () => mockUseAuth() }));
vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: { signInWithPassword: vi.fn().mockResolvedValue({ data: {}, error: null }) },
  },
}));

import LoginPage from './LoginPage';

describe('LoginPage', () => {
  it('affiche le formulaire quand non connecté', () => {
    mockUseAuth.mockReturnValue({ session: null });
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    );
    expect(screen.getByLabelText('email')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /se connecter/i })).toBeInTheDocument();
  });

  it('redirige (aucun formulaire affiché) quand déjà connecté', () => {
    mockUseAuth.mockReturnValue({ session: { user: { id: 'x' } } });
    render(
      <MemoryRouter initialEntries={['/login']}>
        <LoginPage />
      </MemoryRouter>,
    );
    expect(screen.queryByLabelText('email')).not.toBeInTheDocument();
  });
});
