import { siteConfig } from '@/lib/site-config';
import { cn } from '@/lib/utils';

export function DemoBadge({ className }: Readonly<{ className?: string }>) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-pill bg-advertencia px-3 py-1 font-texto text-xs font-medium text-sobre-advertencia',
        className,
      )}
    >
      <span aria-hidden="true" className="size-2 rounded-full bg-current" />
      {siteConfig.demoLabel}
    </span>
  );
}
