/** Pasos del pago simulado: resumen, elección del resultado, procesamiento y resultado. */
export type PaymentStep = 'review' | 'method' | 'processing' | 'result';

export type PaymentFlowEvent = 'continue' | 'back' | 'submitted' | 'settled';

const transitions: Readonly<Partial<Record<PaymentStep, Partial<Record<PaymentFlowEvent, PaymentStep>>>>> = {
  review: { continue: 'method' },
  method: { back: 'review', submitted: 'processing' },
  processing: { settled: 'result' },
};

/** Cualquier combinación que no esté en la tabla deja el paso como estaba. */
export function nextPaymentStep(step: PaymentStep, event: PaymentFlowEvent): PaymentStep {
  return transitions[step]?.[event] ?? step;
}

export type ReceiptStatus = 'approved' | 'rejected' | 'free';

/** Comprobante de una orden. El método siempre es el pago de demostración: nunca hay cobro real. */
export type Receipt = {
  orderNumber: string;
  paymentId: string | null;
  methodLabel: 'Pago de demostración';
  status: ReceiptStatus;
  subtotalCents: number;
  feeCents: number;
  totalCents: number;
  paidAt: string | null;
};

type ReceiptInput = {
  order: {
    id: string;
    status: string;
    subtotalCents: number;
    feeCents: number;
    totalCents: number;
    confirmedAt: string | null;
  };
  payment: { id: string; status: string } | null;
};

function receiptStatus({ order, payment }: ReceiptInput): ReceiptStatus {
  if (payment?.status === 'demo_approved') {
    return 'approved';
  }

  if (payment?.status === 'demo_rejected') {
    return 'rejected';
  }

  if (!payment && order.totalCents === 0 && order.status === 'confirmed') {
    return 'free';
  }

  // Sin un pago aprobado registrado, una orden de pago nunca se muestra como aprobada.
  return 'rejected';
}

export function buildReceipt(input: ReceiptInput): Receipt {
  const { order, payment } = input;
  const status = receiptStatus(input);

  return {
    orderNumber: order.id,
    paymentId: payment?.id ?? null,
    methodLabel: 'Pago de demostración',
    status,
    subtotalCents: order.subtotalCents,
    feeCents: order.feeCents,
    totalCents: order.totalCents,
    paidAt: status === 'rejected' ? null : order.confirmedAt,
  };
}

const receiptStatusLabels: Record<ReceiptStatus, string> = {
  approved: 'Aprobado (simulado)',
  rejected: 'Rechazado (simulado)',
  free: 'Gratuito (sin pago)',
};

export function receiptStatusLabel(status: ReceiptStatus): string {
  return receiptStatusLabels[status];
}
