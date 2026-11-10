/**
 * Clases del panel lateral de administración y organizador. Viven fuera de los componentes cliente
 * para que el pie (servidor) y la navegación (cliente) usen exactamente el mismo estilo.
 * Turquesa C3 (#33BEAC) marca el elemento activo y el foco; el navy es el fondo del panel.
 */
const focusRing = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33BEAC]';

export const consoleLinkBase = [
  'flex min-h-11 items-center gap-3 rounded-md px-3 font-texto text-sm font-medium text-white/85',
  'transition-colors hover:bg-white/10 hover:text-white',
  focusRing,
].join(' ');

/** Activo: fondo suave y una franja turquesa a la izquierda (sin borde extra en el DOM). */
export const consoleLinkActive = 'bg-white/12 font-semibold text-white shadow-[inset_3px_0_0_#33BEAC]';

export const consoleLabel = 'px-3 font-texto text-xs font-semibold text-white/65';

export const consoleBadge = 'rounded-sm bg-[#33BEAC] px-2 py-0.5 font-texto text-xs font-bold text-navy';
