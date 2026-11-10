import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  requestPasswordReset,
  signUpWithPassword,
  updatePasswordWithRecovery,
} from '../../src/lib/auth/supabase-auth';

const registration = {
  email: 'ana@correo.edu.sv',
  password: 'una-clave-segura',
  displayName: 'Ana Pérez',
  acceptsPrivacy: true,
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

const user = { id: '11111111-1111-4111-8111-111111111111', aud: 'authenticated', email: registration.email };

describe('funciones de cuenta de Supabase Auth', () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'http://auth.test');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon-key');
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('el registro sin sesión pide confirmar el correo', async () => {
    fetchMock.mockResolvedValueOnce(json({ ...user, identities: [] }));

    await expect(signUpWithPassword(registration)).resolves.toEqual({ status: 'confirm-email' });
  });

  it('el registro con sesión devuelve los tokens y no envía rol', async () => {
    fetchMock
      .mockResolvedValueOnce(
        json({ access_token: 'a.b.c', token_type: 'bearer', expires_in: 3600, refresh_token: 'r', user }),
      )
      .mockResolvedValueOnce(json([]));

    const result = await signUpWithPassword(registration);

    expect(result).toEqual({
      status: 'signed-in',
      userId: user.id,
      tokens: { accessToken: 'a.b.c', refreshToken: 'r', expiresIn: 3600 },
    });

    const signUpBody = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body));

    expect(signUpBody.email).toBe(registration.email);
    expect(JSON.stringify(signUpBody)).not.toMatch(/role/i);
  });

  it('un rechazo de Auth se informa sin revelar el motivo', async () => {
    fetchMock.mockResolvedValueOnce(json({ code: 'user_already_exists', msg: 'User already registered' }, 422));

    const result = await signUpWithPassword(registration);

    expect(result.status).toBe('error');
    expect(JSON.stringify(result)).not.toMatch(/already registered/i);
  });

  it('un fallo de red en el registro es un error y no una excepción', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('network'));

    expect((await signUpWithPassword(registration)).status).toBe('error');
  });

  it('requestPasswordReset no revela errores ni fallos de red', async () => {
    fetchMock.mockResolvedValueOnce(json({ msg: 'User not found' }, 404));
    await expect(requestPasswordReset('nadie@correo.com')).resolves.toBeUndefined();

    fetchMock.mockRejectedValueOnce(new TypeError('network'));
    await expect(requestPasswordReset('nadie@correo.com')).resolves.toBeUndefined();
  });

  it('updatePasswordWithRecovery usa el token de recuperación y reporta el resultado', async () => {
    fetchMock.mockResolvedValueOnce(json(user));

    await expect(updatePasswordWithRecovery('token-de-recuperacion', 'otra-clave-segura')).resolves.toEqual({ ok: true });

    const [url, init] = fetchMock.mock.calls[0] ?? [];

    expect(String(url)).toBe('http://auth.test/auth/v1/user');
    expect(init?.method).toBe('PUT');
    expect((init?.headers as Record<string, string>).Authorization).toBe('Bearer token-de-recuperacion');

    fetchMock.mockResolvedValueOnce(json({ msg: 'invalid JWT' }, 401));
    await expect(updatePasswordWithRecovery('vencido', 'otra-clave-segura')).resolves.toEqual({ ok: false });

    fetchMock.mockRejectedValueOnce(new TypeError('network'));
    await expect(updatePasswordWithRecovery('token', 'otra-clave-segura')).resolves.toEqual({ ok: false });
  });

  it('sin configuración de Auth ninguna función llama a la red', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '');

    expect((await signUpWithPassword(registration)).status).toBe('error');
    await expect(requestPasswordReset('ana@correo.com')).resolves.toBeUndefined();
    await expect(updatePasswordWithRecovery('token', 'otra-clave-segura')).resolves.toEqual({ ok: false });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
