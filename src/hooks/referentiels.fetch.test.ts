import { describe, it, expect } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { fetchTable } from './referentiels.fetch';

interface StubResult {
  data: { code: string }[] | null;
  error: { message: string } | null;
}

const makeSb = (result: StubResult): SupabaseClient =>
  ({ from: () => ({ select: () => Promise.resolve(result) }) }) as unknown as SupabaseClient;

describe('fetchTable', () => {
  it('retourne data si pas d\'erreur', async () => {
    const sb = makeSb({ data: [{ code: 'MO_HB' }], error: null });
    await expect(fetchTable(sb, 'taux_horaires_mo')).resolves.toEqual([{ code: 'MO_HB' }]);
  });
  it('jette si erreur Supabase', async () => {
    const sb = makeSb({ data: null, error: { message: 'boom' } });
    await expect(fetchTable(sb, 'taux_horaires_mo')).rejects.toThrow('boom');
  });
});
