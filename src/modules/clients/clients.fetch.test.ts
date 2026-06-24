import { describe, it, expect } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { fetchClients } from './useClients';

interface StubResult {
  data: { id: string; nom: string }[] | null;
  error: { message: string } | null;
}

const sb = (r: StubResult): SupabaseClient =>
  ({
    from: () => ({ select: () => ({ order: () => Promise.resolve(r) }) }),
  }) as unknown as SupabaseClient;

describe('fetchClients', () => {
  it('retourne la liste', async () => {
    await expect(
      fetchClients(sb({ data: [{ id: '1', nom: 'A' }], error: null })),
    ).resolves.toHaveLength(1);
  });
  it('jette sur erreur', async () => {
    await expect(
      fetchClients(sb({ data: null, error: { message: 'x' } })),
    ).rejects.toThrow('x');
  });
});
