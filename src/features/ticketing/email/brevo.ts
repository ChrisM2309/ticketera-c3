/** Cliente mínimo de la API transaccional de Brevo (POST /v3/smtp/email). Solo se usa en el servidor. */

const BREVO_ENDPOINT = 'https://api.brevo.com/v3/smtp/email';
const REQUEST_TIMEOUT_MS = 10_000;
const DEFAULT_SENDER_NAME = 'Ticketera C3 DEMO';

export type BrevoConfig = {
  apiKey: string;
  senderEmail: string;
  senderName: string;
};

export type BrevoMessage = {
  to: { email: string; name?: string };
  subject: string;
  html: string;
  text: string;
  tag: string;
};

export type BrevoSendResult = { ok: true; messageId: string } | { ok: false; reason: string };

/** Devuelve null si falta la clave o el remitente: en ese caso el correo no se envía y la compra sigue. */
export function readBrevoConfig(env: Record<string, string | undefined> = process.env): BrevoConfig | null {
  const apiKey = env.BREVO_API_KEY?.trim();
  const senderEmail = env.BREVO_SENDER_EMAIL?.trim();

  if (!apiKey || !senderEmail) {
    return null;
  }

  return {
    apiKey,
    senderEmail,
    senderName: env.BREVO_SENDER_NAME?.trim() || DEFAULT_SENDER_NAME,
  };
}

/** Convierte cualquier fallo en un motivo corto, sin el cuerpo de la respuesta ni datos del comprador. */
export function brevoFailureReason(status: number): string {
  if (status === 401 || status === 403) return 'clave de Brevo rechazada';
  if (status === 400) return 'Brevo rechazó el mensaje';
  if (status === 429) return 'límite de envíos de Brevo alcanzado';
  if (status >= 500) return 'Brevo no respondió';
  return `Brevo respondió ${status}`;
}

export async function sendBrevoEmail(
  config: BrevoConfig,
  message: BrevoMessage,
  fetchImpl: typeof fetch = fetch,
): Promise<BrevoSendResult> {
  try {
    const response = await fetchImpl(BREVO_ENDPOINT, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'api-key': config.apiKey,
      },
      body: JSON.stringify({
        sender: { name: config.senderName, email: config.senderEmail },
        to: [message.to],
        subject: message.subject,
        htmlContent: message.html,
        textContent: message.text,
        tags: [message.tag],
      }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (!response.ok) {
      return { ok: false, reason: brevoFailureReason(response.status) };
    }

    const payload = (await response.json().catch(() => null)) as { messageId?: unknown } | null;
    const messageId = typeof payload?.messageId === 'string' ? payload.messageId : '';

    return { ok: true, messageId };
  } catch (error) {
    const timedOut = error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError');

    return { ok: false, reason: timedOut ? 'Brevo tardó demasiado' : 'no se pudo conectar con Brevo' };
  }
}
