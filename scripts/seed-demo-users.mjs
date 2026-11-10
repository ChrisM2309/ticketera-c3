#!/usr/bin/env node
/**
 * Crea o actualiza las cuentas DEMO del proyecto en Supabase Auth:
 *   comprador@demo.c3  (rol organizer por defecto; compra como invitado)
 *   admin@demo.c3      (rol admin)
 *   empresa@demo.c3    (rol organizer; ya es dueña de «Organizador DEMO Uno»)
 *   cliente@demo.c3    (rol buyer; cuenta compradora para probar /mis-boletos/ y /cuenta/)
 *
 * Las cuentas de organizadores reales no se crean aquí: el administrador las vincula desde
 * /admin/organizadores/ (función admin_link_organizer) y no se guarda ninguna contraseña en el repositorio.
 *
 * Seguridad:
 * - Sin --apply no escribe nada: solo lee el estado actual.
 * - Las contraseñas se piden por teclado, sin mostrarse, y no se guardan ni se imprimen.
 *   La cuenta compradora lee la suya de la variable de entorno DEMO_BUYER_PASSWORD (la misma que usa el E2E
 *   de cuenta); si no está definida, esa cuenta se omite y las demás se procesan igual.
 * - La clave de servicio sale de .env.local (nunca se imprime).
 * - La URL debe ser https, salvo localhost para Supabase local.
 * - Tras escribir, entra con cada cuenta para comprobar la contraseña (sin imprimir tokens).
 *
 * Uso (desde la carpeta ticketera-c3):
 *   node --env-file=.env.local scripts/seed-demo-users.mjs            # solo revisa
 *   node --env-file=.env.local scripts/seed-demo-users.mjs --apply    # crea o actualiza
 */

import readline from 'node:readline/promises';
import { Writable } from 'node:stream';
import { stdin, stdout } from 'node:process';
import { pathToFileURL } from 'node:url';

const minPasswordLength = 12;

const accounts = [
  { email: 'comprador@demo.c3', role: 'organizer', displayName: 'Comprador DEMO' },
  { email: 'admin@demo.c3', role: 'admin', displayName: 'Administración DEMO' },
  { email: 'empresa@demo.c3', role: 'organizer', displayName: 'Empresa DEMO' },
  { email: 'cliente@demo.c3', role: 'buyer', displayName: 'Cliente DEMO', passwordEnv: 'DEMO_BUYER_PASSWORD' },
];

const localHosts = new Set(['localhost', '127.0.0.1', '[::1]']);

function fail(message) {
  console.error(`\n✖ ${message}`);
  process.exit(1);
}

/** Exige https; solo se permite http hacia localhost (Supabase local). */
export function requireSecureUrl(rawUrl) {
  let parsed;

  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL no es una URL válida.');
  }

  if (parsed.protocol !== 'https:' && !(parsed.protocol === 'http:' && localHosts.has(parsed.hostname))) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL debe usar https. Solo se permite http hacia localhost.');
  }

  return parsed;
}

/**
 * Lee una línea sin mostrarla. El eco de readline pasa por un flujo de salida propio que descarta
 * todo mientras está silenciado; así no depende de métodos internos de readline.
 */
export async function readPassword(prompt, { input = stdin, output = stdout } = {}) {
  const state = { muted: false };
  const guardedOutput = new Writable({
    write(chunk, encoding, callback) {
      if (!state.muted) {
        output.write(chunk, encoding);
      }
      callback();
    },
  });
  // readline consulta estas propiedades para decidir cómo dibujar la línea.
  guardedOutput.isTTY = output.isTTY;
  guardedOutput.columns = output.columns;

  const rl = readline.createInterface({ input, output: guardedOutput, terminal: true });

  output.write(prompt);
  state.muted = true;

  try {
    return await rl.question('');
  } finally {
    state.muted = false;
    output.write('\n');
    rl.close();
  }
}

async function readPasswords() {
  const passwords = {};

  for (const account of accounts) {
    // Las cuentas con `passwordEnv` leen la contraseña del entorno y nunca la piden ni la imprimen.
    if (account.passwordEnv) {
      const fromEnv = process.env[account.passwordEnv] ?? '';

      if (fromEnv === '') {
        console.log(`Se omite ${account.email}: define ${account.passwordEnv} para crearla.`);
        continue;
      }

      if (fromEnv.length < minPasswordLength) {
        fail(`La variable ${account.passwordEnv} tiene menos de ${minPasswordLength} caracteres. No se escribió nada.`);
      }

      passwords[account.email] = fromEnv;
      continue;
    }

    const value = await readPassword(`Contraseña para ${account.email} (mínimo ${minPasswordLength} caracteres): `);

    if (value.length < minPasswordLength) {
      fail(`La contraseña de ${account.email} tiene menos de ${minPasswordLength} caracteres. No se escribió nada.`);
    }

    passwords[account.email] = value;
  }

  return passwords;
}

