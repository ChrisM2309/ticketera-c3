import { describe, expect, test } from 'vitest';

import { validateOrganizerLink } from '../../src/features/organizers/link-form';

const valid = {
  name: 'Comunidad Tech SV',
  slug: 'comunidad-tech-sv',
  description: 'Meetups de tecnología.',
  ownerEmail: 'ana@example.com',
};

describe('validateOrganizerLink', () => {
  test('valida slug y correo', () => {
    expect(validateOrganizerLink(valid)).toEqual({ valid: true, data: valid });

    for (const slug of ['Mayusculas', 'con espacios', '-inicio', 'fin-', 'doble--guion', 'ñandú', '']) {
      const result = validateOrganizerLink({ ...valid, slug });
      expect(result.valid).toBe(false);
      expect(!result.valid && result.errors.slug).toBeTruthy();
    }

    for (const ownerEmail of ['', 'sin-arroba', 'a@b', 'a b@c.com', 'a@@c.com']) {
      const result = validateOrganizerLink({ ...valid, ownerEmail });
      expect(result.valid).toBe(false);
      expect(!result.valid && result.errors.ownerEmail).toBeTruthy();
    }
  });

  test('recorta espacios y pasa el correo a minúsculas', () => {
    const result = validateOrganizerLink({
      name: '  Comunidad Tech SV  ',
      slug: ' comunidad-tech-sv ',
      description: '  Hola  ',
      ownerEmail: '  Ana@Example.COM ',
    });

    expect(result).toEqual({
      valid: true,
      data: { name: 'Comunidad Tech SV', slug: 'comunidad-tech-sv', description: 'Hola', ownerEmail: 'ana@example.com' },
    });
  });

  test('la descripción es opcional y queda en null si está vacía', () => {
    expect(validateOrganizerLink({ ...valid, description: '' })).toMatchObject({ valid: true, data: { description: null } });
    expect(validateOrganizerLink({ ...valid, description: '   ' })).toMatchObject({ valid: true, data: { description: null } });
    expect(validateOrganizerLink({ ...valid, description: undefined })).toMatchObject({
      valid: true,
      data: { description: null },
    });
  });

  test('el nombre mide entre 3 y 120 caracteres', () => {
    expect(validateOrganizerLink({ ...valid, name: 'ab' }).valid).toBe(false);
    expect(validateOrganizerLink({ ...valid, name: 'abc' }).valid).toBe(true);
    expect(validateOrganizerLink({ ...valid, name: 'a'.repeat(120) }).valid).toBe(true);

    const long = validateOrganizerLink({ ...valid, name: 'a'.repeat(121) });
    expect(!long.valid && long.errors.name).toBeTruthy();
  });

  test('la descripción no pasa de 500 caracteres', () => {
    expect(validateOrganizerLink({ ...valid, description: 'd'.repeat(500) }).valid).toBe(true);

    const long = validateOrganizerLink({ ...valid, description: 'd'.repeat(501) });
    expect(!long.valid && long.errors.description).toBeTruthy();
  });

  test('el slug y el correo tienen un máximo de largo', () => {
    expect(validateOrganizerLink({ ...valid, slug: 'a'.repeat(80) }).valid).toBe(true);
    expect(validateOrganizerLink({ ...valid, slug: 'a'.repeat(81) }).valid).toBe(false);
    expect(validateOrganizerLink({ ...valid, ownerEmail: `${'a'.repeat(250)}@x.co` }).valid).toBe(false);
  });

  test('entradas que no son texto o un objeto inválido no lanzan y se rechazan', () => {
    for (const input of [null, undefined, 42, 'texto', [], {}]) {
      expect(validateOrganizerLink(input).valid).toBe(false);
    }

    const result = validateOrganizerLink({ name: 7, slug: ['a'], description: {}, ownerEmail: null });
    expect(result.valid).toBe(false);
    expect(!result.valid && Object.keys(result.errors).sort()).toEqual(['name', 'ownerEmail', 'slug']);
  });
});
