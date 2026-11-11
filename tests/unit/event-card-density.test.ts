import type { ReactElement } from 'react';
import { describe, expect, it } from 'vitest';

import { EventCard } from '../../src/components/catalog/event-card';
import type { CatalogEvent } from '../../src/features/catalog/types';

const event: CatalogEvent = {
  id: 'event-card-demo',
  slug: 'event-card-demo',
  title: 'Cumbre de interfaces abiertas',
  startsAt: '2027-04-15T16:00:00Z',
  mode: 'presencial',
  venue: 'Auditorio DEMO',
  imagePath: null,
  eventType: { slug: 'congresos', name: 'Congresos' },
  topic: { slug: 'cloud' },
  location: { slug: 'san-salvador', name: 'San Salvador' },
  organizer: { name: 'Nube Clara Studio' },
  speakers: [],
  ticketTypes: [{ priceCents: 1850, isActive: true }],
};

function textOf(node: unknown): string {
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(textOf).join(' ');
  if (!node || typeof node !== 'object' || !('props' in node)) return '';

  return textOf((node as ReactElement<{ children?: unknown }>).props.children);
}

function classesOf(node: unknown): string[] {
  if (Array.isArray(node)) return node.flatMap(classesOf);
  if (!node || typeof node !== 'object' || !('props' in node)) return [];

  const element = node as ReactElement<{ children?: unknown; className?: string }>;
  return [element.props.className ?? '', ...classesOf(element.props.children)];
}

describe('densidad de EventCard', () => {
  it('prioriza título, fecha, modalidad y precio sin repetir el organizador', () => {
    const card = EventCard({ event });
    const text = textOf(card);

    expect(text).toContain(event.title);
    expect(text).toContain('Presencial');
    expect(text).toContain('Desde $18.50');
    expect(text).not.toContain('Nube Clara Studio');
  });

  it('refuerza visualmente el destacado con una elevación propia', () => {
    const card = EventCard({ event, featured: true });

    expect(classesOf(card).join(' ')).toContain('shadow-xl');
  });
});
