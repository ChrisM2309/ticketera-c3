import type { Metadata } from 'next';

import { robotsMetadata } from './indexing';

function trimWords(value: string, limit: number): string {
  if (value.length <= limit) return value;
  const words = value.trim().split(/\s+/);
  let result = '';
  for (const word of words) {
    const next = result ? `${result} ${word}` : word;
    if (next.length > limit) break;
    result = next;
  }
  return result || value.slice(0, limit);
}

function canonicalPath(path: string): string {
  if (path === '/') return '/';
  return `/${path.replace(/^\/+|\/+$/g, '')}/`;
}

export function buildPageMetadata(
  input: { title: string; description: string; path: string; indexable: boolean; indexingEnabled: boolean; image?: string; type?: 'website' | 'article' },
  siteUrl: string,
): Metadata {
  const path = canonicalPath(input.path);
  const url = new URL(path, siteUrl).toString();
  const title = trimWords(input.title, 60);
  const description = input.description.length <= 160 ? input.description : `${input.description.slice(0, 157).trimEnd()}…`;

  return {
    title,
    description,
    alternates: { canonical: url },
    robots: robotsMetadata({ indexingEnabled: input.indexingEnabled, pageIndexable: input.indexable }),
    openGraph: {
      title,
      description,
      url,
      locale: 'es_SV',
      type: input.type ?? 'website',
      images: input.image ? [{ url: new URL(input.image, siteUrl).toString() }] : undefined,
    },
  };
}
