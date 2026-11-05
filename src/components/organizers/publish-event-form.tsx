'use client';

import { useActionState, useState, type ChangeEvent } from 'react';

import { publishEventAction, type PublishState } from '@/features/organizers/actions';
import { maxTicketTypes, type PublishFieldErrors } from '@/features/organizers/publish';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';
import { fieldClass } from '@/components/ui/field';

export type FormOption = { id: string; name: string };

type PublishEventFormProps = {
  eventTypes: FormOption[];
  topics: FormOption[];
  locations: FormOption[];
};

const initialState: PublishState = {};

const inputClass = fieldClass;

const labelClass = 'font-titulo text-sm font-semibold';

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) {
    return null;
  }

  return (
    <p id={id} role="alert" className="font-texto text-sm text-error">
      {message}
    </p>
  );
}

export function PublishEventForm({ eventTypes, topics, locations }: PublishEventFormProps) {
  const [state, formAction, isPending] = useActionState(publishEventAction, initialState);
  const [values, setValues] = useState<Record<string, string>>({ mode: 'presencial' });
  const errors: PublishFieldErrors = state.fieldErrors ?? {};
  const isVirtual = (values.mode ?? 'presencial') === 'virtual';

  function onChange(event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setValues((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  function valueOf(name: string) {
    return values[name] ?? state.values?.[name] ?? '';
  }

  return (
    <form action={formAction} className="flex flex-col gap-8 rounded-lg bg-superficie p-6 shadow-sm" noValidate>
      {state.message ? (
        <p role="alert" className="rounded-md bg-superficie-sutil p-3 font-texto text-sm leading-6 text-error">
          {state.message}
        </p>
      ) : null}

      <fieldset className="flex flex-col gap-5">
        <legend className="font-titulo text-xl font-bold">Datos del evento</legend>

        <div className="flex flex-col gap-2">
          <label htmlFor="title" className={labelClass}>Título</label>
          <input
            id="title"
            name="title"
            type="text"
            required
            maxLength={160}
            value={valueOf('title')}
            onChange={onChange}
            aria-invalid={Boolean(errors.title)}
            aria-describedby={errors.title ? 'title-error' : undefined}
            className={inputClass}
          />
          <FieldError id="title-error" message={errors.title} />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="description" className={labelClass}>Descripción</label>
          <textarea
            id="description"
            name="description"
            rows={5}
            required
            maxLength={4000}
            value={valueOf('description')}
            onChange={onChange}
            aria-invalid={Boolean(errors.description)}
            aria-describedby={errors.description ? 'description-error' : undefined}
            className={cn(inputClass, 'py-2')}
          />
          <FieldError id="description-error" message={errors.description} />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="agenda" className={labelClass}>Agenda (opcional)</label>
          <textarea
            id="agenda"
            name="agenda"
            rows={4}
            maxLength={4000}
            value={valueOf('agenda')}
            onChange={onChange}
            aria-invalid={Boolean(errors.agenda)}
            className={cn(inputClass, 'py-2')}
          />
          <FieldError id="agenda-error" message={errors.agenda} />
        </div>

        <div className="grid min-w-0 gap-5 sm:grid-cols-[repeat(2,minmax(0,1fr))] [&>*]:min-w-0">
          <div className="flex flex-col gap-2">
            <label htmlFor="eventTypeId" className={labelClass}>Tipo de evento</label>
            <select
              id="eventTypeId"
              name="eventTypeId"
              required
              value={valueOf('eventTypeId')}
              onChange={onChange}
              aria-invalid={Boolean(errors.eventTypeId)}
              aria-describedby={errors.eventTypeId ? 'eventTypeId-error' : undefined}
              className={inputClass}
            >
              <option value="">Elige un tipo</option>
              {eventTypes.map((option) => (
                <option key={option.id} value={option.id}>{option.name}</option>
              ))}
            </select>
            <FieldError id="eventTypeId-error" message={errors.eventTypeId} />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="topicId" className={labelClass}>Tema (opcional)</label>
            <select
              id="topicId"
              name="topicId"
              value={valueOf('topicId')}
              onChange={onChange}
              aria-invalid={Boolean(errors.topicId)}
              className={inputClass}
            >
              <option value="">Sin tema</option>
              {topics.map((option) => (
                <option key={option.id} value={option.id}>{option.name}</option>
              ))}
            </select>
            <FieldError id="topicId-error" message={errors.topicId} />
          </div>
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-5">
        <legend className="font-titulo text-xl font-bold">Fecha y lugar</legend>

        <div className="flex flex-col gap-2">
          <label htmlFor="mode" className={labelClass}>Modalidad</label>
          <select id="mode" name="mode" value={valueOf('mode')} onChange={onChange} className={inputClass}>
            <option value="presencial">Presencial</option>
            <option value="virtual">En línea</option>
          </select>
          <FieldError id="mode-error" message={errors.mode} />
        </div>

        {isVirtual ? null : (
          <div className="grid min-w-0 gap-5 sm:grid-cols-[repeat(2,minmax(0,1fr))] [&>*]:min-w-0">
            <div className="flex flex-col gap-2">
              <label htmlFor="locationId" className={labelClass}>Ciudad</label>
              <select
                id="locationId"
                name="locationId"
                value={valueOf('locationId')}
                onChange={onChange}
                aria-invalid={Boolean(errors.locationId)}
                aria-describedby={errors.locationId ? 'locationId-error' : undefined}
                className={inputClass}
              >
                <option value="">Elige una ciudad</option>
                {locations.map((option) => (
                  <option key={option.id} value={option.id}>{option.name}</option>
                ))}
              </select>
              <FieldError id="locationId-error" message={errors.locationId} />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="venue" className={labelClass}>Lugar</label>
              <input
                id="venue"
                name="venue"
                type="text"
                maxLength={200}
                value={valueOf('venue')}
                onChange={onChange}
                aria-invalid={Boolean(errors.venue)}
                aria-describedby={errors.venue ? 'venue-error' : undefined}
                className={inputClass}
              />
              <FieldError id="venue-error" message={errors.venue} />
            </div>
          </div>
        )}

        <div className="grid min-w-0 gap-5 sm:grid-cols-[repeat(2,minmax(0,1fr))] [&>*]:min-w-0">
          <div className="flex flex-col gap-2">
            <label htmlFor="startsAt" className={labelClass}>Inicio (hora de El Salvador)</label>
            <input
              id="startsAt"
              name="startsAt"
              type="datetime-local"
              required
              value={valueOf('startsAt')}
              onChange={onChange}
              aria-invalid={Boolean(errors.startsAt)}
              aria-describedby={errors.startsAt ? 'startsAt-error' : undefined}
              className={inputClass}
            />
            <FieldError id="startsAt-error" message={errors.startsAt} />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="endsAt" className={labelClass}>Fin (opcional)</label>
            <input
              id="endsAt"
              name="endsAt"
              type="datetime-local"
              value={valueOf('endsAt')}
              onChange={onChange}
              aria-invalid={Boolean(errors.endsAt)}
              aria-describedby={errors.endsAt ? 'endsAt-error' : undefined}
              className={inputClass}
            />
            <FieldError id="endsAt-error" message={errors.endsAt} />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="imageUrl" className={labelClass}>Enlace de la portada (opcional, https)</label>
          <input
            id="imageUrl"
            name="imageUrl"
            type="url"
            maxLength={300}
            value={valueOf('imageUrl')}
            onChange={onChange}
            aria-invalid={Boolean(errors.imageUrl)}
            aria-describedby={errors.imageUrl ? 'imageUrl-error' : undefined}
            className={inputClass}
          />
          <FieldError id="imageUrl-error" message={errors.imageUrl} />
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-5">
        <legend className="font-titulo text-xl font-bold">Tipos de entrada</legend>
        <p className="font-texto text-sm leading-6 text-texto-suave">
          Precio en dólares, por ejemplo 12.50, o 0 para gratis. Deja vacía una fila que no uses.
        </p>
        <FieldError id="tickets-error" message={errors.tickets} />

        {Array.from({ length: maxTicketTypes }, (_, index) => (
          <div
            key={index}
            className="grid min-w-0 gap-3 rounded-md border border-borde p-4 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] [&>*]:min-w-0"
          >
            <div className="flex flex-col gap-2">
              <label htmlFor={`ticket-${index}-name`} className={labelClass}>Nombre</label>
              <input
                id={`ticket-${index}-name`}
                name={`ticket-${index}-name`}
                type="text"
                maxLength={80}
                value={valueOf(`ticket-${index}-name`)}
                onChange={onChange}
                className={inputClass}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor={`ticket-${index}-price`} className={labelClass}>Precio (USD)</label>
              <input
                id={`ticket-${index}-price`}
                name={`ticket-${index}-price`}
                type="text"
                inputMode="decimal"
                value={valueOf(`ticket-${index}-price`)}
                onChange={onChange}
                className={inputClass}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor={`ticket-${index}-quantity`} className={labelClass}>Cupo</label>
              <input
                id={`ticket-${index}-quantity`}
                name={`ticket-${index}-quantity`}
                type="text"
                inputMode="numeric"
                value={valueOf(`ticket-${index}-quantity`)}
                onChange={onChange}
                className={inputClass}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor={`ticket-${index}-max`} className={labelClass}>Máximo por orden</label>
              <input
                id={`ticket-${index}-max`}
                name={`ticket-${index}-max`}
                type="text"
                inputMode="numeric"
                placeholder="10"
                value={valueOf(`ticket-${index}-max`)}
                onChange={onChange}
                className={inputClass}
              />
            </div>
          </div>
        ))}
      </fieldset>

      <button
        type="submit"
        disabled={isPending}
        className={cn(buttonVariants({ variant: 'compra', size: 'lg' }), 'w-full')}
      >
        {isPending ? 'Enviando…' : 'Enviar para revisión'}
      </button>
    </form>
  );
}
