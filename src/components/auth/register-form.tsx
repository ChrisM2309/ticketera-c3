'use client';

import Link from 'next/link';
import { useActionState } from 'react';

import { registerAction, type RegisterState } from '@/features/auth/actions';
import { buttonVariants } from '@/components/ui/button';
import { fieldClass } from '@/components/ui/field';
import { Icon } from '@/components/ui/icon';
import { signInUrl } from '@/lib/auth/access';
import { cn } from '@/lib/utils';

type RegisterFormProps = {
  next: string;
};

const initialState: RegisterState = {};

const errorClass = 'font-texto text-sm leading-6 text-error';
const labelClass = 'font-texto text-sm font-medium text-texto';
const hintClass = 'font-texto text-sm leading-6 text-texto-suave';

export function RegisterForm({ next }: RegisterFormProps) {
  const [state, formAction, isPending] = useActionState(registerAction, initialState);
  const errors = state.fieldErrors;
  const signIn = signInUrl({ next: next || undefined });

  if (state.notice === 'confirm-email') {
    return (
      <div role="status" className="flex flex-col gap-4">
        <p className="flex items-start gap-3 font-texto text-base leading-7 text-texto">
          <Icon name="mail" size={24} tone="accion" />
          <span>
            Creamos tu cuenta. Te enviamos un correo{state.email ? ` a ${state.email}` : ''} para confirmarla. Cuando lo
            confirmes, ya podés ingresar.
          </span>
        </p>
        <Link href={signIn} className={cn(buttonVariants({ variant: 'primario', size: 'lg' }), 'w-full')}>
          Ir a ingresar
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} noValidate className="flex flex-col gap-5">
      <input type="hidden" name="next" value={next} />

      {state.message ? (
        <p role="alert" className="rounded-md bg-superficie-sutil p-3 font-texto text-sm leading-6 text-error">
          {state.message}
        </p>
      ) : null}

      <div className="flex flex-col gap-2">
        <label htmlFor="register-name" className={labelClass}>
          Nombre
        </label>
        <input
          id="register-name"
          name="displayName"
          type="text"
          autoComplete="name"
          required
          maxLength={80}
          defaultValue={state.displayName ?? ''}
          aria-invalid={Boolean(errors?.displayName)}
          aria-describedby={errors?.displayName ? 'register-name-error' : undefined}
          className={fieldClass}
        />
        {errors?.displayName ? (
          <p id="register-name-error" className={errorClass}>
            {errors.displayName}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="register-email" className={labelClass}>
          Correo electrónico
        </label>
        <input
          id="register-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          maxLength={254}
          defaultValue={state.email ?? ''}
          aria-invalid={Boolean(errors?.email)}
          aria-describedby={errors?.email ? 'register-email-error' : undefined}
          className={fieldClass}
        />
        {errors?.email ? (
          <p id="register-email-error" className={errorClass}>
            {errors.email}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="register-password" className={labelClass}>
          Contraseña
        </label>
        <input
          id="register-password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          maxLength={72}
          aria-invalid={Boolean(errors?.password)}
          aria-describedby={errors?.password ? 'register-password-hint register-password-error' : 'register-password-hint'}
          className={fieldClass}
        />
        <p id="register-password-hint" className={hintClass}>
          De 8 a 72 caracteres.
        </p>
        {errors?.password ? (
          <p id="register-password-error" className={errorClass}>
            {errors.password}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-start gap-3">
          <input
            id="register-privacy"
            name="acceptsPrivacy"
            type="checkbox"
            required
            aria-invalid={Boolean(errors?.acceptsPrivacy)}
            aria-describedby={errors?.acceptsPrivacy ? 'register-privacy-error' : undefined}
            className="mt-3 size-5 shrink-0 accent-accion focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foco"
          />
          <label htmlFor="register-privacy" className="flex min-h-11 items-center font-texto text-sm leading-6 text-texto">
            <span>
              Leí y acepto la{' '}
              <Link href="/privacidad/" className="font-semibold text-enlace underline underline-offset-4">
                política de privacidad
              </Link>
              .
            </span>
          </label>
        </div>
        {errors?.acceptsPrivacy ? (
          <p id="register-privacy-error" className={errorClass}>
            {errors.acceptsPrivacy}
          </p>
        ) : null}
      </div>

      <button
        type="submit"
        disabled={isPending}
        className={cn(buttonVariants({ variant: 'primario', size: 'lg' }), 'w-full')}
      >
        {isPending ? 'Creando cuenta…' : 'Crear cuenta'}
      </button>

      <p className={cn(hintClass, 'flex flex-wrap items-center gap-x-2')}>
        ¿Ya tenés cuenta?
        <Link
          href={signIn}
          className="inline-flex min-h-11 items-center font-titulo font-semibold text-enlace underline-offset-4 hover:underline"
        >
          Ingresar
        </Link>
      </p>
    </form>
  );
}
