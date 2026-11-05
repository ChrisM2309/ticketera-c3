'use client';

import { useActionState } from 'react';

import { signInAction, type SignInState } from '@/features/auth/actions';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';
import { fieldClass } from '@/components/ui/field';

type LoginFormProps = {
  next: string;
};

const initialState: SignInState = {};

const inputClass = fieldClass;

export function LoginForm({ next }: LoginFormProps) {
  const [state, formAction, isPending] = useActionState(signInAction, initialState);

  return (
    <form action={formAction} noValidate className="flex flex-col gap-5">
      <input type="hidden" name="next" value={next} />

      {state.message ? (
        <p role="alert" className="rounded-md bg-superficie-sutil p-3 font-texto text-sm leading-6 text-error">
          {state.message}
        </p>
      ) : null}

      <div className="flex flex-col gap-2">
        <label htmlFor="login-email" className="font-texto text-sm font-medium text-texto">
          Correo electrónico
        </label>
        <input
          id="login-email"
          name="email"
          type="email"
          autoComplete="username"
          required
          maxLength={254}
          defaultValue={state.email ?? ''}
          aria-invalid={Boolean(state.fieldErrors?.email)}
          aria-describedby={state.fieldErrors?.email ? 'login-email-error' : undefined}
          className={inputClass}
        />
        {state.fieldErrors?.email ? (
          <p id="login-email-error" className="font-texto text-sm leading-6 text-error">
            {state.fieldErrors.email}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="login-password" className="font-texto text-sm font-medium text-texto">
          Contraseña
        </label>
        <input
          id="login-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          maxLength={256}
          aria-invalid={Boolean(state.fieldErrors?.password)}
          aria-describedby={state.fieldErrors?.password ? 'login-password-error' : undefined}
          className={inputClass}
        />
        {state.fieldErrors?.password ? (
          <p id="login-password-error" className="font-texto text-sm leading-6 text-error">
            {state.fieldErrors.password}
          </p>
        ) : null}
      </div>

      <button
        type="submit"
        disabled={isPending}
        className={cn(buttonVariants({ variant: 'primario', size: 'lg' }), 'w-full')}
      >
        {isPending ? 'Ingresando…' : 'Ingresar'}
      </button>
    </form>
  );
}
