import { describe, expect, test } from 'vitest';

import { validateProfile } from '../../src/features/accounts/profile';

const valid = { displayName: 'Ana Pérez', university: 'Universidad de El Salvador', marketingOptIn: true };

describe('validateProfile', () => {
  test('acepta un perfil válido y recorta los espacios', () => {
    const result = validateProfile({ ...valid, displayName: '  Ana Pérez  ', university: '  UES  ' });

    expect(result).toEqual({
      valid: true,
      data: { displayName: 'Ana Pérez', university: 'UES', marketingOptIn: true },
    });
  });

  test('universidad vacía pasa a null', () => {
    const empty = validateProfile({ ...valid, university: '' });
    const blank = validateProfile({ ...valid, university: '   ' });
    const missing = validateProfile({ displayName: 'Ana Pérez' });

    expect(empty).toMatchObject({ valid: true, data: { university: null } });
    expect(blank).toMatchObject({ valid: true, data: { university: null } });
    expect(missing).toMatchObject({ valid: true, data: { university: null, marketingOptIn: false } });
  });

  test('rechaza nombre corto', () => {
    const result = validateProfile({ ...valid, displayName: ' A ' });

    expect(result.valid).toBe(false);
    expect(!result.valid && result.errors.displayName).toBeTruthy();
  });

  test('rechaza nombre y universidad demasiado largos y acepta el límite', () => {
    const longName = validateProfile({ ...valid, displayName: 'a'.repeat(81) });
    const edgeName = validateProfile({ ...valid, displayName: 'a'.repeat(80) });
    const longUniversity = validateProfile({ ...valid, university: 'u'.repeat(81) });
    const edgeUniversity = validateProfile({ ...valid, university: 'u'.repeat(80) });

    expect(longName.valid).toBe(false);
    expect(edgeName.valid).toBe(true);
    expect(!longUniversity.valid && longUniversity.errors.university).toBeTruthy();
    expect(edgeUniversity.valid).toBe(true);
  });

  test('el consentimiento de correo queda desactivado salvo que llegue activado de forma explícita', () => {
    expect(validateProfile({ ...valid, marketingOptIn: false })).toMatchObject({ data: { marketingOptIn: false } });
    expect(validateProfile({ ...valid, marketingOptIn: 'true' })).toMatchObject({ data: { marketingOptIn: false } });
    expect(validateProfile({ ...valid, marketingOptIn: undefined })).toMatchObject({ data: { marketingOptIn: false } });
  });

  test('una entrada que no es un objeto no es válida', () => {
    expect(validateProfile(null).valid).toBe(false);
    expect(validateProfile('Ana').valid).toBe(false);
  });
});
