import { Icon } from '@/components/ui/icon';

export type SimulatedDeliveryItem = {
  channel: 'email' | 'whatsapp';
  destinationMasked: string;
};

/** Texto de cada envío simulado; el destino siempre llega enmascarado desde el servidor. */
export function deliveryText({ channel, destinationMasked }: SimulatedDeliveryItem): string {
  return channel === 'whatsapp'
    ? `Boleto enviado por WhatsApp a ${destinationMasked} · Simulado`
    : `Boleto enviado a ${destinationMasked} · Simulado`;
}

/** Lista de envíos del boleto. No se envía nada real: es el registro del outbox de demostración. */
export function SimulatedDelivery({ deliveries }: Readonly<{ deliveries: SimulatedDeliveryItem[] }>) {
  if (deliveries.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="delivery-title" className="flex flex-col gap-3 print:hidden">
      <h2 id="delivery-title" className="font-titulo text-xl font-bold">
        Envío del boleto
      </h2>
      <ul className="flex flex-col gap-2 font-texto text-sm">
        {deliveries.map((delivery) => (
          <li key={delivery.channel} className="flex items-center gap-2">
            <Icon name={delivery.channel === 'whatsapp' ? 'message' : 'mail'} size={16} tone="suave" />
            {deliveryText(delivery)}
          </li>
        ))}
      </ul>
      <p className="font-texto text-sm text-texto-suave">
        Envío simulado: en esta demostración no se manda ningún mensaje real.
      </p>
    </section>
  );
}
