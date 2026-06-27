// src/modules/colisage/useColis.fetch.test.ts
import { describe, it, expect, vi } from 'vitest';
import { fetchColis } from './useColis';

describe('fetchColis', () => {
  it('lit colis avec n° affaire, triés par date desc', async () => {
    const rows = [{ id: 'k1', affaire_id: 'a', numero: 1 }];
    const order = vi.fn().mockResolvedValue({ data: rows, error: null });
    const select = vi.fn(() => ({ order }));
    const from = vi.fn(() => ({ select }));
    const res = await fetchColis({ from } as never);
    expect(from).toHaveBeenCalledWith('colis');
    expect(order).toHaveBeenCalledWith('date', { ascending: false });
    expect(res).toEqual(rows);
  });
});
