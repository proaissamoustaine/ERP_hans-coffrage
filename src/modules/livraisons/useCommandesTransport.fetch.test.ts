import { describe, it, expect, vi } from 'vitest';
import { fetchCommandes } from './useCommandesTransport';

describe('fetchCommandes', () => {
  it('lit commandes_transport avec affaire, triees par date desc', async () => {
    const rows = [{ id: 'c1', affaire_id: 'a', reference: 'CT-2026-001' }];
    const order = vi.fn().mockResolvedValue({ data: rows, error: null });
    const select = vi.fn(() => ({ order }));
    const from = vi.fn(() => ({ select }));
    const res = await fetchCommandes({ from } as never);
    expect(from).toHaveBeenCalledWith('commandes_transport');
    expect(order).toHaveBeenCalledWith('created_at', { ascending: false });
    expect(res).toEqual(rows);
  });
});
