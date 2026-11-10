import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { PGlite } from '@electric-sql/pglite';

import { asRole, asSuperuser, createDatabase, createUser } from './helpers';

let db: PGlite;
beforeEach(async () => { db = await createDatabase(); }, 60_000);
afterEach(async () => { await db.close(); });

const description = 'Una descripción suficientemente larga para cumplir el mínimo de publicación editorial DEMO.';
const body = 'Contenido editorial de demostración. '.repeat(8);

async function savePost(user: string, overrides: Record<string, unknown> = {}) {
  const data = { slug: 'guia-eventos-demo', title: 'Guía de eventos DEMO', description, body_md: body, keyword: 'eventos tecnológicos', topic: 'eventos', related: ['congresos'], status: 'draft', ...overrides };
  await asRole(db, 'authenticated', user);
  return db.query<{ id: string }>(`select public.admin_save_blog_post(null, $1, $2, $3, $4, $5, $6, $7, $8) as id`, [data.slug, data.title, data.description, data.body_md, data.keyword, data.topic, data.related, data.status]);
}

describe('contenido editorial', () => {
  it('anon lee solo los publicados', async () => {
    const admin = await createUser(db, 'admin');
    await savePost(admin, { status: 'published' });
    await asRole(db, 'anon');
    const publicRows = await db.query(`select slug from public.blog_posts`);
    expect(publicRows.rows).toEqual([{ slug: 'guia-eventos-demo' }]);
    await asSuperuser(db);
    await db.query(`insert into public.blog_posts (slug, title, description, body_md, topic, status) values ('borrador', 'Borrador demo', $1, $2, 'eventos', 'draft')`, [description, body]);
    await asRole(db, 'anon');
    const visible = await db.query(`select slug from public.blog_posts order by slug`);
    expect(visible.rows).toEqual([{ slug: 'guia-eventos-demo' }]);
  });

  it('solo el administrador guarda', async () => {
    const organizer = await createUser(db, 'organizer');
    await expect(savePost(organizer)).rejects.toThrow(/administrador/i);
  });

  it('publicar exige palabra clave y 200 caracteres', async () => {
    const admin = await createUser(db, 'admin');
    await expect(savePost(admin, { status: 'published', keyword: null, body_md: 'corto' })).rejects.toThrow(/public|palabra|200/i);
  });

  it('slug inválido se rechaza', async () => {
    const admin = await createUser(db, 'admin');
    await expect(savePost(admin, { slug: 'No válido' })).rejects.toThrow(/slug/i);
  });

  it('título de más de 70 se rechaza', async () => {
    const admin = await createUser(db, 'admin');
    await expect(savePost(admin, { title: 'a'.repeat(71) })).rejects.toThrow(/título/i);
  });

  it('un tipo relacionado inexistente se rechaza', async () => {
    const admin = await createUser(db, 'admin');
    await expect(savePost(admin, { related: ['no-existe'] })).rejects.toThrow(/relacionado|tipo/i);
  });

  it('FAQ con más de 8 preguntas se rechaza', async () => {
    const admin = await createUser(db, 'admin');
    const category = await db.query<{ id: string }>(`select id from public.categories where kind = 'event_type' limit 1`);
    await asRole(db, 'authenticated', admin);
    const faq = Array.from({ length: 9 }, () => ({ q: 'Pregunta válida', a: 'Respuesta válida suficientemente larga.' }));
    await expect(db.query(`select public.admin_save_editorial_page($1, 'Texto editorial', $2::jsonb, 'draft')`, [category.rows[0].id, JSON.stringify(faq)])).rejects.toThrow(/8|faq|pregunta/i);
  });
});
