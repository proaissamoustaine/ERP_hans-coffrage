// src/lib/queryClient.ts
import { QueryClient } from '@tanstack/react-query';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';

/** Durée de conservation du cache : doit couvrir la durée de persistance offline. */
const GC_TIME = 1000 * 60 * 60 * 24; // 24 h

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { gcTime: GC_TIME },
  },
});

export const persister = createSyncStoragePersister({
  storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  key: 'hans-erp-rq',
});
