'use client';

import { useActionState } from 'react';

import { buttonVariants } from '@/components/ui/button';
import { fieldClass } from '@/components/ui/field';
import { Icon } from '@/components/ui/icon';
import { linkOrganizerAction, type LinkOrganizerState } from '@/features/organizers/link-actions';
import {
  organizerDescriptionMaxLength,
  organizerNameMaxLength,
  organizerSlugMaxLength,
  ownerEmailMaxLength,
} from '@/features/organizers/link-form';
import { cn } from '@/lib/utils';

const errorClass = 'font-texto text-sm leading-6 text-error';
const labelClass = 'font-texto text-sm font-medium text-texto';
const hintClass = 'font-texto text-sm leading-6 text-texto-suave';

async function submitLink(_previous: LinkOrganizerState, formData: FormData): Promise<LinkOrganizerState> {
  return linkOrganizerAction(formData);
}

export function LinkOrganizerForm() {
  const [state, formAction, isPending] = useActionState(submitLink, {});
  const errors = state.fieldErrors;
  const values = state.values ?? { name: '', slug: '', description: '', ownerEmail: '' };

  return (
    <form action={formAction} noValidate className="flex flex-col gap-5">
      {state.linked ? (
        <p role="status" className="flex items-center gap-2 rounded-md bg-superficie-sutil p-3 font-texto text-sm leading-6 text-texto">
          <Icon name="check" size={16} tone="exito" />
          Vinculamos a «{state.linked}». La cuenta dueña ya puede publicar eventos desde su panel.
        </p>
      ) : null}

      {state.message ? (
        <p role="alert" className="rounded-md bg-superficie-sutil p-3 font-texto text-sm leading-6 text-error">
          {state.message}
        </p>
      ) : null}

      <div className="flex flex-col gap-2">
        <label htmlFor="link-name" className={labelClass}>
          Nombre de la organización
        </label>
        <input
          id="link-name"
          name="name"
          type="text"
          autoComplete="off"
          required
          maxLength={organizerNameMaxLength}
          defaultValue={values.name}
          aria-invalid={Boolean(errors?.name)}
          aria-describedby={errors?.name ? 'link-name-error' : undefined}
          className={fieldClass}
        />
        {errors?.name ? (
          <p id="link-name-error" className={errorClass}>
            {errors.name}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="link-slug" className={labelClass}>
          Identificador de URL
        </label>
        <input
          id="link-slug"
          name="slug"
          type="text"
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          required
          maxLength={organizerSlugMaxLength}
          defaultValue={values.slug}
          aria-invalid={Boolean(errors?.slug)}
          aria-describedby={errors?.slug ? 'link-slug-error' : 'link-slug-hint'}
          className={fieldClass}
        />
        {errors?.slug ? (
          <p id="link-slug-error" className={errorClass}>
            {errors.slug}
          </p>
        ) : (
          <p id="link-slug-hint" className={hintClass}>
            Minúsculas, números y guiones. Ejemplo: comunidad-tech-sv.
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="link-description" className={labelClass}>
          Descripción (opcional)
        </label>
        <textarea
          id="link-description"
          name="description"
          rows={3}
          maxLength={organizerDescriptionMaxLength}
          defaultValue={values.description}
          aria-invalid={Boolean(errors?.description)}
          aria-describedby={errors?.description ? 'link-description-error' : undefined}
          className={cn(fieldClass, 'py-2')}
        />
        {errors?.description ? (
          <p id="link-description-error" className={errorClass}>
            {errors.description}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="link-owner" className={labelClass}>
          Correo de la cuenta dueña
        </label>
        <input
          id="link-owner"
          name="ownerEmail"
          type="email"
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          required
          maxLength={ownerEmailMaxLength}
          defaultValue={values.ownerEmail}
          aria-invalid={Boolean(errors?.ownerEmail)}
          aria-describedby={errors?.ownerEmail ? 'link-owner-error' : 'link-owner-hint'}
          className={fieldClass}
        />
        {errors?.ownerEmail ? (
          <p id="link-owner-error" className={errorClass}>
            {errors.ownerEmail}
          </p>
        ) : (
          <p id="link-owner-hint" className={hintClass}>
            La cuenta ya debe estar registrada. Si es compradora, pasa a ser organizadora.
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={isPending}
        className={cn(buttonVariants({ variant: 'primario', size: 'lg' }), 'w-full sm:w-fit')}
      >
        <Icon name="userPlus" />
        {isPending ? 'Vinculando…' : 'Vincular organizador'}
      </button>
    </form>
  );
}
