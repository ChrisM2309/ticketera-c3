'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { requireRole } from '@/lib/auth/require-role';

import { validateBlogPost } from './validation';

const contentPath = '/admin/contenido/';

function text(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === 'string' ? value : '';
}

export async function saveBlogPostAction(formData: FormData): Promise<void> {
  const account = await requireRole('admin', contentPath);
  const status = text(formData, 'status') === 'published' ? 'publish' : 'draft';
  const parsed = validateBlogPost({
    title: text(formData, 'title'), slug: text(formData, 'slug'), description: text(formData, 'description'),
    bodyMd: text(formData, 'bodyMd'), keyword: text(formData, 'keyword'), topic: text(formData, 'topic'),
    relatedTypeSlugs: formData.getAll('relatedTypeSlugs').filter((item): item is string => typeof item === 'string'),
  }, status);
  if (!parsed.valid) redirect(`${contentPath}?error=validacion`);

  const { error } = await account.client.rpc('admin_save_blog_post', {
    p_id: text(formData, 'id') || null,
    p_slug: parsed.data.slug,
    p_title: parsed.data.title,
    p_description: parsed.data.description || 'Descripción DEMO pendiente de completar antes de publicar.',
    p_body_md: parsed.data.bodyMd,
    p_keyword: parsed.data.keyword,
    p_topic: parsed.data.topic || 'eventos',
    p_related_type_slugs: parsed.data.relatedTypeSlugs ?? [],
    p_status: status === 'publish' ? 'published' : 'draft',
  });
  if (error) redirect(`${contentPath}?error=guardar`);
  revalidatePath('/admin/contenido/');
  revalidatePath('/blog/');
  redirect(`${contentPath}?ok=guardar`);
}

export async function deleteBlogPostAction(formData: FormData): Promise<void> {
  const account = await requireRole('admin', contentPath);
  const id = text(formData, 'id');
  if (!id) redirect(`${contentPath}?error=eliminar`);
  const { error } = await account.client.rpc('admin_delete_blog_post', { p_id: id });
  if (error) redirect(`${contentPath}?error=eliminar`);
  revalidatePath('/admin/contenido/');
  revalidatePath('/blog/');
  redirect(contentPath);
}

export async function saveEditorialPageAction(formData: FormData): Promise<void> {
  const account = await requireRole('admin', contentPath);
  const categoryId = text(formData, 'categoryId');
  let faq: unknown = [];
  try { faq = JSON.parse(text(formData, 'faq') || '[]'); } catch { redirect(`${contentPath}?error=faq`); }
  const { error } = await account.client.rpc('admin_save_editorial_page', { p_category_id: categoryId, p_intro_md: text(formData, 'introMd'), p_faq: faq, p_status: 'published' });
  if (error) redirect(`${contentPath}?error=guardar`);
  revalidatePath('/admin/contenido/');
  redirect(`${contentPath}?ok=categoria`);
}
