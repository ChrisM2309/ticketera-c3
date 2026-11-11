'use server';

import { randomBytes } from 'node:crypto';

import { redirect } from 'next/navigation';

import { requireRole } from '@/lib/auth/require-role';

import { readPublishForm, publishPath } from './form';
import { buildEventSlug, parsePublishInput, type PublishFieldErrors } from './publish';

export type PublishState = {
  message?: string;
  fieldErrors?: PublishFieldErrors;
  values?: Record<string, string>;
};

function valuesFrom(formData: FormData): Record<string, string> {
  const values: Record<string, string> = {};

  for (const [key, value] of formData.entries()) {
    if (typeof value === 'string') {
      values[key] = value;
    }
  }

  return values;
}

export async function publishEventAction(_previous: PublishState, formData: FormData): Promise<PublishState> {
  // El rol se valida en el servidor; el formulario nunca decide a qué organizador pertenece el evento.
  const account = await requireRole('organizer', publishPath);
  const parsed = parsePublishInput(readPublishForm(formData), new Date());

  if (!parsed.valid) {
    return {
      message: 'Revisa los campos marcados.',
      fieldErrors: parsed.fieldErrors,
      values: valuesFrom(formData),
    };
  }

  const organizersResult = await account.client
    .from('organizers')
    .select('id')
    .eq('owner_user_id', account.userId)
    .order('created_at', { ascending: true })
    .limit(1);

  const organizer = organizersResult.data?.[0];

  if (organizersResult.error || !organizer) {
    return {
      message: 'Tu cuenta todavía no está asociada a un organizador. Pide a la administración que la vincule.',
      values: valuesFrom(formData),
    };
  }

  const data = parsed.data;
  const suffix = randomBytes(3).toString('hex');
  const { error } = await account.client.rpc('create_organizer_event', {
    p_organizer_id: organizer.id,
    p_slug: buildEventSlug(data.title, suffix),
    p_title: data.title,
    p_description: data.description,
    p_agenda: data.agenda,
    p_mode: data.mode,
    p_venue: data.venue,
    p_image_path: data.imageUrl,
    p_starts_at: data.startsAt,
    p_ends_at: data.endsAt,
    p_event_type_id: data.eventTypeId,
    p_topic_id: data.topicId,
    p_location_id: data.locationId,
    p_speakers: data.speakers,
    p_includes_certificate: data.includesCertificate,
    p_ticket_types: data.ticketTypes.map((ticket) => ({
      name: ticket.name,
      price_cents: ticket.priceCents,
      quantity_total: ticket.quantityTotal,
      max_per_order: ticket.maxPerOrder,
    })),
  });

  if (error) {
    return {
      message: error.code === '22023' ? error.message : 'No pudimos guardar el evento. Intenta nuevamente.',
      values: valuesFrom(formData),
    };
  }

  redirect('/panel/?evento=en-revision');
}

export async function updateEventAction(_previous: PublishState, formData: FormData): Promise<PublishState> {
  const eventId = String(formData.get('eventId') ?? '');
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(eventId)) {
    return { message: 'No encontramos el evento que quieres editar.' };
  }
  const account = await requireRole('organizer', '/panel/');
  const raw = readPublishForm(formData);
  // La edición conserva los tipos de entrada y precios actuales; el parser común valida el resto.
  raw.tickets = [{ name: 'Entrada conservada', price: '0', quantity: '1', maxPerOrder: '1' }];
  const parsed = parsePublishInput(raw, new Date());

  if (!parsed.valid) {
    return { message: 'Revisa los campos marcados.', fieldErrors: parsed.fieldErrors, values: valuesFrom(formData) };
  }

  const data = parsed.data;
  const { error } = await account.client.rpc('organizer_update_event_details', {
    p_event_id: eventId,
    p_details: {
      title: data.title,
      description: data.description,
      agenda: data.agenda,
      mode: data.mode,
      venue: data.venue,
      location_id: data.locationId,
      event_type_id: data.eventTypeId,
      topic_id: data.topicId,
      image_path: data.imageUrl,
      starts_at: data.startsAt,
      ends_at: data.endsAt,
      speakers: data.speakers,
      includes_certificate: data.includesCertificate,
    },
  });

  if (error) {
    return { message: error.code === '42501' ? 'No tienes permiso para editar este evento.' : 'No pudimos guardar los cambios. Intenta nuevamente.', values: valuesFrom(formData) };
  }

  redirect('/panel/?evento=actualizado');
}

export async function archiveEventAction(formData: FormData): Promise<void> {
  const eventId = String(formData.get('eventId') ?? '');
  const account = await requireRole('organizer', '/panel/');

  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(eventId)) {
    redirect('/panel/?evento=no-encontrado');
  }

  const { error } = await account.client.rpc('organizer_archive_event', { p_event_id: eventId });
  if (error) redirect('/panel/?evento=no-archivado');
  redirect('/panel/?evento=archivado');
}
