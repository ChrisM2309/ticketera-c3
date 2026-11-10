import type { Metadata } from 'next';
import Link from 'next/link';

import { ContentEditor } from '@/components/admin/content-editor';

export const metadata: Metadata = { title: 'Nuevo artículo | Administración DEMO', robots: { index: false, follow: false } };

export default function NewBlogPostPage() {
  return <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6"><Link href="/admin/contenido/" className="font-texto text-sm text-texto-suave underline">Volver a contenido</Link><h1 className="font-titulo text-3xl font-bold">Nuevo artículo</h1><ContentEditor /></main>;
}
