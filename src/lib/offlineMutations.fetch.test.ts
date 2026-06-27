import { describe, it, expect, vi } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import { upsertFlash, updatePieceFait, registerOfflineMutationDefaults } from './offlineMutations';

describe('upsertFlash', () => {
  it('upsert idempotent sur la PK id (ignoreDuplicates)', async () => {
    const upsert = vi.fn().mockResolvedValue({ error: null });
    const from = vi.fn(() => ({ upsert }));
    await upsertFlash({ from } as never, {
      id: '11111111-1111-1111-1111-111111111111',
      affaire_id: 'a', code_tache: 'CAF', operateur_id: 'u',
      operateur_nom: 'Gilles TUAILLON', duree_min: 12, date: '2026-06-27T10:00:00.000Z',
    });
    expect(from).toHaveBeenCalledWith('heures_flashees');
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({ id: '11111111-1111-1111-1111-111111111111', affaire_id: 'a' }),
      { onConflict: 'id', ignoreDuplicates: true },
    );
  });
});

describe('updatePieceFait', () => {
  it('met fait/fait_par/fait_date quand fait=true', async () => {
    const eq = vi.fn().mockResolvedValue({ error: null });
    const update = vi.fn(() => ({ eq }));
    const from = vi.fn(() => ({ update }));
    await updatePieceFait({ from } as never, { id: 'p1', fait: true, faitPar: 'Gilles TUAILLON' });
    expect(from).toHaveBeenCalledWith('pieces');
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ fait: true, fait_par: 'Gilles TUAILLON' }),
    );
    expect(eq).toHaveBeenCalledWith('id', 'p1');
  });
  it('remet à null quand fait=false', async () => {
    const eq = vi.fn().mockResolvedValue({ error: null });
    const update = vi.fn(() => ({ eq }));
    const from = vi.fn(() => ({ update }));
    await updatePieceFait({ from } as never, { id: 'p1', fait: false, faitPar: 'X' });
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ fait: false, fait_par: null, fait_date: null }),
    );
  });
});

describe('registerOfflineMutationDefaults', () => {
  it('enregistre les defaults pour flasher-heures et cocher-piece', () => {
    const qc = new QueryClient();
    registerOfflineMutationDefaults(qc);
    expect(qc.getMutationDefaults(['flasher-heures']).mutationFn).toBeInstanceOf(Function);
    expect(qc.getMutationDefaults(['cocher-piece']).mutationFn).toBeInstanceOf(Function);
  });
});
