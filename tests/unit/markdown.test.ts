import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

import { parseMarkdown } from '@/lib/content/markdown';

describe('markdown editorial seguro', () => {
  it('un <script> queda como texto', () => {
    expect(parseMarkdown('<script>alert(1)</script>')[0]).toMatchObject({ type: 'p', inline: [{ t: 'text', v: '<script>alert(1)</script>' }] });
  });

  it('un <img onerror> queda como texto', () => {
    expect(parseMarkdown('<img src=x onerror=alert(1)>')[0]).toMatchObject({ type: 'p', inline: [{ t: 'text' }] });
  });

  it('un enlace javascript: se vuelve texto', () => {
    expect(parseMarkdown('[alerta](javascript:alert(1))')[0]).toMatchObject({ inline: [{ t: 'text' }] });
  });

  it('un enlace https se conserva', () => {
    expect(parseMarkdown('[sitio](https://example.com)')[0]).toMatchObject({ inline: [{ t: 'link', href: 'https://example.com', v: 'sitio' }] });
  });

  it('un enlace interno seguro se conserva', () => {
    expect(parseMarkdown('[charlas](/charlas/)')[0]).toMatchObject({ inline: [{ t: 'link', href: '/charlas/', v: 'charlas' }] });
  });

  it('un enlace http o //otro.com se vuelve texto', () => {
    expect(parseMarkdown('[http](http://example.com)')[0]).toMatchObject({ inline: [{ t: 'text' }] });
    expect(parseMarkdown('[otro](//otro.com)')[0]).toMatchObject({ inline: [{ t: 'text' }] });
  });

  it('títulos, listas y negrita', () => {
    const blocks = parseMarkdown('## Título\n\n- Uno\n- **Dos**\n\n### Subtítulo');
    expect(blocks.map((block) => block.type)).toEqual(['h2', 'ul', 'h3']);
    expect(blocks[1]).toMatchObject({ items: [[{ t: 'text', v: 'Uno' }], [{ t: 'strong', v: 'Dos' }]] });
  });

  it('MarkdownView no usa dangerouslySetInnerHTML', () => {
    const source = readFileSync('src/lib/content/markdown.ts', 'utf8');
    expect(source).not.toContain('dangerouslySetInnerHTML');
  });
});
