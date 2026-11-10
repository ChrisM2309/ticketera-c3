import type { Metadata } from 'next';
import Link from 'next/link';

import { PostCard } from '@/components/content/post-card';
import { getSiteSettings } from '@/features/settings/settings';
import { listPublishedPosts } from '@/features/content/queries';
import { buildPageMetadata } from '@/lib/seo/metadata';
import { siteConfig } from '@/lib/site-config';

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return buildPageMetadata({ title: 'Blog de eventos tecnológicos', description: 'Artículos DEMO sobre eventos, cultura tecnológica y fechas mixtas.', path: '/blog/', indexable: true, indexingEnabled: settings.indexingEnabled }, siteConfig.siteUrl);
}

export default async function BlogPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const raw = Array.isArray(params.page) ? params.page[0] : params.page;
  const page = Number.parseInt(raw ?? '1', 10) || 1;
  const result = await listPublishedPosts(page);
  return <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6"><header className="flex flex-col gap-3"><h1 className="font-titulo text-4xl font-bold">Blog de Ticketera C3</h1><p className="font-texto text-lg leading-7 text-texto-suave">Contenido DEMO sobre eventos, cultura y fechas mixtas.</p></header>{result.posts.length ? <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{result.posts.map((post) => <PostCard key={post.slug} post={post} />)}</div> : <p className="rounded-lg bg-superficie p-6 font-texto text-texto-suave">Todavía no hay artículos publicados.</p>}{result.total > 10 ? <nav aria-label="Paginación del blog" className="flex gap-3">{page > 1 ? <Link href={`/blog/?page=${page - 1}`} className="underline">Anterior</Link> : null}{page * 10 < result.total ? <Link href={`/blog/?page=${page + 1}`} className="underline">Siguiente</Link> : null}</nav> : null}</main>;
}
