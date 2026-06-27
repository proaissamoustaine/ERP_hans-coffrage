import { describe, it, expect, vi } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import { upsertFlash, updatePieceFait, registerOfflineMutationDefaults, insertChute, reutiliserChuteDb, insertColis, peserColis } from './offlineMutations';

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

describe('insertChute', () => {
  it('upsert idempotent statut disponible', async () => {
    const upsert = vi.fn().mockResolvedValue({ error: null });
    const from = vi.fn(() => ({ upsert }));
    await insertChute({ from } as never, {
      id: 'c1', matiere_code: 'M', designation: 'D', cat: 'CP', longueur: 1000, largeur: 500,
      epaisseur: 15, prix_unit: 10, unite: '€/U', affaire_origine: 'a', operateur_id: 'u',
    });
    expect(from).toHaveBeenCalledWith('chutes');
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'c1', statut: 'disponible' }),
      { onConflict: 'id', ignoreDuplicates: true },
    );
  });
});

describe('reutiliserChuteDb', () => {
  it('totale : update statut consommee, pas de reste', async () => {
    const eq = vi.fn().mockResolvedValue({ error: null });
    const update = vi.fn(() => ({ eq }));
    const upsert = vi.fn().mockResolvedValue({ error: null });
    const from = vi.fn(() => ({ update, upsert }));
    await reutiliserChuteDb({ from } as never, { id: 'c1', affaireConsoId: 'a2', mode: 'totale', resteJete: false });
    expect(update).toHaveBeenCalledWith(expect.objectContaining({ statut: 'consommee', mode_reutilisation: 'totale' }));
    expect(eq).toHaveBeenCalledWith('id', 'c1');
    expect(upsert).not.toHaveBeenCalled();
  });
  it('partielle + reste exploitable : update reutilisee_partiel + upsert reste', async () => {
    const eq = vi.fn().mockResolvedValue({ error: null });
    const update = vi.fn(() => ({ eq }));
    const upsert = vi.fn().mockResolvedValue({ error: null });
    const from = vi.fn(() => ({ update, upsert }));
    await reutiliserChuteDb({ from } as never, {
      id: 'c1', affaireConsoId: 'a2', mode: 'partielle', resteJete: false,
      reste: { id: 'c2', longueur: 400, largeur: 300 },
      source: { matiere_code: 'M', designation: 'D', cat: 'CP', epaisseur: 15, prix_unit: 10, unite: '€/U', affaire_origine: 'a', operateur_id: 'u' },
    });
    expect(update).toHaveBeenCalledWith(expect.objectContaining({ statut: 'reutilisee_partiel', reste_jete: false }));
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'c2', issu_de: 'c1', statut: 'disponible', longueur: 400 }),
      { onConflict: 'id', ignoreDuplicates: true },
    );
  });
});

describe('insertColis', () => {
  it('upsert colis idempotent + update etape colisage', async () => {
    const upsert = vi.fn().mockResolvedValue({ error: null });
    const eqEtape2 = vi.fn().mockResolvedValue({ error: null });
    const eqEtape1 = vi.fn(() => ({ eq: eqEtape2 }));
    const update = vi.fn(() => ({ eq: eqEtape1 }));
    const from = vi.fn((t: string) => (t === 'colis' ? { upsert } : { update }));
    await insertColis({ from } as never, {
      id: 'k1', affaire_id: 'a', numero: 1, longueur: 100, largeur: 80, hauteur: 50, poids: 430,
    });
    expect(from).toHaveBeenCalledWith('colis');
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'k1', numero: 1 }),
      { onConflict: 'id', ignoreDuplicates: true },
    );
    expect(from).toHaveBeenCalledWith('etapes_affaire');
    expect(update).toHaveBeenCalledWith(expect.objectContaining({ fait: true }));
    expect(eqEtape1).toHaveBeenCalledWith('affaire_id', 'a');
    expect(eqEtape2).toHaveBeenCalledWith('etape', 'colisage');
  });
});

describe('peserColis', () => {
  it('update poids (+ dims si fournies) par id', async () => {
    const eq = vi.fn().mockResolvedValue({ error: null });
    const update = vi.fn(() => ({ eq }));
    const from = vi.fn(() => ({ update }));
    await peserColis({ from } as never, { id: 'k1', poids: 860, longueur: 182 });
    expect(from).toHaveBeenCalledWith('colis');
    expect(update).toHaveBeenCalledWith(expect.objectContaining({ poids: 860, longueur: 182 }));
    expect(eq).toHaveBeenCalledWith('id', 'k1');
  });
});
