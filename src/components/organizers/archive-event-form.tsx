'use client';

import { archiveEventAction } from '@/features/organizers/actions';
import { buttonVariants } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';

export function ArchiveEventForm({ eventId, title }: { eventId: string; title: string }) {
  return (
    <form action={archiveEventAction} onSubmit={(event) => {
      if (!window.confirm(`¿Archivar “${title}”? Dejará de aparecer en el catálogo, pero se conservarán sus órdenes y boletos.`)) {
        event.preventDefault();
      }
    }}>
      <input type="hidden" name="eventId" value={eventId} />
      <button type="submit" aria-label={`Archivar ${title}`} className={`${buttonVariants({ variant: 'secundario' })} min-h-9 gap-1.5 px-3 py-1 text-xs`}>
        <Icon name="archive" size={16} />
        Archivar
      </button>
    </form>
  );
}
