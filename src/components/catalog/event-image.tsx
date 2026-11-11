"use client";

import Image from 'next/image';
import { useState } from 'react';

import { fallbackCoverPath, isIllustrativeCover } from '@/features/catalog/images';

export function EventImage({ event, src, sizes }: {
  event: { id: string; imagePath: string | null; eventType: { slug: string } };
  src: string;
  sizes: string;
}) {
  const [current, setCurrent] = useState(src);
  const illustrative = current !== src || isIllustrativeCover(event);
  return <>
    <Image src={current} alt="" fill sizes={sizes} className="object-cover" unoptimized={!current.startsWith('/')}
      onError={() => { const fallback = fallbackCoverPath(event, current); if (fallback) setCurrent(fallback); }} />
    {illustrative ? <span className="absolute bottom-2 left-2 rounded-sm bg-navy/85 px-2 py-0.5 font-texto text-xs font-medium text-texto-inverso">Imagen ilustrativa</span> : null}
  </>;
}
