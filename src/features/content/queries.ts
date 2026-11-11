import { createPublicClient } from '@/lib/supabase/public';
import { publicImagePath } from '@/features/catalog/images';

export type BlogPostSummary = { slug: string; title: string; description: string; topic: string; publishedAt: string; keyword: string | null; authorName: string | null; coverImagePath: string | null };
export type PublishedPost = BlogPostSummary & { bodyMd: string; relatedTypeSlugs: string[]; relatedTypes: { slug: string; name: string; path: string }[] };
export type PublishedPostRow = {
  slug: string;
  title: string;
  description: string;
  topic: string;
  published_at: string;
  body_md: string;
  keyword: string | null;
  author_name: string | null;
  cover_image_path: string | null;
  related_type_slugs: string[] | null;
};

type RelatedCategory = { slug: string; name: string };
type BlogPostSummaryRow = Pick<PublishedPostRow, 'slug' | 'title' | 'description' | 'topic' | 'published_at' | 'keyword' | 'author_name' | 'cover_image_path'>;

function editorialImagePath(path: string | null): string | null {
  const safePath = publicImagePath(path);
  return safePath?.startsWith('/images/') ? safePath : null;
}

export function mapBlogPostSummaryRow(row: BlogPostSummaryRow): BlogPostSummary {
  return {
    slug: row.slug,
    title: row.title,
    description: row.description,
    topic: row.topic,
    publishedAt: row.published_at,
    keyword: row.keyword,
    authorName: row.author_name,
    coverImagePath: editorialImagePath(row.cover_image_path),
  };
}

export function mapPublishedPostRow(row: PublishedPostRow, related: readonly RelatedCategory[]): PublishedPost {
  return {
    ...mapBlogPostSummaryRow(row),
    bodyMd: row.body_md,
    relatedTypeSlugs: row.related_type_slugs ?? [],
    relatedTypes: related.map((item) => ({ slug: item.slug, name: item.name, path: `/${item.slug}/` })),
  };
}

export function paginateSummaries(posts: readonly BlogPostSummary[], page: number, pageSize = 10): { posts: BlogPostSummary[]; total: number } {
  const safePage = Number.isInteger(page) && page > 0 ? page : 1;
  const safeSize = Number.isInteger(pageSize) && pageSize > 0 ? pageSize : 10;
  return { posts: posts.slice((safePage - 1) * safeSize, safePage * safeSize), total: posts.length };
}

export async function listPublishedPosts(page: number, pageSize = 10): Promise<{ posts: BlogPostSummary[]; total: number }> {
  const client = createPublicClient();
  if (!client) return { posts: [], total: 0 };
  const offset = Math.max(0, page - 1) * pageSize;
  const result = await client.from('blog_posts').select('slug, title, description, topic, published_at, keyword, author_name, cover_image_path', { count: 'exact' }).eq('status', 'published').order('published_at', { ascending: false }).range(offset, offset + pageSize - 1);
  if (result.error) return { posts: [], total: 0 };
  return { posts: (result.data ?? []).map((post) => mapBlogPostSummaryRow(post)), total: result.count ?? 0 };
}

export async function getPublishedPost(slug: string): Promise<PublishedPost | null> {
  const client = createPublicClient();
  if (!client) return null;
  const result = await client.from('blog_posts').select('slug, title, description, topic, published_at, body_md, keyword, author_name, cover_image_path, related_type_slugs').eq('slug', slug).eq('status', 'published').maybeSingle();
  if (result.error || !result.data) return null;
  const related = result.data.related_type_slugs?.length ? await client.from('categories').select('slug, name').eq('kind', 'event_type').in('slug', result.data.related_type_slugs) : { data: [] };
  return mapPublishedPostRow(result.data, related.data ?? []);
}

export async function getEditorialPage(categoryId: string) {
  const client = createPublicClient();
  if (!client) return null;
  const result = await client.from('editorial_pages').select('intro_md, faq').eq('category_id', categoryId).eq('status', 'published').maybeSingle();
  return result.error || !result.data ? null : { introMd: result.data.intro_md, faq: Array.isArray(result.data.faq) ? result.data.faq as { q: string; a: string }[] : [] };
}
