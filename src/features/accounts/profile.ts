/**
 * Validación pura del perfil del comprador. No importa nada de Next ni de Supabase: se prueba en `tests/unit`
 * y se repite en el servidor (`profile-actions.ts`), porque las Server Actions también se invocan con un POST directo.
 * Datos personales mínimos: nombre, universidad opcional y consentimiento de correo (desactivado por defecto).
 */

export const displayNameMinLength = 2;
export const displayNameMaxLength = 80;
export const universityMaxLength = 80;

export type ProfileData = {
  displayName: string;
  university: string | null;
  marketingOptIn: boolean;
};

export type ProfileErrors = Partial<Record<'displayName' | 'university', string>>;

export type ProfileResult = { valid: true; data: ProfileData } | { valid: false; errors: ProfileErrors };

function asRecord(input: unknown): Record<string, unknown> {
  return typeof input === 'object' && input !== null ? (input as Record<string, unknown>) : {};
}

export function validateProfile(input: unknown): ProfileResult {
  const raw = asRecord(input);
  const displayName = typeof raw.displayName === 'string' ? raw.displayName.trim() : '';
  const university = typeof raw.university === 'string' ? raw.university.trim() : '';
  const errors: ProfileErrors = {};

  if (displayName.length < displayNameMinLength || displayName.length > displayNameMaxLength) {
    errors.displayName = `Ingresa tu nombre (de ${displayNameMinLength} a ${displayNameMaxLength} caracteres).`;
  }

  if (university.length > universityMaxLength) {
    errors.university = `La universidad puede tener hasta ${universityMaxLength} caracteres.`;
  }

  if (errors.displayName || errors.university) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    data: {
      displayName,
      university: university === '' ? null : university,
      // Solo un `true` explícito activa el consentimiento.
      marketingOptIn: raw.marketingOptIn === true,
    },
  };
}
