/**
 * Destino seguro tras ingresar o registrarse.
 * Acepta solo rutas internas del propio sitio (evita redirecciones abiertas): deben empezar por `/`,
 * no por `//` ni `/\`, y no pueden llevar esquema, barras invertidas ni caracteres de control.
 * Cualquier otro valor cae en `fallback`.
 */
export function safeNextPath(next: unknown, fallback: string): string {
  if (typeof next !== 'string' || next.length === 0 || next.length > 200) {
    return fallback;
  }

  if (!next.startsWith('/') || next.startsWith('//') || next.startsWith('/\\')) {
    return fallback;
  }

  if (/[\u0000-\u001f\u007f\\]/.test(next)) {
    return fallback;
  }

  return next;
}
