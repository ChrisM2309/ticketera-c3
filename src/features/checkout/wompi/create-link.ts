import { siteConfig } from '@/lib/site-config';

import { createWompiClient, WompiError } from './client';
import { readWompiConfig } from './config';
import { buildPaymentLinkBody } from './payment-link';
import { paymentReference, type PaymentSubject } from './reference';
import { paymentWindowEndsAt } from './settle';

export type PaymentLinkStart = { ok: true; redirectUrl: string; linkId: number } | { ok: false; message: string };

/**
 * Crea el enlace de Wompi para un destacado o un paquete (o una orden). La guardia de sandbox es la misma
 * que en las entradas: sin configuración o con el negocio en modo productivo no se crea nada.
 */
export async function createSubjectPaymentLink(input: {
  subject: PaymentSubject;
  totalCents: number;
  productName: string;
  redirectPath: string;
  now?: Date;
}): Promise<PaymentLinkStart> {
  const config = readWompiConfig();
  if (!config) return { ok: false, message: 'El pago con Wompi no está disponible en este momento.' };

  const now = input.now ?? new Date();
  const wompi = createWompiClient(config);

  try {
    const app = await wompi.getAppInfo();
    if (app.productive) {
      console.error('Wompi: el negocio está en modo productivo; no se crea el enlace.');
      return { ok: false, message: 'El pago con Wompi no está disponible en este momento.' };
    }

    const link = await wompi.createPaymentLink(
      buildPaymentLinkBody({
        orderId: paymentReference(input.subject),
        totalCents: input.totalCents,
        productName: input.productName,
        startsAt: now,
        endsAt: paymentWindowEndsAt(now),
        redirectUrl: new URL(input.redirectPath, siteConfig.siteUrl).toString(),
        webhookUrl: new URL('/api/pagos/wompi/webhook/', siteConfig.siteUrl).toString(),
      }),
    );

    return { ok: true, redirectUrl: link.url, linkId: link.linkId };
  } catch (cause) {
    console.error('Wompi: no se creó el enlace de pago.', cause instanceof WompiError ? cause.code : 'desconocido');
    return { ok: false, message: 'No pudimos crear el enlace de pago. Intentá nuevamente.' };
  }
}
