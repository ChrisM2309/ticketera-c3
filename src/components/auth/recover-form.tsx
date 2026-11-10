'use client';

import Link from 'next/link';
import { useActionState } from 'react';

import { requestResetAction, type RequestResetState } from '@/features/auth/actions';
import { buttonVariants } from '@/components/ui/button';
import { fieldClass } from '@/components/ui/field';
import { Icon } from '@/components/ui/icon';
import { signInPath } from '@/lib/auth/access';
import { cn } from '@/lib/utils';

const initialState: RequestResetState = {};

export function RecoverForm() {
  const [state, formAction, isPending] = useActionState(requestResetAction, initialState);

  return (
    <form action={formAction} noValidate className="flex flex-col gap-5">
      {state.sent && state.message ? (
        <p
          role="status"
          className="flex items-start gap-3 rounded-md bg-superficie-sutil p-3 font-texto text-sm leading-6 text-texto"
        >
          <Icon name="mail" tone="accion" />
          <span>{state.message}</span>
        </p>
      ) : null}

      <div className="flex flex-col gap-2">
        <label htmlFor="recover-email" className="font-texto text-sm font-medium text-texto">
          Correo electrónico
        </label>
        <input
          id="recover-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          maxLength={254}
          defaultValue={state.email ?? ''}
          aria-invalid={Boolean(state.fieldError)}
          aria-describedby={state.fieldError ? 'recover-email-error' : undefined}
          className={fieldClass}
        />
        {state.fieldError ? (
          <p id="recover-email-error" className="font-texto text-sm leading-6 text-error">
            {state.fieldError}
          </p>
        ) : null}
      </div>

      <button
        type="submit"
        disabled={isPending}
        className={cn(buttonVariants({ variant: 'primario', size: 'lg' }), 'w-full')}
      >
        {isPending ? 'Enviando…' : 'Enviar enlace'}
      </button>

      <Link
        href={signInPath}
        className="inline-flex min-h-11 items-center font-titulo text-sm font-semibold text-enlace underline-offset-4 hover:underline"
      >
        Volver a ingresar
      </Link>
    </form>
  );
}