async function listAuthUsers({ supabaseUrl, adminHeaders }) {
  const users = [];

  for (let page = 1; page < 50; page += 1) {
    const response = await fetch(`${supabaseUrl}/auth/v1/admin/users?page=${page}&per_page=200`, {
      headers: adminHeaders,
    });

    if (!response.ok) {
      fail(`No pudimos listar las cuentas de Auth (HTTP ${response.status}).`);
    }

    const body = await response.json();
    const batch = body.users ?? [];
    users.push(...batch);

    if (batch.length < 200) {
      break;
    }
  }

  return users;
}

async function createOrUpdateAuthUser({ supabaseUrl, adminHeaders }, account, password, existing) {
  if (existing) {
    const response = await fetch(`${supabaseUrl}/auth/v1/admin/users/${existing.id}`, {
      method: 'PUT',
      headers: adminHeaders,
      body: JSON.stringify({ password, email_confirm: true }),
    });

    if (!response.ok) {
      fail(`No pudimos actualizar ${account.email} (HTTP ${response.status}).`);
    }

    return existing.id;
  }

  const response = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({ email: account.email, password, email_confirm: true }),
  });

  if (!response.ok) {
    fail(`No pudimos crear ${account.email} (HTTP ${response.status}).`);
  }

  const created = await response.json();
  return created.id;
}

async function upsertProfile({ supabaseUrl, adminHeaders }, account, userId) {
  const response = await fetch(`${supabaseUrl}/rest/v1/profiles?on_conflict=id`, {
    method: 'POST',
    headers: { ...adminHeaders, prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify([{ id: userId, role: account.role, display_name: account.displayName }]),
  });

  if (!response.ok) {
    fail(`No pudimos guardar el perfil de ${account.email} (HTTP ${response.status}).`);
  }
}

async function checkSignIn({ supabaseUrl, anonKey }, email, password) {
  const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: anonKey, 'content-type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  // Solo interesa si entró; el token no se muestra ni se guarda.
  return response.ok;
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
  const context = { supabaseUrl, adminHeaders, anonKey };

  console.log(`Proyecto: ${target.host}`);
  console.log(apply ? 'Modo: APLICAR (escribe en Auth y en profiles)' : 'Modo: revisión (no escribe nada)');

  const authUsers = await listAuthUsers(context);
  const byEmail = new Map(authUsers.map((user) => [user.email?.toLowerCase(), user]));

  console.log('\nEstado actual:');
  for (const account of accounts) {
    const existing = byEmail.get(account.email);
    console.log(`  ${account.email}: ${existing ? `existe (id ${existing.id})` : 'no existe'} → rol ${account.role}`);
  }

  if (!apply) {
    console.log('\nNo se escribió nada. Para crear o actualizar las cuentas, ejecuta el mismo comando con --apply.');
    return;
  }

  const passwords = await readPasswords();

  for (const account of accounts) {
    if (!(account.email in passwords)) {
      continue;
    }

    const existing = byEmail.get(account.email);
    const userId = await createOrUpdateAuthUser(context, account, passwords[account.email], existing);
    await upsertProfile(context, account, userId);
    console.log(`✔ ${account.email}: ${existing ? 'contraseña actualizada' : 'creada'}, rol ${account.role}`);
  }

  console.log('\nComprobación de inicio de sesión:');
  let allOk = true;
  for (const account of accounts) {
    if (!(account.email in passwords)) {
      continue;
    }

    const ok = await checkSignIn(context, account.email, passwords[account.email]);
    allOk = allOk && ok;
    console.log(`  ${account.email}: ${ok ? 'entra' : 'NO entra'}`);
  }

  if (!allOk) {
    fail('Alguna cuenta no entró. Revisa la contraseña y vuelve a ejecutar con --apply.');
  }
}

// Solo corre al ejecutarse directamente; las pruebas importan readPassword sin efectos.
const isEntryPoint = process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isEntryPoint) {
  main().catch((error) => {
    console.error(`\n✖ ${error.message}`);
    process.exit(1);
  });
}
