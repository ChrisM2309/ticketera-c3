import type { ReactNode } from 'react';

import { ConsoleShell } from '@/components/console/console-shell';
import { organizerNavigation } from '@/lib/console-navigation';

/** Panel lateral del organizador. Cada página valida su rol con requireRole. */
export default function PanelLayout({ children }: Readonly<{ children: ReactNode }>) {
  return <ConsoleShell navigation={organizerNavigation}>{children}</ConsoleShell>;
}
