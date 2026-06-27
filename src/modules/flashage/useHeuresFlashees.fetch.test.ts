// src/modules/flashage/useHeuresFlashees.fetch.test.ts
import { describe, it, expect, vi } from 'vitest';
import { fetchHeuresFlashees } from './useHeuresFlashees';

describe('fetchHeuresFlashees', () => {
  it('lit heures_flashees ordonné par date desc', async () => {
    const rows = [{ id: '1', affaire_id: 'a', code_tache: 'CAF', duree_min: 60 }];
    const order = vi.fn().mockResolvedValue({ data: rows, error: null });
    const select = vi.fn(() => ({ order }));
    const from = vi.fn(() => ({ select }));
    const res = await fetchHeuresFlashees({ from } as never);
    expect(from).toHaveBeenCalledWith('heures_flashees');
    expect(order).toHaveBeenCalledWith('date', { ascending: false });
    expect(res).toEqual(rows);
  });
});
