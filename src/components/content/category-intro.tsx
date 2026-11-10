import { MarkdownView, parseMarkdown } from '@/lib/content/markdown';

type Props = Readonly<{ introMd: string; faq: readonly { q: string; a: string }[] }>;

export function CategoryIntro({ introMd, faq }: Props) {
  return <section aria-labelledby="contenido-editorial" className="flex flex-col gap-5 border-t border-borde pt-8"><h2 id="contenido-editorial" className="font-titulo text-2xl font-bold">Sobre esta categoría</h2><MarkdownView blocks={parseMarkdown(introMd)} />{faq.length > 0 ? <div className="flex flex-col gap-3"><h3 className="font-titulo text-lg font-bold">Preguntas frecuentes</h3>{faq.map((item) => <details key={item.q} className="rounded-md bg-superficie p-4"><summary className="cursor-pointer font-semibold">{item.q}</summary><p className="mt-2 font-texto leading-6 text-texto-suave">{item.a}</p></details>)}</div> : null}</section>;
}
