'use client';

import { useState, useTransition } from 'react';

import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import { submitSurveyAction } from '@/features/ticketing/survey-actions';

export function SurveyForm({ orderId, token }: { orderId: string; token: string }) {
  const [rating, setRating] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const [isPending, startTransition] = useTransition();

  function submit(formData: FormData) {
    if (rating === null) {
      setMessage('Elige una calificación del 1 al 5.');
      return;
    }
    formData.set('orderId', orderId);
    formData.set('token', token);
    formData.set('rating', String(rating));
    startTransition(async () => {
      const result = await submitSurveyAction(formData);
      setMessage(result.ok ? 'Gracias por compartir tu experiencia.' : result.message);
    });
  }

  return (
    <form action={submit} className="flex flex-col gap-5 rounded-xl bg-superficie p-6">
      <fieldset className="flex flex-col gap-3">
        <legend className="font-texto font-semibold">¿Cómo calificas tu experiencia?</legend>
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={rating === value}
              onClick={() => setRating(value)}
              className={cn(
                'min-h-11 min-w-11 rounded-md border px-3 font-texto font-semibold',
                rating === value ? 'border-accion bg-accion text-texto-inverso' : 'border-borde bg-superficie text-texto',
              )}
            >
              {value}
              <span className="sr-only">{value === 1 ? ' estrella' : ' estrellas'}</span>
            </button>
          ))}
        </div>
      </fieldset>
      <label className="flex flex-col gap-2 font-texto text-sm font-medium">
        Comentario opcional
        <textarea name="comment" maxLength={500} rows={4} className="rounded-md border border-borde bg-superficie p-3 font-normal" />
      </label>
      <button type="submit" disabled={isPending} className={cn(buttonVariants({ variant: 'compra' }), 'self-start')}>
        Enviar respuesta DEMO
      </button>
      {message ? <p role="status" className="font-texto text-sm text-texto-suave">{message}</p> : null}
    </form>
  );
}
