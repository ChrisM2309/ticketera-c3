'use client';

import { archiveEventAction } from '@/features/organizers/actions';
import { buttonVariants } from '@/components/ui/button';

export function ArchiveEventForm({ eventId, title }: { eventId: string; title: string }) {
  return (
    <form action={archiveEventAction} onSubmit={(event) => {
      if (!window.confirm(`¿Archivar “${title}”? Dejará de aparecer en el catálogo, pero se conservarán sus órdenes y boletos.`)) {
        event.preventDefault();
      }
    }}>
      <input type="hidden" name="eventId" value={eventId} />
      <button type="submit" className={buttonVariants({ variant: 'secundario' })}>Archivar</button>
    </form>
  );
}
