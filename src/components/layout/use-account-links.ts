'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

import { accountLinksFor, type MenuItem } from '@/lib/navigation';

/** La cabecera de escritorio y el menú móvil preguntan a la vez: comparten una sola petición en curso. */
let inFlight: Promise<boolean | null> | null = null;

function fetchSignedIn(): Promise<boolean | null> {
  inFlight ??= fetch('/api/sesion/', { cache: 'no-store' })
    .then((response) => (response.ok ? response.json() : null))
    .then((body: { signedIn?: unknown } | null) => (body ? body.signedIn === true : null))
    // Sin respuesta (red caída): se conserva el estado actual.
    .catch(() => null)
    .finally(() => {
      inFlight = null;
    });

  return inFlight;
}

/**
 * Enlaces de la zona de cuenta de la cabecera. El HTML inicial es el de visitante (el mismo para todos y
 * cacheable); en el navegador se pregunta a /api/sesion/ si hay sesión y, si la hay, «Ingresar» pasa a
 * «Mis boletos» y «Mi cuenta». Se vuelve a preguntar al cambiar de ruta, porque ingresar o cerrar sesión
 * navega sin recargar la cabecera. Si la consulta falla, se queda el estado anterior.
 */
export function useAccountLinks(): readonly MenuItem[] {
  const pathname = usePathname();
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void fetchSignedIn().then((result) => {
      if (!cancelled && result !== null) {
        setSignedIn(result);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [pathname]);

  return accountLinksFor(signedIn);
}
