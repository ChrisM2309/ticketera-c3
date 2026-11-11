'use server';

import { revalidatePath } from 'next/cache';

import { requireRole } from '@/lib/auth/require-role';

import {
  adminOrganizersPath,
  slugErrorMessage,
  slugTakenMessage,
  unknownOwnerMessage,
  validateOrganizerLink,
  type OrganizerLinkErrors,
} from './link-form';

export type LinkOrganizerState = {
  /** Nombre de la organización recién vinculada. */
  linked?: string;
  message?: string;
  fieldErrors?: OrganizerLinkErrors;
  /** Lo que el administrador escribió, para no borrar el formulario cuando hay errores. */
  values?: { name: string; slug: string; description: string; ownerEmail: string };
};

const failedMessage = 'No pudimos vincular al organizador. Intenta nuevamente.';

function textOf(value: FormDataEntryValue | null): string {
  return typeof value === 'string' ? value.slice(0, 1000) : '';
}

/**
 * Vincula una cuenta existente con una organización nueva. Solo el administrador llega aquí: requireRole
 * comprueba la sesión y el rol en el servidor, y la función SQL vuelve a comprobarlo con is_admin(). El rol de
 * la cuenta dueña sube de comprador a organizador dentro de esa misma función; nunca viene del formulario.
 */
export async function linkOrganizerAction(formData: FormData): Promise<LinkOrganizerState> {
  const account = await requireRole('admin', adminOrganizersPath);

  const values = {
    name: textOf(formData.get('name')),
    slug: textOf(formData.get('slug')),
    description: textOf(formData.get('description')),
    ownerEmail: textOf(formData.get('ownerEmail')),
  };

  const parsed = validateOrganizerLink(values);

  if (!parsed.valid) {
    return { values, fieldErrors: parsed.errors };
  }

  const { error } = await account.client.rpc('admin_link_organizer', {
    p_name: parsed.data.name,
    p_slug: parsed.data.slug,
    p_description: parsed.data.description,
    p_owner_email: parsed.data.ownerEmail,
  });

  if (error) {
    if (error.message.startsWith('No existe una cuenta')) {
      return { values, fieldErrors: { ownerEmail: unknownOwnerMessage } };
    }

    if (error.code === '23505') {
      return { values, fieldErrors: { slug: slugTakenMessage } };
    }

    if (error.message.includes('identificador de la URL')) {
      return { values, fieldErrors: { slug: slugErrorMessage } };
    }

    return { values, message: failedMessage };
  }

  revalidatePath(adminOrganizersPath);

  return { linked: parsed.data.name };
}
