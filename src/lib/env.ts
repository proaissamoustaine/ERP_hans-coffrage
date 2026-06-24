type RawEnv = { VITE_SUPABASE_URL?: string; VITE_SUPABASE_PUBLISHABLE_KEY?: string };

export function validateEnv(env: RawEnv) {
  const url = env.VITE_SUPABASE_URL;
  const key = env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url) throw new Error('Config manquante : VITE_SUPABASE_URL');
  if (!key) throw new Error('Config manquante : VITE_SUPABASE_PUBLISHABLE_KEY');
  return { url, key };
}

export function getConfig() {
  return validateEnv(import.meta.env as unknown as RawEnv);
}
