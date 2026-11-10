import { describe, expect, it } from 'vitest';

import { parseRecoveryFragment, validateNewPassword, validateRegistration } from '../../src/features/auth/validation';

const valid = {
  email: 'Ana.Perez@Correo.edu.sv',
  password: 'una-clave-segura',
  displayName: 'Ana Pérez',
  acceptsPrivacy: true,
};

describe('validación del registro', () => {
  it('acepta un registro válido', () => {
    const result = validateRegistration(valid);

    expect(result).toEqual({
      valid: true,
      data: {
        email: 'ana.perez@correo.edu.sv',
        password: 'una-clave-segura',
        displayName: 'Ana Pérez',
        acceptsPrivacy: true,
      },
    });
  });

  it('rechaza contraseña de 7 caracteres y de 73', () => {
    const short = validateRegistration({ ...valid, password: 'a'.repeat(7) });
    const edgeLow = validateRegistration({ ...valid, password: 'a'.repeat(8) });
    const edgeHigh = validateRegistration({ ...valid, password: 'a'.repeat(72) });
    const long = validateRegistration({ ...valid, password: 'a'.repeat(73) });

    expect(short.valid).toBe(false);
    expect(long.valid).toBe(false);
    expect(edgeLow.valid).toBe(true);
    expect(edgeHigh.valid).toBe(true);
    expect(!short.valid && short.errors.password).toBeTruthy();
    expect(!long.valid && long.errors.password).toBeTruthy();
  });

  it('rechaza una contraseña que supera 72 bytes aunque tenga menos de 73 caracteres', () => {
    const result = validateRegistration({ ...valid, password: 'ñ'.repeat(40) });

    expect(result.valid).toBe(false);
  });

  it('rechaza correo sin dominio', () => {
    for (const email of ['ana', 'ana@', 'ana@correo', '@correo.com', 'ana perez@correo.com', '']) {
      const result = validateRegistration({ ...valid, email });

      expect(result.valid).toBe(false);
      expect(!result.valid && result.errors.email).toBeTruthy();
    }
  });

  it('rechaza correo de más de 254 caracteres', () => {
    const result = validateRegistration({ ...valid, email: `${'a'.repeat(250)}@x.com` });

    expect(result.valid).toBe(false);
  });

  it('exige aceptar la privacidad', () => {
    const rejected = validateRegistration({ ...valid, acceptsPrivacy: false });
    const missing = validateRegistration({ ...valid, acceptsPrivacy: undefined });
    const text = validateRegistration({ ...valid, acceptsPrivacy: 'true' });

    for (const result of [rejected, missing, text]) {
      expect(result.valid).toBe(false);
      expect(!result.valid && result.errors.acceptsPrivacy).toBeTruthy();
    }
  });

  it('rechaza nombre de 1 carácter', () => {
    const result = validateRegistration({ ...valid, displayName: ' A ' });

    expect(result.valid).toBe(false);
    expect(!result.valid && result.errors.displayName).toBeTruthy();
  });

  it('rechaza nombre de más de 80 caracteres y recorta espacios', () => {
    expect(validateRegistration({ ...valid, displayName: 'a'.repeat(81) }).valid).toBe(false);

    const trimmed = validateRegistration({ ...valid, displayName: '  Ana  ' });

    expect(trimmed.valid && trimmed.data.displayName).toBe('Ana');
  });

  it('informa todos los errores a la vez y tolera entradas que no son un objeto', () => {
    const result = validateRegistration(null);

    expect(result.valid).toBe(false);
    expect(!result.valid && Object.keys(result.errors).sort()).toEqual([
      'acceptsPrivacy',
      'displayName',
      'email',
      'password',
    ]);
  });

  it('no recorta ni normaliza la contraseña', () => {
    const result = validateRegistration({ ...valid, password: '  clave con espacios  ' });

    expect(result.valid && result.data.password).toBe('  clave con espacios  ');
  });
});

describe('validación de la nueva contraseña', () => {
  it('validateNewPassword aplica el mismo largo', () => {
    expect(validateNewPassword({ password: 'a'.repeat(7) }).valid).toBe(false);
    expect(validateNewPassword({ password: 'a'.repeat(73) }).valid).toBe(false);
    expect(validateNewPassword({ password: 'a'.repeat(8) })).toEqual({
      valid: true,
      data: { password: 'a'.repeat(8) },
    });
    expect(validateNewPassword({ password: 'a'.repeat(72) }).valid).toBe(true);
  });

  it('exige que la confirmación coincida cuando se envía', () => {
    const mismatch = validateNewPassword({ password: 'una-clave-segura', confirmPassword: 'otra-clave-distinta' });

    expect(mismatch.valid).toBe(false);
    expect(validateNewPassword({ password: 'una-clave-segura', confirmPassword: 'una-clave-segura' }).valid).toBe(true);
  });

  it('rechaza entradas que no son un objeto', () => {
    expect(validateNewPassword(undefined).valid).toBe(false);
    expect(validateNewPassword({ password: 12345678 }).valid).toBe(false);
  });
});

describe('fragmento del enlace de recuperación', () => {
  const token = 'aaa.bbb.ccc';

  it('lee el token de un fragmento de recuperación', () => {
    expect(
      parseRecoveryFragment(`#access_token=${token}&expires_in=3600&refresh_token=abc&token_type=bearer&type=recovery`),
    ).toEqual({ kind: 'ready', accessToken: token });
    expect(parseRecoveryFragment(`access_token=${token}&type=recovery`)).toEqual({ kind: 'ready', accessToken: token });
  });

  it('rechaza enlaces vencidos, de otro tipo o sin token', () => {
    expect(parseRecoveryFragment('#error=access_denied&error_code=otp_expired&error_description=vencido').kind).toBe(
      'invalid',
    );
    expect(parseRecoveryFragment(`#access_token=${token}&type=signup`).kind).toBe('invalid');
    expect(parseRecoveryFragment('#type=recovery').kind).toBe('invalid');
    expect(parseRecoveryFragment('').kind).toBe('invalid');
    expect(parseRecoveryFragment('#access_token=no-es-un-jwt&type=recovery').kind).toBe('invalid');
  });
});
