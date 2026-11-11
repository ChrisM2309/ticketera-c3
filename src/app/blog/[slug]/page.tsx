import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { Breadcrumbs } from '@/components/catalog/breadcrumbs';
import { MarkdownView, parseMarkdown } from '@/lib/content/markdown';
import { getPublishedPost } from '@/features/content/queries';
import { publicImagePath } from '@/features/catalog/images';
import { getSiteSettings } from '@/features/settings/settings';
import { articleJsonLd } from '@/lib/seo/jsonld';
import { buildPageMetadata } from '@/lib/seo/metadata';
import { siteConfig } from '@/lib/site-config';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublishedPost(slug);
  if (!post) return {};
  const settings = await getSiteSettings();
  return buildPageMetadata({ title: post.title, description: post.description, path: `/blog/${post.slug}/`, indexable: true, indexingEnabled: settings.indexingEnabled, type: 'article' }, siteConfig.siteUrl);
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [post, settings] = await Promise.all([getPublishedPost(slug), getSiteSettings()]);
  if (!post) notFound();
  const imagePath = publicImagePath(post.coverImagePath) ?? '/images/stock/stock-salon-evento-01.jpg';
  const publishedDate = new Intl.DateTimeFormat('es-SV', { dateStyle: 'long' }).format(new Date(post.publishedAt));
  return <main className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 py-10 sm:px-6"><Breadcrumbs items={[{ label: 'Ticketera C3', href: '/' }, { label: 'Blog', href: '/blog/' }, { label: post.title }]} indexingEnabled={settings.indexingEnabled} /><article className="flex flex-col gap-6"><div className="relative aspect-[16/7] overflow-hidden rounded-lg bg-navy shadow-sm"><Image src={imagePath} alt={`Portada: ${post.title}`} fill sizes="(max-width: 896px) 100vw, 896px" className="object-cover" priority /></div><header className="flex flex-col gap-3"><div className="flex flex-wrap items-center gap-3"><span className="font-texto text-xs font-semibold uppercase tracking-etiqueta text-texto-suave">{post.topic}</span>{post.keyword ? <span className="rounded-full bg-superficie px-3 py-1 font-texto text-xs font-medium text-accion shadow-sm">Palabra clave SEO: {post.keyword}</span> : null}</div><h1 className="font-titulo text-4xl font-bold">{post.title}</h1><p className="font-texto text-lg leading-7 text-texto-suave">{post.description}</p><p className="font-texto text-sm text-texto-suave">Por <span className="font-semibold text-texto">{post.authorName ?? 'Equipo editorial DEMO'}</span> · {publishedDate}</p></header>{settings.indexingEnabled ? <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd({ title: post.title, description: post.description, path: `/blog/${post.slug}/`, publishedAt: post.publishedAt, updatedAt: post.publishedAt, author: post.authorName, image: imagePath }, siteConfig.siteUrl)).replace(/</g, '\\u003c') }} /> : null}<MarkdownView blocks={parseMarkdown(post.bodyMd)} />{post.relatedTypes.length ? <section aria-labelledby="related-events" className="flex flex-col gap-3 border-t border-borde pt-6"><h2 id="related-events" className="font-titulo text-xl font-bold">Eventos relacionados</h2><div className="flex flex-wrap gap-3">{post.relatedTypes.map((type) => <Link key={type.slug} href={type.path} className="underline">{type.name}</Link>)}</div></section> : null}</article></main>;
}
