import type { Metadata } from 'next';
import Link from 'next/link';

import { buttonVariants } from '@/components/ui/button';
import { deleteBlogPostAction } from '@/features/content/actions';
import { adminHomePath } from '@/lib/auth/access';
import { requireRole } from '@/lib/auth/require-role';
import { cn } from '@/lib/utils';

export const metadata: Metadata = { title: 'Contenido | Administración DEMO', robots: { index: false, follow: false } };

export default async function ContentAdminPage() {
  const account = await requireRole('admin', '/admin/contenido/');
  const posts = await account.client.from('blog_posts').select('id, slug, title, status, updated_at').order('updated_at', { ascending: false });
  const categories = await account.client.from('categories').select('id, name, slug').eq('kind', 'event_type').order('sort_order');
  if (posts.error || categories.error) throw new Error('No pudimos cargar el contenido.');
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-10 sm:px-6">
      <header className="flex flex-col gap-3"><Link href={adminHomePath} className="font-texto text-sm text-texto-suave underline">Volver a administración</Link><h1 className="font-titulo text-3xl font-bold">Contenido</h1><p className="font-texto leading-7 text-texto-suave">Blog y textos editoriales. Todo el contenido es DEMO.</p><Link href="/admin/contenido/blog/nuevo/" className={cn(buttonVariants({ variant: 'compra' }), 'w-fit')}>Nuevo artículo</Link></header>
      <section aria-labelledby="posts-title" className="flex flex-col gap-4"><h2 id="posts-title" className="font-titulo text-xl font-bold">Artículos</h2><ul className="flex flex-col divide-y divide-borde rounded-lg bg-superficie">{(posts.data ?? []).map((post) => <li key={post.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"><div><Link href={`/admin/contenido/blog/${post.id}/`} className="font-semibold underline">{post.title}</Link><p className="font-texto text-sm text-texto-suave">{post.slug} · {post.status}</p></div><form action={deleteBlogPostAction}><input type="hidden" name="id" value={post.id} /><button type="submit" className={buttonVariants({ variant: 'secundario' })}>Eliminar</button></form></li>)}</ul></section>
      <section aria-labelledby="categories-title" className="flex flex-col gap-4"><h2 id="categories-title" className="font-titulo text-xl font-bold">Textos por categoría</h2><ul className="grid gap-3 sm:grid-cols-2">{(categories.data ?? []).map((category) => <li key={category.id}><Link href={`/admin/contenido/categorias/${category.id}/`} className="block rounded-lg bg-superficie p-4 font-semibold underline">{category.name}</Link></li>)}</ul></section>
    </main>
  );
}
