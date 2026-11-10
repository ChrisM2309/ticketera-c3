import { createElement, type ReactElement } from 'react';

export type Inline = { t: 'text'; v: string } | { t: 'strong'; v: string } | { t: 'link'; href: string; v: string };
export type Block = { type: 'h2' | 'h3' | 'p'; inline: Inline[] } | { type: 'ul'; items: Inline[][] };

function parseInline(source: string): Inline[] {
  const result: Inline[] = [];
  const pattern = /(\*\*[^*]+\*\*|\[[^\]]+\]\(https:\/\/[^)\s]+\))/g;
  let cursor = 0;
  for (const match of source.matchAll(pattern)) {
    const index = match.index ?? 0;
    if (index > cursor) result.push({ t: 'text', v: source.slice(cursor, index) });
    const token = match[0];
    if (token.startsWith('**')) result.push({ t: 'strong', v: token.slice(2, -2) });
    else {
      const link = /^\[([^\]]+)\]\((https:\/\/[^)\s]+)\)$/.exec(token);
      if (link) result.push({ t: 'link', href: link[2], v: link[1] });
      else result.push({ t: 'text', v: token });
    }
    cursor = index + token.length;
  }
  if (cursor < source.length) result.push({ t: 'text', v: source.slice(cursor) });
  return result.length > 0 ? result : [{ t: 'text', v: source }];
}

export function parseMarkdown(source: string): Block[] {
  const blocks: Block[] = [];
  let paragraph: string[] = [];
  let list: Inline[][] = [];
  const flushParagraph = () => { if (paragraph.length) { blocks.push({ type: 'p', inline: parseInline(paragraph.join('\n')) }); paragraph = []; } };
  const flushList = () => { if (list.length) { blocks.push({ type: 'ul', items: list }); list = []; } };

  for (const rawLine of source.replace(/\r\n?/g, '\n').split('\n')) {
    const line = rawLine.trim();
    if (!line) { flushParagraph(); flushList(); continue; }
    const heading = /^(#{1,3})\s+(.+)$/.exec(line);
    if (heading) { flushParagraph(); flushList(); blocks.push({ type: heading[1].length === 3 ? 'h3' : 'h2', inline: parseInline(heading[2]) }); continue; }
    if (line.startsWith('- ')) { flushParagraph(); list.push(parseInline(line.slice(2))); continue; }
    flushList(); paragraph.push(line);
  }
  flushParagraph(); flushList();
  return blocks;
}

function inlineElements(inline: Inline[], keyPrefix: string): ReactElement[] {
  return inline.map((item, index) => {
    const key = `${keyPrefix}-${index}`;
    if (item.t === 'strong') return createElement('strong', { key }, item.v);
    if (item.t === 'link') return createElement('a', { key, href: item.href, rel: 'noopener noreferrer' }, item.v);
    return createElement('span', { key }, item.v);
  });
}

export function MarkdownView({ blocks }: { blocks: Block[] }): ReactElement {
  return createElement('div', { className: 'flex flex-col gap-4' }, blocks.map((block, index) => {
    if (block.type === 'ul') return createElement('ul', { key: index, className: 'list-disc pl-6' }, block.items.map((item, itemIndex) => createElement('li', { key: itemIndex }, inlineElements(item, `${index}-${itemIndex}`))));
    return createElement(block.type, { key: index }, inlineElements(block.inline, `${index}`));
  }));
}
