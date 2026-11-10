import { describe, expect, it } from 'vitest';

import { deriveCheckoutToken, getCheckoutTokenSecret } from '../../src/features/checkout/token';

const requestId = '33333333-3333-4333-8333-333333333333';
const otherRequestId = '44444444-4444-4444-8444-444444444444';

describe('token de checkout derivado', () => {
  it('es determinista', () => {
    expect(deriveCheckoutToken('secreto-de-prueba', requestId)).toBe(
      deriveCheckoutToken('secreto-de-prueba', requestId),
    );
  });

  it('tiene 43 caracteres base64url', () => {
    expect(deriveCheckoutToken('secreto-de-prueba', requestId)).toMatch(/^[A-Za-z0-9_-]{43}$/);
  });

  it('cambia con otro request id y con otro secreto', () => {
    const base = deriveCheckoutToken('secreto-de-prueba', requestId);

    expect(deriveCheckoutToken('secreto-de-prueba', otherRequestId)).not.toBe(base);
    expect(deriveCheckoutToken('otro-secreto', requestId)).not.toBe(base);
  });

  it('lanza con secreto vacío', () => {
    expect(() => deriveCheckoutToken('', requestId)).toThrow();
  });
});

describe('secreto del token de checkout', () => {
  it('usa el secreto configurado', () => {
    expect(getCheckoutTokenSecret({ CHECKOUT_TOKEN_SECRET: 'real', NODE_ENV: 'production' })).toBe('real');
  });

  it('en producción falla de forma explícita si falta', () => {
    expect(() => getCheckoutTokenSecret({ NODE_ENV: 'production' })).toThrow(/CHECKOUT_TOKEN_SECRET/);
  });

  it('fuera de producción usa un valor local de desarrollo', () => {
    expect(getCheckoutTokenSecret({ NODE_ENV: 'development' })).not.toBe('');
    expect(getCheckoutTokenSecret({})).not.toBe('');
  });
});
