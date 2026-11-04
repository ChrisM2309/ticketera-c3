import type { Metadata } from 'next';

import { CartPage } from '@/components/checkout/cart-page';
import { getCartEvent } from '@/features/catalog/queries';
import { normalizeCartItems, parseCartQuery } from '@/features/checkout/cart';

export const metadata: Metadata = {
  title: 'Carrito',
  robots: { index: false, follow: false },
};

type CartRouteProps = Readonly<{
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}>;

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function CartRoute({ searchParams }: CartRouteProps) {
  const params = await searchParams;
  const eventId = firstParam(params.evento);
  const encodedItems = firstParam(params.entradas);
  const selection = parseCartQuery(eventId, encodedItems);
  const hasQuery = eventId !== undefined || encodedItems !== undefined;

  if (!selection) {
    return <CartPage initialEvent={null} initialItems={[]} initialState={hasQuery ? 'invalid_query' : 'empty'} />;
  }

  const result = await getCartEvent(selection.eventId);

  if (result.status !== 'ok') {
    return <CartPage initialEvent={null} initialItems={[]} initialState={result.status} />;
  }

  const initialItems = normalizeCartItems(result.event, selection.items);

  return (
    <CartPage
      initialEvent={result.event}
      initialItems={initialItems}
      initialState={initialItems.length > 0 ? 'ready' : 'empty_selection'}
    />
  );
}
