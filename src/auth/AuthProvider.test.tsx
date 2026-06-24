import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
    },
    from: vi.fn(),
  },
}));
import { AuthProvider, useAuth } from './AuthProvider';
function Probe() { const { loading, session } = useAuth(); return <div>{loading ? 'loading' : session ? 'in' : 'out'}</div>; }

describe('AuthProvider', () => {
  it('passe à l\'état déconnecté quand pas de session', async () => {
    render(<AuthProvider><Probe /></AuthProvider>);
    await waitFor(() => expect(screen.getByText('out')).toBeInTheDocument());
  });
});
