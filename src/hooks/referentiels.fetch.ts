import type { SupabaseClient } from '@supabase/supabase-js';

export async function fetchTable(sb: SupabaseClient, table: string) {
  const { data, error } = await sb.from(table).select('*');
  if (error) throw new Error(error.message);
  return data ?? [];
}
