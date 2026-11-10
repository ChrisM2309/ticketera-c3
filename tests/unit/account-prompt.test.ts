import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, test } from 'vitest';

import { AccountPrompt } from '../../src/components/checkout/account-prompt';

const render = (props: { variant: 'checkout' | 'confirmation'; signedIn: boolean; next?: string }) =>
  renderToStaticMarkup(createElement(AccountPrompt, props));

/** next/link normaliza la barra final según la configuración; la prueba acepta ambas formas. */
const registerHref = (encodedNext: string) => new RegExp(`href="/registro/?\\?next=${encodedNext}"`);

describe('AccountPrompt', () => {
  test('no se muestra con sesión', () => {
    expect(render({ variant: 'checkout', signedIn: true })).toBe('');
    expect(render({ variant: 'confirmation', signedIn: true })).toBe('');
  });

  test('invita a los invitados a crear una cuenta para ver Mis boletos', () => {
    const html = render({ variant: 'confirmation', signedIn: false });

    expect(html).toContain('Crea una cuenta para ver tus boletos en Mis boletos');
  });

  test('el enlace de registro conserva el destino', () => {
    const checkout = render({ variant: 'checkout', signedIn: false });
    const confirmation = render({
      variant: 'confirmation',
      signedIn: false,
      next: '/confirmacion/3f2b6f0e-5c1a-4d7e-8b9a-1c2d3e4f5a6b/abc/',
    });

    expect(checkout).toMatch(registerHref('%2Fcheckout%2F'));
    expect(confirmation).toMatch(
      registerHref('%2Fconfirmacion%2F3f2b6f0e-5c1a-4d7e-8b9a-1c2d3e4f5a6b%2Fabc%2F'),
    );
  });

  test('un destino externo no se conserva', () => {
    const html = render({ variant: 'confirmation', signedIn: false, next: 'https://malo.example/' });

    expect(html).toMatch(registerHref('%2Fmis-boletos%2F'));
    expect(html).not.toContain('malo.example');
  });
});
