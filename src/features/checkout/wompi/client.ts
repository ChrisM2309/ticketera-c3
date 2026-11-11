import type { WompiConfig } from './config';

/**
 * Cliente mínimo de la API de Wompi El Salvador (docs.wompi.sv). Solo servidor.
 * Los errores no incluyen el cuerpo de la respuesta ni credenciales: solo un código corto.
 */

export const WOMPI_TOKEN_URL = 'https://id.wompi.sv/connect/token';
export const WOMPI_API_URL = 'https://api.wompi.sv';
const REQUEST_TIMEOUT_MS = 10_000;
/** Renueva el token un minuto antes de que venza. */
const TOKEN_MARGIN_MS = 60_000;

export class WompiError extends Error {
  constructor(
    readonly code: 'auth' | 'request' | 'response' | 'network' | 'not_sandbox',
    readonly status?: number,
  ) {
    super(`Wompi: ${code}${status ? ` (${status})` : ''}`);
    this.name = 'WompiError';
  }
}

export type AppInfo = { productive: boolean };
export type CreatedPaymentLink = { linkId: number; url: string };
export type TransactionInfo = { approved: boolean; amount: unknown };

type FetchLike = typeof fetch;

export function createWompiClient(config: WompiConfig, options: { fetchImpl?: FetchLike; now?: () => number } = {}) {
  const fetchImpl = options.fetchImpl ?? fetch;
  const now = options.now ?? (() => Date.now());
  let cachedToken: { value: string; expiresAt: number } | null = null;

  async function send(url: string, init: RequestInit): Promise<unknown> {
    let response: Response;
    try {
      response = await fetchImpl(url, { ...init, signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
    } catch {
      throw new WompiError('network');
    }

    if (!response.ok) {
      throw new WompiError(response.status === 401 || response.status === 403 ? 'auth' : 'request', response.status);
    }

    try {
      return await response.json();
    } catch {
      throw new WompiError('response', response.status);
    }
  }

  async function accessToken(): Promise<string> {
    if (cachedToken && cachedToken.expiresAt > now()) return cachedToken.value;

    const body = new URLSearchParams({
      grant_type: 'client_credentials',
      audience: 'wompi_api',
      client_id: config.appId,
      client_secret: config.apiSecret,
    });

    const payload = (await send(WOMPI_TOKEN_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body,
    })) as { access_token?: unknown; expires_in?: unknown };

    if (typeof payload.access_token !== 'string' || typeof payload.expires_in !== 'number') {
      throw new WompiError('response');
    }

    cachedToken = { value: payload.access_token, expiresAt: now() + payload.expires_in * 1000 - TOKEN_MARGIN_MS };
    return payload.access_token;
  }

  async function authorized(url: string, init: RequestInit = {}): Promise<unknown> {
    const token = await accessToken();
    return send(url, {
      ...init,
      headers: { accept: 'application/json', 'content-type': 'application/json', authorization: `Bearer ${token}`, ...(init.headers as Record<string, string>) },
    });
  }

  return {
    /** Información del negocio. Se usa para verificar que el negocio está en modo de prueba. */
    async getAppInfo(): Promise<AppInfo> {
      const payload = (await authorized(`${WOMPI_API_URL}/Aplicativo`)) as { estaProductivo?: unknown };
      if (typeof payload.estaProductivo !== 'boolean') throw new WompiError('response');
      return { productive: payload.estaProductivo };
    },

    async createPaymentLink(body: Record<string, unknown>): Promise<CreatedPaymentLink> {
      const payload = (await authorized(`${WOMPI_API_URL}/EnlacePago`, {
        method: 'POST',
        body: JSON.stringify(body),
      })) as { idEnlace?: unknown; urlEnlace?: unknown; estaProductivo?: unknown };

      if (typeof payload.idEnlace !== 'number' || typeof payload.urlEnlace !== 'string') {
        throw new WompiError('response');
      }
      if (payload.estaProductivo !== false) throw new WompiError('not_sandbox');

      return { linkId: payload.idEnlace, url: payload.urlEnlace };
    },

    /** Consulta la transacción por id: fuente de verdad para aprobación e importe. */
    async getTransaction(transactionId: string): Promise<TransactionInfo> {
      const payload = (await authorized(
        `${WOMPI_API_URL}/TransaccionCompra/${encodeURIComponent(transactionId)}`,
      )) as { esAprobada?: unknown; montoOriginal?: unknown };

      return { approved: payload.esAprobada === true, amount: payload.montoOriginal };
    },
  };
}

export type WompiClient = ReturnType<typeof createWompiClient>;
