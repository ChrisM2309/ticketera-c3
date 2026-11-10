import { describe, expect, test } from 'vitest';

import {
  buildReceipt,
  nextPaymentStep,
  receiptStatusLabel,
  type PaymentFlowEvent,
  type PaymentStep,
} from '../../src/features/checkout/payment-flow';

const order = {
  id: '11111111-1111-4111-8111-111111111111',
  status: 'confirmed',
  subtotalCents: 4500,
  feeCents: 225,
  totalCents: 4725,
  confirmedAt: '2027-04-10T15:30:00Z',
};

describe('nextPaymentStep', () => {
  test('recorre review, method, processing y result', () => {
    let step: PaymentStep = 'review';

    step = nextPaymentStep(step, 'continue');
    expect(step).toBe('method');

    step = nextPaymentStep(step, 'submitted');
    expect(step).toBe('processing');

    step = nextPaymentStep(step, 'settled');
    expect(step).toBe('result');
  });

  test('desde method se puede volver a review', () => {
    expect(nextPaymentStep('method', 'back')).toBe('review');
  });

  test('un evento inválido no cambia de paso', () => {
    const steps: PaymentStep[] = ['review', 'method', 'processing', 'result'];
    const events: PaymentFlowEvent[] = ['continue', 'back', 'submitted', 'settled'];
    const valid = new Set(['review:continue', 'method:back', 'method:submitted', 'processing:settled']);

    for (const step of steps) {
      for (const event of events) {
        if (!valid.has(`${step}:${event}`)) {
          expect(nextPaymentStep(step, event)).toBe(step);
        }
      }
    }
  });
});

describe('buildReceipt', () => {
  test('marca approved cuando el pago es demo_approved', () => {
    expect(
      buildReceipt({ order, payment: { id: '22222222-2222-4222-8222-222222222222', status: 'demo_approved' } }),
    ).toEqual({
      orderNumber: order.id,
      paymentId: '22222222-2222-4222-8222-222222222222',
      methodLabel: 'Pago de demostración',
      status: 'approved',
      subtotalCents: 4500,
      feeCents: 225,
      totalCents: 4725,
      paidAt: '2027-04-10T15:30:00Z',
    });
  });

  test('buildReceipt marca rejected cuando el pago es demo_rejected', () => {
    const receipt = buildReceipt({
      order: { ...order, status: 'failed', confirmedAt: null },
      payment: { id: '33333333-3333-4333-8333-333333333333', status: 'demo_rejected' },
    });

    expect(receipt.status).toBe('rejected');
    expect(receipt.paymentId).toBe('33333333-3333-4333-8333-333333333333');
    expect(receipt.paidAt).toBeNull();
    expect(receipt.totalCents).toBe(4725);
  });

  test('buildReceipt de orden gratis no tiene paymentId', () => {
    const receipt = buildReceipt({
      order: { ...order, subtotalCents: 0, feeCents: 0, totalCents: 0 },
      payment: null,
    });

    expect(receipt.status).toBe('free');
    expect(receipt.paymentId).toBeNull();
    expect(receipt.methodLabel).toBe('Pago de demostración');
    expect(receipt.paidAt).toBe('2027-04-10T15:30:00Z');
  });

  test('una orden fallida sin registro de pago no se muestra como aprobada', () => {
    const receipt = buildReceipt({ order: { ...order, status: 'failed', confirmedAt: null }, payment: null });

    expect(receipt.status).toBe('rejected');
    expect(receipt.paidAt).toBeNull();
  });
});

describe('receiptStatusLabel', () => {
  test('nombra cada estado como simulado', () => {
    expect(receiptStatusLabel('approved')).toBe('Aprobado (simulado)');
    expect(receiptStatusLabel('rejected')).toBe('Rechazado (simulado)');
    expect(receiptStatusLabel('free')).toBe('Gratuito (sin pago)');
  });
});
