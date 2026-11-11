'use client';

import Link from 'next/link';
import { useActionState, useEffect, useState } from 'react';

import { setNewPasswordAction, type NewPasswordState } from '@/features/auth/actions';
import { parseRecoveryFragment, type RecoveryFragment } from '@/features/auth/validation';
import { buttonVariants } from '@/components/ui/button';
import { fieldClass } from '@/components/ui/field';
import { Icon } from '@/components/ui/icon';
import { signInPath } from '@/lib/auth/access';
import { cn } from '@/lib/utils';

const initialState: NewPasswordState = {};

type LinkState = RecoveryFragment | { kind: 'reading' };

/**
 * El token de recuperación llega en el fragmento de la URL (`#access_token=…&type=recovery`), que el
 * servidor nunca recibe. Esta pantalla lo lee en el navegador, lo quita de la barra de direcciones y
 * lo envía solo a `setNewPasswordAction`.
 */
export function NewPasswordForm() {
  const [state, formAction, isPending] = useActionState(setNewPasswordAction, initialState);
  const [link, setLink] = useState<LinkState>({ kind: 'reading' });

  useEffect(() => {
    const parsed = parseRecoveryFragment(window.location.hash);

    if (window.location.hash) {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }

    // Lectura única del fragmento tras montar: el servidor no puede conocerlo, por eso va en un efecto.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLink(parsed);
  }, []);

  if (state.done) {
    return (
      <div role="status" className="flex flex-col gap-4">
        <p className="flex items-start gap-3 font-texto text-base leading-7 text-texto">
          <Icon name="check" size={24} tone="exito" />
          <span>Cambiamos tu contraseña. Ya puedes ingresar con la nueva.</span>
        </p>
        <Link href={signInPath} className={cn(buttonVariants({ variant: 'primario', size: 'lg' }), 'w-full')}>
          Ir a ingresar
        </Link>
      </div>
    );
  }

  if (link.kind === 'reading') {
    return (
      <p role="status" className="font-texto text-sm leading-6 text-texto-suave">
        Comprobando el enlace…
      </p>
    );
  }

  if (link.kind === 'invalid') {
    return (
      <div className="flex flex-col gap-4">
        <p role="alert" className="rounded-md bg-superficie-sutil p-3 font-texto text-sm leading-6 text-error">
          Este enlace no es válido o ya venció. Pide uno nuevo para cambiar tu contraseña.
        </p>
        <Link href="/recuperar/" className={cn(buttonVariants({ variant: 'primario', size: 'lg' }), 'w-full')}>
          Pedir un enlace nuevo
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} noValidate className="flex flex-col gap-5">
      <input type="hidden" name="accessToken" value={link.accessToken} />

      {state.message ? (
        <p role="alert" className="rounded-md bg-superficie-sutil p-3 font-texto text-sm leading-6 text-error">
          {state.message}{' '}
          <Link href="/recuperar/" className="font-semibold text-enlace underline underline-offset-4">
            Pedir un enlace nuevo
          </Link>
        </p>
      ) : null}

      <div className="flex flex-col gap-2">
        <label htmlFor="new-password" className="font-texto text-sm font-medium text-texto">
          Contraseña nueva
        </label>
        <input
          id="new-password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          maxLength={72}
          aria-invalid={Boolean(state.fieldError)}
          aria-describedby={state.fieldError ? 'new-password-hint new-password-error' : 'new-password-hint'}
          className={fieldClass}
        />
        <p id="new-password-hint" className="font-texto text-sm leading-6 text-texto-suave">
          De 8 a 72 caracteres.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="confirm-password" className="font-texto text-sm font-medium text-texto">
          Repite la contraseña
        </label>
        <input
          id="confirm-password"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          maxLength={72}
          aria-invalid={Boolean(state.fieldError)}
          aria-describedby={state.fieldError ? 'new-password-error' : undefined}
          className={fieldClass}
        />
        {state.fieldError ? (
          <p id="new-password-error" className="font-texto text-sm leading-6 text-error">
            {state.fieldError}
          </p>
        ) : null}
      </div>

      <button
        type="submit"
        disabled={isPending}
        className={cn(buttonVariants({ variant: 'primario', size: 'lg' }), 'w-full')}
      >
        {isPending ? 'Guardando…' : 'Cambiar contraseña'}
      </button>
    </form>
  );
}
