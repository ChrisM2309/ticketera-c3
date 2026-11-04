import { randomUUID } from 'node:crypto';

import type { PGlite } from '@electric-sql/pglite';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import {
  asRole,
  asSuperuser,
  createDatabase,
  createEvent,
  createOrganizer,
  createUser,
} from './helpers';

/**
 * Autenticación y roles: quién puede leer y escribir qué, según la sesión que llega a PostgREST.
 * Complementa rls.test.ts con los casos de sesión, rol y revisión de eventos.
 */

let db: PGlite;

beforeAll(async () => {
  db = await createDatabase();
}, 60_000);

afterAll(async () => {
  await db.close();
});

async function slugsVisibleTo(role: 'anon' | 'authenticated', userId: string | undefined, slugs: string[]) {
  await asRole(db, role, userId);
  const result = await db.query<{ slug: string }>(`select slug from public.events where slug = any($1)`, [slugs]);
  await asSuperuser(db);

  return result.rows.map((row) => row.slug);
}

describe('organizador: solo sus eventos', () => {
  it('no ve, no edita y no borra eventos pendientes de otro organizador', async () => {
    await asSuperuser(db);
    const ownerA = await createUser(db);
    const orgA = await createOrganizer(db, ownerA, 'auth-org-a');
    await createEvent(db, orgA, { slug: 'auth-pendiente-a', status: 'pending' });
    const ownerB = await createUser(db);

    await asRole(db, 'authenticated', ownerB);
    const visible = await db.query(`select id from public.events where slug = 'auth-pendiente-a'`);
    const editado = await db.query(`update public.events set title = 'Cambio ajeno' where slug = 'auth-pendiente-a'`);
    const borrado = await db.query(`delete from public.events where slug = 'auth-pendiente-a'`);
    await asSuperuser(db);

    const titulo = await db.query<{ title: string }>(
      `select title from public.events where slug = 'auth-pendiente-a'`,
    );
    expect(visible.rows).toHaveLength(0);
    expect(editado.affectedRows).toBe(0);
    expect(borrado.affectedRows).toBe(0);
    expect(titulo.rows[0].title).toBe('Evento de prueba');
  });

  it('no puede mover un evento propio a un organizador ajeno', async () => {
    await asSuperuser(db);
    const ownerA = await createUser(db);
    const orgA = await createOrganizer(db, ownerA, 'auth-org-mover-a');
    await createEvent(db, orgA, { slug: 'auth-mover-evento', status: 'draft' });
    const ownerB = await createUser(db);
    const orgB = await createOrganizer(db, ownerB, 'auth-org-mover-b');

    await asRole(db, 'authenticated', ownerA);
    await expect(
      db.query(`update public.events set organizer_id = $1 where slug = 'auth-mover-evento'`, [orgB]),
    ).rejects.toThrow(/row-level security/);
    await asSuperuser(db);
  });

  it('no puede cambiar su organizador ni asignarse otro propietario', async () => {
    await asSuperuser(db);
    const owner = await createUser(db);
    const organizer = await createOrganizer(db, owner, 'auth-org-propio');
    const intruso = await createUser(db);

    await asRole(db, 'authenticated', owner);
    const nombre = await db.query(`update public.organizers set name = 'Nombre nuevo' where id = $1`, [organizer]);
    const propietario = await db.query(`update public.organizers set owner_user_id = $1 where id = $2`, [
      intruso,
      organizer,
    ]);
    await asSuperuser(db);

    const fila = await db.query<{ owner_user_id: string; name: string }>(
      `select owner_user_id, name from public.organizers where id = $1`,
      [organizer],
    );
    expect(nombre.affectedRows).toBe(0);
    expect(propietario.affectedRows).toBe(0);
    expect(fila.rows[0]).toEqual({ owner_user_id: owner, name: 'Fixture organizador' });
  });

  it('no puede crear organizadores nuevos', async () => {
    await asSuperuser(db);
    const owner = await createUser(db);

    await asRole(db, 'authenticated', owner);
    await expect(
      db.query(`insert into public.organizers (owner_user_id, name, slug) values ($1, 'Sin permiso', 'auth-sin-permiso')`, [
        owner,
      ]),
    ).rejects.toThrow(/row-level security/);
    await asSuperuser(db);
  });

  it('solo ve su propio perfil', async () => {
    await asSuperuser(db);
    const owner = await createUser(db);
    const admin = await createUser(db, 'admin');

    await asRole(db, 'authenticated', owner);
    const propio = await db.query<{ id: string }>(`select id from public.profiles where id = $1`, [owner]);
    const ajeno = await db.query<{ id: string }>(`select id from public.profiles where id = $1`, [admin]);
    await asSuperuser(db);

    expect(propio.rows).toHaveLength(1);
    expect(ajeno.rows).toHaveLength(0);
  });
});

