import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Firma del webhook de Wompi: cabecera `wompi_hash` = HMAC-SHA256 del cuerpo crudo con el API Secret
 * como clave (docs.wompi.sv/webhook/validar-webhook). El ejemplo oficial en C# usa ToString("x2"),
 * es decir hexadecimal en minúsculas; se confirma con una transacción de prueba.
 */
export function computeWompiHash(rawBody: string, apiSecret: string): string {
  return createHmac('sha256', apiSecret).update(rawBody, 'utf8').digest('hex');
}

export function verifyWompiSignature(rawBody: string, header: string | null, apiSecret: string): boolean {
  if (!header || !apiSecret) return false;

  const received = Buffer.from(header.trim().toLowerCase(), 'utf8');
  const expected = Buffer.from(computeWompiHash(rawBody, apiSecret), 'utf8');

  // timingSafeEqual exige la misma longitud; una longitud distinta ya es una firma inválida.
  return received.length === expected.length && timingSafeEqual(received, expected);
}
