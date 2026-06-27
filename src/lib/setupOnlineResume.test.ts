// src/lib/setupOnlineResume.test.ts
import { describe, it, expect, vi, afterEach } from 'vitest';
import { QueryClient, onlineManager } from '@tanstack/react-query';
import { setupOnlineResume } from './setupOnlineResume';

afterEach(() => onlineManager.setOnline(true));

describe('setupOnlineResume', () => {
  it('rejoue les mutations en file quand le réseau revient', () => {
    const qc = new QueryClient();
    const spy = vi.spyOn(qc, 'resumePausedMutations').mockResolvedValue(undefined);
    const unsub = setupOnlineResume(qc);
    onlineManager.setOnline(false);
    onlineManager.setOnline(true); // retour réseau
    expect(spy).toHaveBeenCalled();
    unsub();
  });

  it('ne rejoue pas tant qu\'on reste hors ligne', () => {
    const qc = new QueryClient();
    const spy = vi.spyOn(qc, 'resumePausedMutations').mockResolvedValue(undefined);
    const unsub = setupOnlineResume(qc);
    onlineManager.setOnline(false);
    expect(spy).not.toHaveBeenCalled();
    unsub();
  });

  it('retourne une fonction de désabonnement', () => {
    const qc = new QueryClient();
    const unsub = setupOnlineResume(qc);
    expect(typeof unsub).toBe('function');
    unsub();
  });
});
