'use client';

import { useActionState } from 'react';

import { buttonVariants } from '@/components/ui/button';
import { fieldClass } from '@/components/ui/field';
import { Icon } from '@/components/ui/icon';
import { updateProfileAction, type ProfileState } from '@/features/accounts/profile-actions';
import { displayNameMaxLength, universityMaxLength, type ProfileData } from '@/features/accounts/profile';
import { cn } from '@/lib/utils';

type ProfileFormProps = Readonly<{
  initial: ProfileData;
  /** Fecha ya formateada del consentimiento vigente; `null` si el consentimiento está desactivado. */
  consentedOn: string | null;
}>;

const errorClass = 'font-texto text-sm leading-6 text-error';
const labelClass = 'font-texto text-sm font-medium text-texto';
const hintClass = 'font-texto text-sm leading-6 text-texto-suave';

async function submitProfile(_previous: ProfileState, formData: FormData): Promise<ProfileState> {
  return updateProfileAction(formData);
}

export function ProfileForm({ initial, consentedOn }: ProfileFormProps) {
  const [state, formAction, isPending] = useActionState(submitProfile, {});
  const errors = state.fieldErrors;
  const values = state.values ?? {
    displayName: initial.displayName,
    university: initial.university ?? '',
    marketingOptIn: initial.marketingOptIn,
  };

  return (
    <form action={formAction} noValidate className="flex flex-col gap-5">
      {state.saved ? (
        <p role="status" className="flex items-center gap-2 rounded-md bg-superficie-sutil p-3 font-texto text-sm leading-6 text-texto">
          <Icon name="check" size={16} tone="exito" />
          Guardamos tus cambios.
        </p>
      ) : null}

      {state.message ? (
        <p role="alert" className="rounded-md bg-superficie-sutil p-3 font-texto text-sm leading-6 text-error">
          {state.message}
        </p>
      ) : null}

      <div className="flex flex-col gap-2">
        <label htmlFor="profile-name" className={labelClass}>
          Nombre
        </label>
        <input
          id="profile-name"
          name="displayName"
          type="text"
          autoComplete="name"
          required
          maxLength={displayNameMaxLength}
          defaultValue={values.displayName}
          aria-invalid={Boolean(errors?.displayName)}
          aria-describedby={errors?.displayName ? 'profile-name-error' : undefined}
          className={fieldClass}
        />
        {errors?.displayName ? (
          <p id="profile-name-error" className={errorClass}>
            {errors.displayName}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="profile-university" className={labelClass}>
          Universidad (opcional)
        </label>
        <input
          id="profile-university"
          name="university"
          type="text"
          autoComplete="organization"
          maxLength={universityMaxLength}
          defaultValue={values.university}
          aria-invalid={Boolean(errors?.university)}
          aria-describedby={errors?.university ? 'profile-university-error' : undefined}
          className={fieldClass}
        />
        {errors?.university ? (
          <p id="profile-university-error" className={errorClass}>
            {errors.university}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-start gap-3">
          <input
            id="profile-marketing"
            name="marketingOptIn"
            type="checkbox"
            defaultChecked={values.marketingOptIn}
            aria-describedby="profile-marketing-hint"
            className="mt-3 size-5 shrink-0 accent-accion focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foco"
          />
          <label htmlFor="profile-marketing" className="flex min-h-11 items-center font-texto text-sm leading-6 text-texto">
            Quiero recibir novedades de eventos por correo.
          </label>
        </div>
        <p id="profile-marketing-hint" className={hintClass}>
          Es opcional y está desactivado por defecto. Podés cambiarlo cuando quieras.
          {consentedOn && !state.saved ? ` Consentimiento registrado el ${consentedOn}.` : ''}
        </p>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className={cn(buttonVariants({ variant: 'primario', size: 'lg' }), 'w-full sm:w-fit')}
      >
        {isPending ? 'Guardando…' : 'Guardar cambios'}
      </button>
    </form>
  );
}
