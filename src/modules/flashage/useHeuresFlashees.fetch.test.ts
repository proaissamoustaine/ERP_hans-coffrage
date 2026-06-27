// src/modules/flashage/useHeuresFlashees.fetch.test.ts
import { describe, it, expect, vi } from 'vitest';
import { fetchHeuresFlashees, insertFlash } from './useHeuresFlashees';

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

describe('insertFlash', () => {
  it('insère un pointage avec date côté client', async () => {
    const insert = vi.fn().mockResolvedValue({ error: null });
    const from = vi.fn(() => ({ insert }));
    await insertFlash({ from } as never, {
      affaire_id: 'a',
      code_tache: 'CAF',
      operateur_id: 'u',
      operateur_nom: 'Gilles TUAILLON',
      duree_min: 12,
      date: '2026-06-27T10:00:00.000Z',
    });
    expect(from).toHaveBeenCalledWith('heures_flashees');
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({ affaire_id: 'a', duree_min: 12, date: '2026-06-27T10:00:00.000Z' }),
    );
  });
});
