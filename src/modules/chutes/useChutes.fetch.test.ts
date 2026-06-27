// src/modules/chutes/useChutes.fetch.test.ts
import { describe, it, expect, vi } from 'vitest';
import { fetchChutes } from './useChutes';

describe('fetchChutes', () => {
  it('lit chutes avec n° affaires origine/conso, triées par created_at desc', async () => {
    const rows = [{ id: 'c1', statut: 'disponible' }];
    const order = vi.fn().mockResolvedValue({ data: rows, error: null });
    const select = vi.fn(() => ({ order }));
    const from = vi.fn(() => ({ select }));
    const res = await fetchChutes({ from } as never);
    expect(from).toHaveBeenCalledWith('chutes');
    expect(order).toHaveBeenCalledWith('created_at', { ascending: false });
    expect(res).toEqual(rows);
  });
});