describe('usuario que intenta subir de rol', () => {
  it('no puede crear su propio perfil con rol admin', async () => {
    await asSuperuser(db);
    const usuario = randomUUID();
    await db.query('insert into auth.users (id, email) values ($1, $2)', [usuario, `${usuario}@example.test`]);

    await asRole(db, 'authenticated', usuario);
    await expect(
      db.query(`insert into public.profiles (id, role) values (auth.uid(), 'admin')`),
    ).rejects.toThrow(/permission denied/);
    await asSuperuser(db);

    const perfiles = await db.query(`select id from public.profiles where id = $1`, [usuario]);
    expect(perfiles.rows).toHaveLength(0);
  });

  it('no puede crear un perfil para otra cuenta', async () => {
    await asSuperuser(db);
    const usuario = await createUser(db);
    const victima = randomUUID();
    await db.query('insert into auth.users (id, email) values ($1, $2)', [victima, `${victima}@example.test`]);

    await asRole(db, 'authenticated', usuario);
    await expect(
      db.query(`insert into public.profiles (id, role) values ($1, 'admin')`, [victima]),
    ).rejects.toThrow(/permission denied/);
    await asSuperuser(db);
  });

  it('no puede cambiar el rol de nadie, ni siquiera el propio', async () => {
    await asSuperuser(db);
    const usuario = await createUser(db);

    await asRole(db, 'authenticated', usuario);
    await expect(db.query(`update public.profiles set role = 'admin' where id = auth.uid()`)).rejects.toThrow(
      /permission denied/,
    );
    await asSuperuser(db);

    const rol = await db.query<{ role: string }>(`select role from public.profiles where id = $1`, [usuario]);
    expect(rol.rows[0].role).toBe('organizer');
  });

  it('no puede ejecutar las funciones de rol como anónimo', async () => {
    await asRole(db, 'anon');
    await expect(db.query(`select public.is_admin()`)).rejects.toThrow(/permission denied/);
    await asSuperuser(db);
  });
});

describe('sesión sin perfil', () => {
  it('un usuario autenticado sin perfil no es admin ni ve borradores ajenos', async () => {
    await asSuperuser(db);
    const owner = await createUser(db);
    const organizer = await createOrganizer(db, owner, 'auth-org-sin-perfil');
    await createEvent(db, organizer, { slug: 'auth-borrador-sin-perfil', status: 'draft' });
    const sinPerfil = randomUUID();
    await db.query('insert into auth.users (id, email) values ($1, $2)', [sinPerfil, `${sinPerfil}@example.test`]);

    await asRole(db, 'authenticated', sinPerfil);
    const admin = await db.query<{ es_admin: boolean }>(`select public.is_admin() as es_admin`);
    await asSuperuser(db);

    expect(admin.rows[0].es_admin).toBe(false);
    expect(await slugsVisibleTo('authenticated', sinPerfil, ['auth-borrador-sin-perfil'])).toEqual([]);
  });

  it('is_admin distingue a un admin de un organizador', async () => {
    await asSuperuser(db);
    const owner = await createUser(db);
    const admin = await createUser(db, 'admin');

    await asRole(db, 'authenticated', owner);
    const comoOrganizador = await db.query<{ es_admin: boolean }>(`select public.is_admin() as es_admin`);
    await asRole(db, 'authenticated', admin);
    const comoAdmin = await db.query<{ es_admin: boolean }>(`select public.is_admin() as es_admin`);
    await asSuperuser(db);

    expect(comoOrganizador.rows[0].es_admin).toBe(false);
    expect(comoAdmin.rows[0].es_admin).toBe(true);
  });
});

describe('anónimo y revisión de eventos', () => {
  it('no ve eventos pendientes ni borradores', async () => {
    await asSuperuser(db);
    const owner = await createUser(db);
    const organizer = await createOrganizer(db, owner, 'auth-org-anon');
    await createEvent(db, organizer, { slug: 'auth-anon-pendiente', status: 'pending' });
    await createEvent(db, organizer, { slug: 'auth-anon-rechazado', status: 'rejected' });

    const visibles = await slugsVisibleTo('anon', undefined, [
      'auth-anon-pendiente',
      'auth-anon-rechazado',
    ]);

    expect(visibles).toEqual([]);
  });

  it('el administrador ve y puede rechazar eventos pendientes ajenos', async () => {
    await asSuperuser(db);
    const owner = await createUser(db);
    const organizer = await createOrganizer(db, owner, 'auth-org-revision');
    await createEvent(db, organizer, { slug: 'auth-revision-admin', status: 'pending' });
    const admin = await createUser(db, 'admin');

    await asRole(db, 'authenticated', admin);
    const pendientes = await db.query<{ n: number }>(
      `select count(*)::int as n from public.events where status = 'pending' and slug = 'auth-revision-admin'`,
    );
    const rechazo = await db.query(
      `update public.events set status = 'rejected' where slug = 'auth-revision-admin'`,
    );
    await asSuperuser(db);

    expect(pendientes.rows[0].n).toBe(1);
    expect(rechazo.affectedRows).toBe(1);
  });

  it('el organizador no puede publicar su propio evento pendiente', async () => {
    await asSuperuser(db);
    const owner = await createUser(db);
    const organizer = await createOrganizer(db, owner, 'auth-org-publicar');
    await createEvent(db, organizer, { slug: 'auth-publicar-propio', status: 'pending' });

    await asRole(db, 'authenticated', owner);
    await expect(
      db.query(`update public.events set status = 'published' where slug = 'auth-publicar-propio'`),
    ).rejects.toThrow(/row-level security/);
    await asSuperuser(db);
  });
});
