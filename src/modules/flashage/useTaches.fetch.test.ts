// src/modules/flashage/useTaches.fetch.test.ts
import { describe, it, expect, vi } from 'vitest';
import { fetchTaches, fetchCategoriesHeures } from './useTaches';

function mockSb(rows: unknown) {
  const order = vi.fn().mockResolvedValue({ data: rows, error: null });
  const select = vi.fn(() => ({ order }));
  const from = vi.fn(() => ({ select }));
  return { sb: { from } as never, from, select, order };
}

describe('fetchTaches', () => {
  it('lit taches_codes ordonné par code', async () => {
    const rows = [{ code: 'CAF', groupe: 'g', label: 'l', categorie_heures: 'MONTAGE', facturable: true }];
    const { sb, from, order } = mockSb(rows);
    const res = await fetchTaches(sb);
    expect(from).toHaveBeenCalledWith('taches_codes');
    expect(order).toHaveBeenCalledWith('code');
    expect(res).toEqual(rows);
  });
});

describe('fetchCategoriesHeures', () => {
  it('lit categories_heures', async () => {
    const rows = [{ code: 'MONTAGE', label: 'Heures MONTAGE', taux: 65.4 }];
    const { sb, from } = mockSb(rows);
    const res = await fetchCategoriesHeures(sb);
    expect(from).toHaveBeenCalledWith('categories_heures');
    expect(res).toEqual(rows);
  });
});
