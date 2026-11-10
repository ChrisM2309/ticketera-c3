'use client';

import { useState } from 'react';

import { MarkdownView, parseMarkdown } from '@/lib/content/markdown';
import { saveBlogPostAction } from '@/features/content/actions';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type Props = Readonly<{ id?: string; defaults?: Partial<Record<'title' | 'slug' | 'description' | 'bodyMd' | 'keyword' | 'topic', string>>; relatedTypeSlugs?: string[] }>;

export function ContentEditor({ id, defaults = {}, relatedTypeSlugs = [] }: Props) {
  const [body, setBody] = useState(defaults.bodyMd ?? '');
  return (
    <form action={saveBlogPostAction} className="grid gap-8 lg:grid-cols-2">
      {id ? <input type="hidden" name="id" value={id} /> : null}
      <div className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 font-texto text-sm font-semibold">Título<input name="title" required minLength={5} maxLength={70} defaultValue={defaults.title} className="rounded-md border border-borde-fuerte bg-fondo px-3 py-2 font-normal" /></label>
        <label className="flex flex-col gap-1 font-texto text-sm font-semibold">Slug<input name="slug" required defaultValue={defaults.slug} className="rounded-md border border-borde-fuerte bg-fondo px-3 py-2 font-normal" /></label>
        <label className="flex flex-col gap-1 font-texto text-sm font-semibold">Descripción SEO<textarea name="description" minLength={50} maxLength={160} defaultValue={defaults.description} rows={3} className="rounded-md border border-borde-fuerte bg-fondo p-3 font-normal" /></label>
        <label className="flex flex-col gap-1 font-texto text-sm font-semibold">Palabra clave<input name="keyword" defaultValue={defaults.keyword} className="rounded-md border border-borde-fuerte bg-fondo px-3 py-2 font-normal" /></label>
        <label className="flex flex-col gap-1 font-texto text-sm font-semibold">Tema<select name="topic" defaultValue={defaults.topic ?? 'eventos'} className="rounded-md border border-borde-fuerte bg-fondo px-3 py-2 font-normal"><option value="eventos">Eventos</option><option value="cultura">Cultura</option><option value="fechas-mixtas">Fechas mixtas</option></select></label>
        <label className="flex flex-col gap-1 font-texto text-sm font-semibold">Cuerpo Markdown<textarea name="bodyMd" value={body} onChange={(event) => setBody(event.target.value)} rows={16} className="rounded-md border border-borde-fuerte bg-fondo p-3 font-mono text-sm font-normal" /></label>
        {relatedTypeSlugs.map((slug) => <input key={slug} type="hidden" name="relatedTypeSlugs" value={slug} />)}
        <div className="flex flex-wrap gap-3"><button name="status" value="draft" type="submit" className={cn(buttonVariants({ variant: 'secundario' }))}>Guardar borrador</button><button name="status" value="published" type="submit" className={cn(buttonVariants({ variant: 'compra' }))}>Publicar</button></div>
      </div>
      <aside aria-label="Vista previa" className="rounded-lg bg-superficie p-6"><h2 className="font-titulo text-xl font-bold">Vista previa</h2><div className="mt-4"><MarkdownView blocks={parseMarkdown(body)} /></div></aside>
    </form>
  );
}
