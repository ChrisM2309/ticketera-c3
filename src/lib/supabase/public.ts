import { createClient } from '@supabase/supabase-js';

/**
 * Cliente de solo lectura pública con la clave anon/publishable.
 * Nunca usa service_role. Devuelve null si faltan las variables de entorno.
 */
export function createPublicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return null;
  }

  return createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
