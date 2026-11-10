import { describe, expect, it, vi } from 'vitest';

import { brevoFailureReason, readBrevoConfig, sendBrevoEmail } from '@/features/ticketing/email/brevo';

const config = { apiKey: 'clave-de-prueba', senderEmail: 'no-reply@c3.com.sv', senderName: 'Ticketera C3 DEMO' };
const message = {
  to: { email: 'ana@example.test', name: 'Ana' },
  subject: 'Asunto',
  html: '<p>hola</p>',
  text: 'hola',
  tag: 'compra-confirmada',
};

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
}

describe('readBrevoConfig', () => {
  it('devuelve null si falta la clave o el remitente', () => {
    expect(readBrevoConfig({})).toBeNull();
    expect(readBrevoConfig({ BREVO_API_KEY: 'x' })).toBeNull();
    expect(readBrevoConfig({ BREVO_SENDER_EMAIL: 'no-reply@c3.com.sv' })).toBeNull();
    expect(readBrevoConfig({ BREVO_API_KEY: '  ', BREVO_SENDER_EMAIL: 'no-reply@c3.com.sv' })).toBeNull();
  });

  it('usa el nombre DEMO por defecto', () => {
    const parsed = readBrevoConfig({ BREVO_API_KEY: 'x', BREVO_SENDER_EMAIL: 'no-reply@c3.com.sv' });
    expect(parsed).toEqual({ apiKey: 'x', senderEmail: 'no-reply@c3.com.sv', senderName: 'Ticketera C3 DEMO' });
  });
});

describe('sendBrevoEmail', () => {
  it('envía con la clave en cabecera y devuelve el id del mensaje', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(201, { messageId: '<abc@smtp-brevo.com>' }));

    const result = await sendBrevoEmail(config, message, fetchMock as unknown as typeof fetch);

    expect(result).toEqual({ ok: true, messageId: '<abc@smtp-brevo.com>' });
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://api.brevo.com/v3/smtp/email');
    expect(init.method).toBe('POST');
    expect((init.headers as Record<string, string>)['api-key']).toBe('clave-de-prueba');
    const body = JSON.parse(init.body as string);
    expect(body.sender).toEqual({ name: 'Ticketera C3 DEMO', email: 'no-reply@c3.com.sv' });
    expect(body.to).toEqual([{ email: 'ana@example.test', name: 'Ana' }]);
    expect(body.tags).toEqual(['compra-confirmada']);
  });

  it('devuelve un motivo corto y no el cuerpo de la respuesta cuando Brevo rechaza', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(401, { message: 'secreto-del-proveedor' }));

    const result = await sendBrevoEmail(config, message, fetchMock as unknown as typeof fetch);

    expect(result).toEqual({ ok: false, reason: 'clave de Brevo rechazada' });
    expect(JSON.stringify(result)).not.toContain('secreto-del-proveedor');
  });

  it('convierte una caída de red en un motivo sin lanzar', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new TypeError('fetch failed'));

    await expect(sendBrevoEmail(config, message, fetchMock as unknown as typeof fetch)).resolves.toEqual({
      ok: false,
      reason: 'no se pudo conectar con Brevo',
    });
  });
});

describe('brevoFailureReason', () => {
  it.each([
    [400, 'Brevo rechazó el mensaje'],
    [429, 'límite de envíos de Brevo alcanzado'],
    [503, 'Brevo no respondió'],
  ])('traduce el estado %i', (status, reason) => {
    expect(brevoFailureReason(status)).toBe(reason);
  });
});
