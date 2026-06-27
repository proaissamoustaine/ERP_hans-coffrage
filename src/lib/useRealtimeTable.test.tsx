// src/lib/useRealtimeTable.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const handlers: Record<string, (payload: unknown) => void> = {};
const subscribe = vi.fn(() => ({}));
const on = vi.fn((_evt: string, _filter: unknown, cb: (p: unknown) => void) => {
  handlers.cb = cb;
  return { subscribe, on };
});
const channel = vi.fn(() => ({ on, subscribe }));
const removeChannel = vi.fn();

vi.mock('./supabase', () => ({
  supabase: { channel: () => channel(), removeChannel: () => removeChannel() },
}));

import { useRealtimeTable } from './useRealtimeTable';

beforeEach(() => {
  channel.mockClear();
  on.mockClear();
  removeChannel.mockClear();
});

function wrapper(qc: QueryClient) {
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
}

describe('useRealtimeTable', () => {
  it('abonne la table et invalide les queryKeys à un changement', () => {
    const qc = new QueryClient();
    const spy = vi.spyOn(qc, 'invalidateQueries');
    renderHook(() => useRealtimeTable('heures_flashees', [['heures_flashees']]), { wrapper: wrapper(qc) });
    expect(channel).toHaveBeenCalled();
    expect(on).toHaveBeenCalledWith(
      'postgres_changes',
      expect.objectContaining({ event: '*', schema: 'public', table: 'heures_flashees' }),
      expect.any(Function),
    );
    handlers.cb({});
    expect(spy).toHaveBeenCalledWith({ queryKey: ['heures_flashees'] });
  });

  it('retire le canal au démontage', () => {
    const qc = new QueryClient();
    const { unmount } = renderHook(() => useRealtimeTable('pieces', [['pieces', 'x']]), { wrapper: wrapper(qc) });
    unmount();
    expect(removeChannel).toHaveBeenCalled();
  });
});
