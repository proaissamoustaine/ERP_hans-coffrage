import { describe, it, expect } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { fetchDevis } from './useDevis';

interface StubResult {
  data: { id: string; numero: string; clients: { nom: string } | null }[] | null;
  error: { message: string } | null;
}

const sb = (r: StubResult): SupabaseClient =>
  ({
    from: () => ({ select: () => ({ order: () => Promise.resolve(r) }) }),
  }) as unknown as SupabaseClient;

describe('fetchDevis', () => {
  it('retourne la liste', async () => {
    await expect(
      fetchDevis(
        sb({
          data: [{ id: '1', numero: 'C25-1020-01A', clients: { nom: 'CLIENT A' } }],
          error: null,
        }),
      ),
    ).resolves.toHaveLength(1);
  });
  it('jette sur erreur', async () => {
    await expect(
      fetchDevis(sb({ data: null, error: { message: 'db error' } })),
    ).rejects.toThrow('db error');
  });
});
