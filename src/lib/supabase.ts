import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';
import { getConfig } from './env';

const { url, key } = getConfig();
export const supabase = createClient<Database>(url, key);
