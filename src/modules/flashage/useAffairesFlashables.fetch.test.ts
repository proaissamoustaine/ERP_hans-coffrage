// src/modules/flashage/useAffairesFlashables.fetch.test.ts
import { describe, it, expect, vi } from 'vitest';
import { fetchAffairesFlashables } from './useAffairesFlashables';

describe('fetchAffairesFlashables', () => {
  it('lit les affaires ayant une étape saisie_pieces faite', async () => {
    const rows = [{ id: 'a', numero: 'C26-0701-01', clients: { nom: 'BOUYGUES' } }];
    // chaîne: from('affaires').select(...).eq('etapes_affaire.etape','saisie_pieces').eq('etapes_affaire.fait',true).order('created_at',{ascending:false})
    const order = vi.fn().mockResolvedValue({ data: rows, error: null });
    const eq2 = vi.fn(() => ({ order }));
    const eq1 = vi.fn(() => ({ eq: eq2 }));
    const select = vi.fn(() => ({ eq: eq1 }));
    const from = vi.fn(() => ({ select }));
    const res = await fetchAffairesFlashables({ from } as never);
    expect(from).toHaveBeenCalledWith('affaires');
    expect(eq1).toHaveBeenCalledWith('etapes_affaire.etape', 'saisie_pieces');
    expect(eq2).toHaveBeenCalledWith('etapes_affaire.fait', true);
    expect(res).toEqual(rows);
  });
});
