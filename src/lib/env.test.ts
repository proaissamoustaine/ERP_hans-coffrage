import { describe, it, expect } from 'vitest';
import { validateEnv } from './env';

describe('validateEnv', () => {
  it('renvoie la config quand URL et clé sont présentes', () => {
    const cfg = validateEnv({ VITE_SUPABASE_URL: 'https://x.supabase.co', VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_x' });
    expect(cfg).toEqual({ url: 'https://x.supabase.co', key: 'sb_publishable_x' });
  });
  it('jette une erreur explicite si une variable manque', () => {
    expect(() => validateEnv({ VITE_SUPABASE_URL: '', VITE_SUPABASE_PUBLISHABLE_KEY: 'k' })).toThrow(/VITE_SUPABASE_URL/);
    expect(() => validateEnv({ VITE_SUPABASE_URL: 'u', VITE_SUPABASE_PUBLISHABLE_KEY: '' })).toThrow(/VITE_SUPABASE_PUBLISHABLE_KEY/);
  });
});
