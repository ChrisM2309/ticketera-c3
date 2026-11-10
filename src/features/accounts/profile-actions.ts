'use server';

import { accountPath } from '@/lib/auth/access';
import { requireRole } from '@/lib/auth/require-role';

import { validateProfile, type ProfileErrors } from './profile';

export type ProfileState = {
  saved?: boolean;
  message?: string;
  fieldErrors?: ProfileErrors;
  /** Lo que el usuario escribió, para no borrar el formulario cuando hay errores. */
  values?: { displayName: string; university: string; marketingOptIn: boolean };
};

const saveFailedMessage = 'No pudimos guardar tus cambios. Intentá nuevamente.';

/**
 * Guarda el perfil de la cuenta con sesión. La sesión y el rol se validan en el servidor, y la actualización
 * pasa por RLS con el token del usuario: solo puede cambiar su fila y las columnas permitidas (nombre,
 * universidad y consentimiento). `consented_at` lo fija el disparador de la base: se registra al activar
 * el consentimiento y se borra al desactivarlo.
 */
export async function updateProfileAction(formData: FormData): Promise<ProfileState> {
  const account = await requireRole('buyer', accountPath);

  const rawName = formData.get('displayName');
  const rawUniversity = formData.get('university');
  // Una casilla marcada llega como «on»; cualquier otro valor cuenta como no aceptado.
  const marketingOptIn = formData.get('marketingOptIn') === 'on';
  const values = {
    displayName: typeof rawName === 'string' ? rawName.slice(0, 200) : '',
    university: typeof rawUniversity === 'string' ? rawUniversity.slice(0, 200) : '',
    marketingOptIn,
  };

  const parsed = validateProfile({ ...values, marketingOptIn });

  if (!parsed.valid) {
    return { values, fieldErrors: parsed.errors };
  }

  const { data, error } = await account.client
    .from('profiles')
    .update({
      display_name: parsed.data.displayName,
      university: parsed.data.university,
      marketing_opt_in: parsed.data.marketingOptIn,
    })
    .eq('id', account.userId)
    .select('id');

  // RLS puede dejar la actualización en cero filas sin devolver error: tampoco cuenta como guardado.
  if (error || !data || data.length !== 1) {
    return { values, message: saveFailedMessage };
  }

  return {
    saved: true,
    values: { displayName: parsed.data.displayName, university: parsed.data.university ?? '', marketingOptIn },
  };
}
