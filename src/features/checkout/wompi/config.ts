/**
 * Configuración de Wompi El Salvador. Solo servidor. Falla cerrado: sin variables completas, o con
 * cualquier valor distinto de `sandbox`, el pago con Wompi no se ofrece y no se marca nada como pagado.
 */
export type WompiConfig = {
  appId: string;
  apiSecret: string;
};

type Environment = Readonly<Record<string, string | undefined>>;

export function readWompiConfig(env: Environment = process.env): WompiConfig | null {
  // Solo se acepta el modo de prueba explícito. Cualquier otro valor, incluido 'production', bloquea.
  if (env.WOMPI_ENV !== 'sandbox') return null;

  const appId = env.WOMPI_APP_ID?.trim();
  const apiSecret = env.WOMPI_API_SECRET?.trim();
  if (!appId || !apiSecret) return null;

  return { appId, apiSecret };
}
