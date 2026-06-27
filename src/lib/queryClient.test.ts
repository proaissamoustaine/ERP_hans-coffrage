// src/lib/queryClient.test.ts
import { describe, it, expect } from 'vitest';
import { queryClient, persister } from './queryClient';

describe('queryClient', () => {
  it('configure un gcTime long (>= 24h) pour la persistance offline', () => {
    const gcTime = queryClient.getDefaultOptions().queries?.gcTime;
    expect(gcTime).toBeGreaterThanOrEqual(1000 * 60 * 60 * 24);
  });
  it('expose un persister avec persistClient/restoreClient', () => {
    expect(typeof persister.persistClient).toBe('function');
    expect(typeof persister.restoreClient).toBe('function');
  });
});
