function absoluteUrl(path: string, siteUrl: string): string {
  const normalized = path === '/' ? '/' : `/${path.replace(/^\/+|\/+$/g, '')}/`;
  return new URL(normalized, siteUrl).toString();
}

export function breadcrumbListJsonLd(items: { name: string; path: string }[], siteUrl: string): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path, siteUrl),
    })),
  };
}

export function webSiteJsonLd(siteUrl: string): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    url: absoluteUrl('/', siteUrl),
    potentialAction: {
      '@type': 'SearchAction',
      target: `${absoluteUrl('/buscar/', siteUrl)}?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };
}

export function organizationJsonLd(org: { name: string; description: string; path: string; isDemo: boolean }, siteUrl: string): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: org.isDemo ? `${org.name} (DEMO)` : org.name,
    description: org.description,
    url: absoluteUrl(org.path, siteUrl),
  };
}

export function articleJsonLd(post: { title: string; description: string; path: string; publishedAt: string; updatedAt: string }, siteUrl: string): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.description,
    url: absoluteUrl(post.path, siteUrl),
    datePublished: new Date(post.publishedAt).toISOString(),
    dateModified: new Date(post.updatedAt).toISOString(),
  };
}
