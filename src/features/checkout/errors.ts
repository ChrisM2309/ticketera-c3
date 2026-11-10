export type CheckoutErrorView = {
  title: string;
  detail: string;
  action: 'retry' | 'back-to-event' | 'none';
};

/**
 * Las rutas de órdenes (`/api/checkout/orders` y `/api/checkout/orders/[orderId]/confirm`) responden
 * `{ error: <mensaje> }` y no envían un código aparte. Los literales de abajo son los mensajes que
 * lanzan las funciones SQL `create_pending_order` y `confirm_order` (errcode 22023) y que las rutas
 * reenvían con estado 400. `sold_out` y `event_unavailable` quedan como alias simbólicos.
 */
const soldOutCodes: ReadonlySet<string> = new Set([
  'sold_out',
  'La cantidad supera los cupos disponibles.',
  'Esta entrada ya no está disponible.',
]);

const eventUnavailableCodes: ReadonlySet<string> = new Set([
  'event_unavailable',
  'Este evento no está disponible para compra.',
  'Este evento ya no está disponible para confirmar la compra.',
]);

const soldOutView: CheckoutErrorView = {
  title: 'Ya no hay entradas disponibles',
  detail:
    'Las entradas que elegiste se agotaron antes de confirmar. No se emitieron boletos ni se cobró dinero: el pago es de demostración. Vuelve al evento para elegir otra opción.',
  action: 'back-to-event',
};

const eventUnavailableView: CheckoutErrorView = {
  title: 'Este evento ya no está disponible',
  detail:
    'El evento cerró la venta o dejó de estar publicado. No se emitieron boletos ni se cobró dinero: el pago es de demostración. Vuelve al evento para ver qué cambió.',
  action: 'back-to-event',
};

const retryView: CheckoutErrorView = {
  title: 'No pudimos completar la compra. Intenta de nuevo',
  detail:
    'Fue un problema temporal de la demostración y no se cobró dinero. Puedes reintentar sin duplicar boletos.',
  action: 'retry',
};

/**
 * Traduce un fallo de la API de checkout a un mensaje para el comprador. Nunca devuelve el texto
 * técnico del servidor: un código desconocido o un estado 5xx caen en «reintentar».
 */
export function checkoutErrorView(code: string | null, status: number): CheckoutErrorView {
  if (status >= 500 || code === null) {
    return { ...retryView };
  }

  if (soldOutCodes.has(code)) {
    return { ...soldOutView };
  }

  if (eventUnavailableCodes.has(code)) {
    return { ...eventUnavailableView };
  }

  return { ...retryView };
}
