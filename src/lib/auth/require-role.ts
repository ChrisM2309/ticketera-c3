import 'server-only';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { SupabaseClient } from '@supabase/supabase-js';

import { type AppRole, decideAccess, isAppRole, signInUrl } from './access';
import { accessCookieName } from './cookies';
import { createAuthClient, readAuthConfig, readRole, userIdFromAccessToken } from './supabase-auth';

export type SignedInAccount = {
  userId: string;
  role: AppRole;
  /** Cliente con el token del usuario: sus consultas pasan por RLS. */
  client: SupabaseClient;
};

/**
 * Comprueba la sesión y el rol en el servidor antes de renderizar una zona privada.
 * Sin sesión válida redirige a /ingresar/; con otro rol, a su propia zona.
 * El proxy no basta: cada página llama a esta función.
 */
export async function requireRole(required: AppRole, path: string): Promise<SignedInAccount> {
  const config = readAuthConfig();
  const accessToken = (await cookies()).get(accessCookieName)?.value;

  if (!config || !accessToken) {
    redirect(signInUrl({ next: path }));
  }

  const userId = await userIdFromAccessToken(config, accessToken);

  if (!userId) {
    redirect(signInUrl({ next: path, error: 'sesion-expirada' }));
  }

  const role = await readRole(config, accessToken, userId);
  const decision = decideAccess({ required, hasSession: true, role });

  if (decision.action !== 'allow') {
    redirect(decision.action === 'redirect' ? decision.to : signInUrl({ next: path }));
  }

  if (!isAppRole(role)) {
    redirect(signInUrl({ error: 'sin-rol' }));
  }

  return { userId, role, client: createAuthClient(config, accessToken) };
}
