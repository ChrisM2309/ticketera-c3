#!/usr/bin/env node
/**
 * Cambia solo la contraseña de admin@demo.c3 en Supabase Auth. No toca las otras cuentas ni sus perfiles.
 *
 * - Sin --apply solo revisa la cuenta y su rol.
 * - Con --apply pide la contraseña dos veces, por teclado y sin mostrarla, y la escribe.
 * - Después entra con esa cuenta para comprobar la contraseña (sin imprimir tokens).
 *
 * Uso (desde la carpeta ticketera-c3):
 *   node --env-file=.env.local scripts/set-admin-password.mjs            # solo revisa
 *   node --env-file=.env.local scripts/set-admin-password.mjs --apply    # cambia la contraseña
 */

import { pathToFileURL } from 'node:url';

import { readPassword, requireSecureUrl } from './seed-demo-users.mjs';

const adminEmail = 'admin@demo.c3';
const minPasswordLength = 12;

function fail(message) {
  console.error(`\n✖ ${message}`);
  process.exit(1);
}

async function findAdminUser({ supabaseUrl, adminHeaders }) {
  for (let page = 1; page < 50; page += 1) {
    const response = await fetch(`${supabaseUrl}/auth/v1/admin/users?page=${page}&per_page=200`, {
      headers: adminHeaders,
    });

    if (!response.ok) {
      fail(`No pudimos listar las cuentas de Auth (HTTP ${response.status}).`);
    }

    const body = await response.json();
    const batch = body.users ?? [];
    const found = batch.find((user) => user.email?.toLowerCase() === adminEmail);

    if (found) {
      return found;
    }

    if (batch.length < 200) {
      break;
    }
  }

  return null;
}

async function adminRole({ supabaseUrl, adminHeaders }, userId) {
  const response = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${userId}&select=role`, {
    headers: adminHeaders,
  });

  if (!response.ok) {
    fail(`No pudimos leer el perfil de ${adminEmail} (HTTP ${response.status}).`);
  }

  const rows = await response.json();
  return rows[0]?.role ?? null;
}

async function readNewPassword() {
  const first = await readPassword(`Nueva contraseña para ${adminEmail} (mínimo ${minPasswordLength} caracteres): `);

  if (first.length < minPasswordLength) {
    fail(`La contraseña tiene menos de ${minPasswordLength} caracteres. No se cambió nada.`);
  }

  const second = await readPassword('Repite la contraseña: ');

  if (first !== second) {
    fail('Las dos contraseñas no coinciden. No se cambió nada.');
  }

  return first;
}

async function main() {
  const apply = process.argv.includes('--apply');
  const rawUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').replace(/\/$/, '');
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

  if (!rawUrl || !serviceKey || !anonKey) {
    fail('Faltan NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY o SUPABASE_SERVICE_ROLE_KEY. Ejecuta con --env-file=.env.local.');
  }

  let target;

  try {
    target = requireSecureUrl(rawUrl);
  } catch (error) {
    fail(error.message);
  }

  const supabaseUrl = target.origin;
  const adminHeaders = {
    apikey: serviceKey,
    authorization: `Bearer ${serviceKey}`,
    'content-type': 'application/json',
  };
  const context = { supabaseUrl, adminHeaders };

  console.log(`Proyecto: ${target.host}`);
  console.log(apply ? 'Modo: APLICAR (cambia la contraseña de admin@demo.c3)' : 'Modo: revisión (no escribe nada)');

  const user = await findAdminUser(context);

  if (!user) {
    fail(`No existe ${adminEmail} en Auth. Usa seed-demo-users.mjs para crearla.`);
  }

  const role = await adminRole(context, user.id);
  console.log(`\n${adminEmail}: existe, rol ${role ?? 'sin perfil'}`);

  if (!apply) {
    console.log('\nNo se cambió nada. Para cambiar la contraseña, ejecuta el mismo comando con --apply.');
    return;
  }

  const password = await readNewPassword();

  const response = await fetch(`${supabaseUrl}/auth/v1/admin/users/${user.id}`, {
    method: 'PUT',
    headers: adminHeaders,
    body: JSON.stringify({ password, email_confirm: true }),
  });

  if (!response.ok) {
    fail(`No pudimos cambiar la contraseña de ${adminEmail} (HTTP ${response.status}).`);
  }

  console.log(`✔ Contraseña de ${adminEmail} actualizada.`);

  const signIn = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: anonKey, 'content-type': 'application/json' },
    body: JSON.stringify({ email: adminEmail, password }),
  });

  // Solo interesa si entró; el token no se muestra ni se guarda.
  console.log(`  ${adminEmail}: ${signIn.ok ? 'entra' : 'NO entra'}`);

  if (!signIn.ok) {
    fail('La cuenta no entró con la contraseña nueva. Vuelve a ejecutar con --apply.');
  }
}

// Solo corre al ejecutarse directamente.
const isEntryPoint = process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isEntryPoint) {
  main().catch((error) => {
    console.error(`\n✖ ${error.message}`);
    process.exit(1);
  });
}
