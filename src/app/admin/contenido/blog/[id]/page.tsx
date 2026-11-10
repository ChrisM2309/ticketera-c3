import type { Metadata } from 'next';
import Link from 'next/link';

import { ContentEditor } from '@/components/admin/content-editor';
import { requireRole } from '@/lib/auth/require-role';

export const metadata: Metadata = { title: 'Editar artículo | Administración DEMO', robots: { index: false, follow: false } };

export default async function EditBlogPostPage({ params }: { params: Promise<{ id: string }> }) {
  const account = await requireRole('admin', '/admin/contenido/');
  const { id } = await params;
  const result = await account.client.from('blog_posts').select('id, title, slug, description, body_md, keyword, topic, related_type_slugs').eq('id', id).maybeSingle();
  if (result.error || !result.data) return <main className="mx-auto max-w-4xl px-4 py-10"><p>No encontramos el artículo.</p></main>;
  const post = result.data;
  return <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6"><Link href="/admin/contenido/" className="font-texto text-sm text-texto-suave underline">Volver a contenido</Link><h1 className="font-titulo text-3xl font-bold">Editar artículo</h1><ContentEditor id={post.id} defaults={{ title: post.title, slug: post.slug, description: post.description, bodyMd: post.body_md, keyword: post.keyword ?? '', topic: post.topic }} relatedTypeSlugs={post.related_type_slugs ?? []} /></main>;
}
