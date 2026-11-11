import Image from 'next/image';
import Link from 'next/link';

import type { BlogPostSummary } from '@/features/content/queries';
import { publicImagePath } from '@/features/catalog/images';

export function PostCard({ post }: { post: BlogPostSummary }) {
  const imagePath = publicImagePath(post.coverImagePath) ?? '/images/stock/stock-salon-evento-01.jpg';
  return <article className="flex flex-col overflow-hidden rounded-lg bg-superficie shadow-sm"><div className="relative aspect-[16/9] bg-navy"><Image src={imagePath} alt={`Portada: ${post.title}`} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" className="object-cover" /></div><div className="flex flex-1 flex-col gap-3 p-5"><span className="font-texto text-xs font-semibold uppercase tracking-etiqueta text-texto-suave">{post.topic}</span><h2 className="font-titulo text-xl font-bold"><Link href={`/blog/${post.slug}/`} className="underline-offset-4 hover:underline">{post.title}</Link></h2>{post.keyword ? <p className="font-texto text-xs font-medium text-accion">Palabra clave: {post.keyword}</p> : null}<p className="font-texto text-sm leading-6 text-texto-suave">{post.description}</p>{post.authorName ? <p className="mt-auto font-texto text-xs text-texto-suave">Por {post.authorName}</p> : null}</div></article>;
}
