import { describe, it, expect } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { fetchAffaires } from './useAffaires';

interface StubResult {
  data: { id: string; numero: string; clients: { nom: string } | null }[] | null;
  error: { message: string } | null;
}

const sb = (r: StubResult): SupabaseClient =>
  ({
    from: () => ({ select: () => ({ order: () => Promise.resolve(r) }) }),
  }) as unknown as SupabaseClient;

describe('fetchAffaires', () => {
  it('retourne la liste', async () => {
    await expect(
      fetchAffaires(
        sb({
          data: [{ id: '1', numero: 'C25-1020-01', clients: { nom: 'CLIENT A' } }],
          error: null,
        }),
      ),
    ).resolves.toHaveLength(1);
  });
  it('jette sur erreur', async () => {
    await expect(
      fetchAffaires(sb({ data: null, error: { message: 'db error' } })),
    ).rejects.toThrow('db error');
  });
});
