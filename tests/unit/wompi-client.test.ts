import { describe, expect, it, vi } from 'vitest';

import { createWompiClient, WompiError, WOMPI_API_URL, WOMPI_TOKEN_URL } from '@/features/checkout/wompi/client';

const config = { appId: 'app-id-prueba', apiSecret: 'api-secret-prueba' };

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
}

type Handler = (url: string, init?: RequestInit) => Response | Promise<Response>;

function fakeFetch(handler: Handler) {
  return vi.fn(async (url: string, init?: RequestInit) => {
    if (url === WOMPI_TOKEN_URL) return json(200, { access_token: 'token-prueba', expires_in: 3600 });
    return handler(url, init);
  });
}

describe('cliente de Wompi', () => {
  it('pide el token con client credentials y lo reutiliza hasta casi vencer', async () => {
    let clock = 1_000_000;
    const fetchImpl = fakeFetch(() => json(200, { estaProductivo: false }));
    const client = createWompiClient(config, { fetchImpl: fetchImpl as unknown as typeof fetch, now: () => clock });

    await client.getAppInfo();
    await client.getAppInfo();
    expect(fetchImpl.mock.calls.filter(([url]) => url === WOMPI_TOKEN_URL)).toHaveLength(1);

    const tokenInit = fetchImpl.mock.calls[0][1] as RequestInit;
    const form = new URLSearchParams(tokenInit.body as string);
    expect(form.get('grant_type')).toBe('client_credentials');
    expect(form.get('audience')).toBe('wompi_api');
    expect(form.get('client_id')).toBe(config.appId);

    clock += 3600 * 1000;
    await client.getAppInfo();
    expect(fetchImpl.mock.calls.filter(([url]) => url === WOMPI_TOKEN_URL)).toHaveLength(2);
  });

  it('lee el modo del negocio desde /Aplicativo', async () => {
    const fetchImpl = fakeFetch(() => json(200, { estaProductivo: true }));
    const client = createWompiClient(config, { fetchImpl: fetchImpl as unknown as typeof fetch });

    await expect(client.getAppInfo()).resolves.toEqual({ productive: true });
    expect(fetchImpl.mock.calls[1][0]).toBe(`${WOMPI_API_URL}/Aplicativo`);
  });

  it('crea el enlace y rechaza una respuesta que no es de sandbox', async () => {
    const sandbox = fakeFetch(() => json(200, { idEnlace: 42, urlEnlace: 'https://pago.wompi.sv/x', estaProductivo: false }));
    const client = createWompiClient(config, { fetchImpl: sandbox as unknown as typeof fetch });

    await expect(client.createPaymentLink({ monto: 1 })).resolves.toEqual({
      linkId: 42,
      url: 'https://pago.wompi.sv/x',
    });

    const productive = fakeFetch(() => json(200, { idEnlace: 1, urlEnlace: 'https://x', estaProductivo: true }));
    const blocked = createWompiClient(config, { fetchImpl: productive as unknown as typeof fetch });
    await expect(blocked.createPaymentLink({})).rejects.toMatchObject({ code: 'not_sandbox' });
  });

  it('consulta la transacción y solo marca aprobada con esAprobada verdadero', async () => {
    const fetchImpl = fakeFetch(() => json(200, { esAprobada: true, montoOriginal: 15 }));
    const client = createWompiClient(config, { fetchImpl: fetchImpl as unknown as typeof fetch });

    await expect(client.getTransaction('tx 1')).resolves.toEqual({ approved: true, amount: 15 });
    expect(fetchImpl.mock.calls[1][0]).toBe(`${WOMPI_API_URL}/TransaccionCompra/tx%201`);

    const notApproved = fakeFetch(() => json(200, { esAprobada: false, montoOriginal: 15 }));
    const other = createWompiClient(config, { fetchImpl: notApproved as unknown as typeof fetch });
    await expect(other.getTransaction('tx-2')).resolves.toMatchObject({ approved: false });
  });

  it('convierte fallos en errores cortos sin el cuerpo de la respuesta', async () => {
    const leaky = fakeFetch(() => json(401, { detalle: 'secreto-interno' }));
    const client = createWompiClient(config, { fetchImpl: leaky as unknown as typeof fetch });

    const error = await client.getAppInfo().catch((cause: unknown) => cause);
    expect(error).toBeInstanceOf(WompiError);
    expect((error as WompiError).code).toBe('auth');
    expect(String((error as Error).message)).not.toContain('secreto-interno');
  });

  it('informa un error de red sin lanzar detalles del proveedor', async () => {
    const offline = vi.fn(async () => {
      throw new TypeError('fallo de red');
    });
    const client = createWompiClient(config, { fetchImpl: offline as unknown as typeof fetch });

    await expect(client.getAppInfo()).rejects.toMatchObject({ code: 'network' });
  });
});
