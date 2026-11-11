/**
 * Alta de organizadores por el administrador (CP-09): validación pura del formulario. No importa nada de
 * Next ni de Supabase: se prueba en `tests/unit` y se repite en el servidor (`link-actions.ts`), porque las
 * Server Actions también se invocan con un POST directo. La función SQL `admin_link_organizer` repite los
 * mismos límites.
 */

export const adminOrganizersPath = '/admin/organizadores/';

export const organizerNameMinLength = 3;
export const organizerNameMaxLength = 120;
export const organizerSlugMaxLength = 80;
export const organizerDescriptionMaxLength = 500;
export const ownerEmailMaxLength = 254;

const slugPattern = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const emailPattern = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export type OrganizerLinkData = {
  name: string;
  slug: string;
  description: string | null;
  ownerEmail: string;
};

export type OrganizerLinkField = keyof OrganizerLinkData;
export type OrganizerLinkErrors = Partial<Record<OrganizerLinkField, string>>;

export type OrganizerLinkResult =
  | { valid: true; data: OrganizerLinkData }
  | { valid: false; errors: OrganizerLinkErrors };

export const slugErrorMessage =
  'Usa minúsculas, números y guiones simples (por ejemplo: comunidad-tech-sv), hasta 80 caracteres.';
export const unknownOwnerMessage = 'No existe una cuenta con ese correo. La persona debe registrarse primero.';
export const slugTakenMessage = 'Ese identificador de URL ya está en uso. Prueba con otro.';

function asRecord(input: unknown): Record<string, unknown> {
  return typeof input === 'object' && input !== null && !Array.isArray(input) ? (input as Record<string, unknown>) : {};
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

export function validateOrganizerLink(input: unknown): OrganizerLinkResult {
  const raw = asRecord(input);
  const name = text(raw.name);
  const slug = text(raw.slug);
  const description = text(raw.description);
  const ownerEmail = text(raw.ownerEmail).toLowerCase();
  const errors: OrganizerLinkErrors = {};

  if (name.length < organizerNameMinLength || name.length > organizerNameMaxLength) {
    errors.name = `Ingresa el nombre de la organización (de ${organizerNameMinLength} a ${organizerNameMaxLength} caracteres).`;
  }

  if (slug.length > organizerSlugMaxLength || !slugPattern.test(slug)) {
    errors.slug = slugErrorMessage;
  }

  if (description.length > organizerDescriptionMaxLength) {
    errors.description = `La descripción puede tener hasta ${organizerDescriptionMaxLength} caracteres.`;
  }

  if (ownerEmail.length > ownerEmailMaxLength || !emailPattern.test(ownerEmail)) {
    errors.ownerEmail = 'Ingresa el correo electrónico de la cuenta que será dueña.';
  }

  if (Object.keys(errors).length > 0) {
    return { valid: false, errors };
  }

  return { valid: true, data: { name, slug, description: description === '' ? null : description, ownerEmail } };
}
