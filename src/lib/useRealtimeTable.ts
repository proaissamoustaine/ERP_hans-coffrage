// src/lib/useRealtimeTable.ts
import { useEffect } from 'react';
import { useQueryClient, type QueryKey } from '@tanstack/react-query';
import { supabase } from './supabase';

/**
 * Abonne une table Postgres via Supabase Realtime et invalide les queryKeys
 * indiquées à chaque changement (INSERT/UPDATE/DELETE).
 * Brique réutilisée pour le flashage live (heures_flashees) et le cochage atelier (pieces).
 */
export function useRealtimeTable(table: string, queryKeys: QueryKey[]) {
  const qc = useQueryClient();
  // Clé de dépendance stable pour le tableau de queryKeys.
  const keysDep = JSON.stringify(queryKeys);
  useEffect(() => {
    const channel = supabase
      .channel(`rt-${table}-${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table }, () => {
        for (const key of queryKeys) qc.invalidateQueries({ queryKey: key });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table, keysDep, qc]);
}
