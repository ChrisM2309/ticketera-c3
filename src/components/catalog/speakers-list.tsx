import { Icon } from '@/components/ui/icon';
import type { Speaker } from '@/features/catalog/types';

/** Ponentes del evento (nombre y, si existe, cargo). Sin ponentes no se muestra la sección. */
export function SpeakersList({ speakers }: Readonly<{ speakers: Speaker[] }>) {
  if (speakers.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="ponentes" className="flex flex-col gap-3">
      <h2 id="ponentes" className="font-titulo text-2xl font-bold">
        Ponentes
      </h2>
      <ul className="grid gap-3 sm:grid-cols-2">
        {speakers.map((speaker, index) => (
          <li
            key={`${speaker.name}-${index}`}
            className="flex items-center gap-3 rounded-lg bg-superficie p-4 shadow-sm"
          >
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-superficie-sutil text-texto">
              <Icon name="user" size={20} />
            </span>
            <div className="min-w-0">
              <p className="font-titulo text-base font-semibold leading-6 text-texto">{speaker.name}</p>
              {speaker.role ? (
                <p className="font-texto text-sm leading-5 text-texto-suave">{speaker.role}</p>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
