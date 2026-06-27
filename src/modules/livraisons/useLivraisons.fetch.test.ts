import { describe, it, expect, vi } from 'vitest';
import { fetchLivraisons } from './useLivraisons';

describe('fetchLivraisons', () => {
  it('lit livraisons avec affaire/client et colis, triees par date desc', async () => {
    const rows = [{ id: 'l1', affaire_id: 'a', reference: 'LIV-2026-001' }];
    const order = vi.fn().mockResolvedValue({ data: rows, error: null });
    const select = vi.fn(() => ({ order }));
    const from = vi.fn(() => ({ select }));
    const res = await fetchLivraisons({ from } as never);
    expect(from).toHaveBeenCalledWith('livraisons');
    expect(order).toHaveBeenCalledWith('created_at', { ascending: false });
    expect(res).toEqual(rows);
  });
});
