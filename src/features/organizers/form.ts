import { maxTicketTypes } from './publish';

export const publishPath = '/panel/eventos/nuevo/';

const fieldNames = [
  'title',
  'description',
  'agenda',
  'mode',
  'venue',
  'locationId',
  'eventTypeId',
  'topicId',
  'imageUrl',
  'startsAt',
  'endsAt',
] as const;

/** Lee el formulario y reúne las filas de entradas en una lista (ticket-0-name, ticket-0-price, ...). */
export function readPublishForm(formData: FormData): Record<string, unknown> {
  const input: Record<string, unknown> = {};

  for (const name of fieldNames) {
    input[name] = formData.get(name);
  }

  input.tickets = Array.from({ length: maxTicketTypes }, (_, index) => ({
    name: formData.get(`ticket-${index}-name`),
    price: formData.get(`ticket-${index}-price`),
    quantity: formData.get(`ticket-${index}-quantity`),
    maxPerOrder: formData.get(`ticket-${index}-max`),
  }));

  return input;
}
