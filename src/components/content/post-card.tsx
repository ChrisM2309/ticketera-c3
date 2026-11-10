import Link from 'next/link';

import type { BlogPostSummary } from '@/features/content/queries';

export function PostCard({ post }: { post: BlogPostSummary }) {
  return <article className="flex flex-col gap-3 rounded-lg bg-superficie p-5"><span className="font-texto text-xs font-semibold uppercase tracking-etiqueta text-texto-suave">{post.topic}</span><h2 className="font-titulo text-xl font-bold"><Link href={`/blog/${post.slug}/`} className="underline-offset-4 hover:underline">{post.title}</Link></h2><p className="font-texto text-sm leading-6 text-texto-suave">{post.description}</p></article>;
}
