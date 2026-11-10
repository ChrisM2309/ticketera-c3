import type { Metadata } from 'next';
import Link from 'next/link';

import { buttonVariants } from '@/components/ui/button';
import { saveEditorialPageAction } from '@/features/content/actions';
import { requireRole } from '@/lib/auth/require-role';
import { cn } from '@/lib/utils';

export const metadata: Metadata = { title: 'Texto de categoría | Administración DEMO', robots: { index: false, follow: false } };

export default async function EditorialCategoryPage({ params }: { params: Promise<{ categoryId: string }> }) {
  const account = await requireRole('admin', '/admin/contenido/');
  const { categoryId } = await params;
  const [category, editorial] = await Promise.all([
    account.client.from('categories').select('name').eq('id', categoryId).maybeSingle(),
    account.client.from('editorial_pages').select('intro_md, faq').eq('category_id', categoryId).maybeSingle(),
  ]);
  if (category.error || !category.data) return <main className="mx-auto max-w-4xl px-4 py-10"><p>No encontramos la categoría.</p></main>;
  return <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-10 sm:px-6"><Link href="/admin/contenido/" className="font-texto text-sm text-texto-suave underline">Volver a contenido</Link><h1 className="font-titulo text-3xl font-bold">Texto de {category.data.name}</h1><form action={saveEditorialPageAction} className="flex flex-col gap-4"><input type="hidden" name="categoryId" value={categoryId} /><label className="flex flex-col gap-1 font-texto text-sm font-semibold">Introducción Markdown<textarea name="introMd" rows={10} maxLength={4000} defaultValue={editorial.data?.intro_md ?? ''} className="rounded-md border border-borde-fuerte bg-fondo p-3 font-normal" /></label><input type="hidden" name="faq" value={JSON.stringify(editorial.data?.faq ?? [])} /><button type="submit" className={cn(buttonVariants({ variant: 'compra' }), 'w-fit')}>Guardar texto</button></form></main>;
}
