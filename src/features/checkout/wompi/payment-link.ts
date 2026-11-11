/** Cuerpo de POST /EnlacePago (docs.wompi.sv/metodos-api/enlace-de-pago). Función pura. */

export type PaymentLinkInput = {
  orderId: string;
  totalCents: number;
  productName: string;
  startsAt: Date;
  endsAt: Date;
  /** Página de resultado de Ticketera, sin secretos en la URL. */
  redirectUrl: string;
  /** Webhook público de Ticketera. */
  webhookUrl: string;
};

/** El monto se envía en dólares con dos decimales (la documentación indica mínimo $0.01). */
export function centsToDollars(cents: number): number {
  return Math.round(cents) / 100;
}

const PRODUCT_NAME_MAX = 500;

export function buildPaymentLinkBody(input: PaymentLinkInput) {
  return {
    identificadorEnlaceComercio: input.orderId,
    monto: centsToDollars(input.totalCents),
    nombreProducto: input.productName.slice(0, PRODUCT_NAME_MAX),
    formaPago: { permitirTarjetaCreditoDebido: true },
    vigencia: {
      fechaInicio: input.startsAt.toISOString(),
      fechaFin: input.endsAt.toISOString(),
    },
    configuracion: {
      urlRedirect: input.redirectUrl,
      urlWebhook: input.webhookUrl,
      notificarTransaccionCliente: false,
    },
  };
}
