import type { ReactNode } from 'react';

import { ConsoleShell } from '@/components/console/console-shell';
import { adminNavigation } from '@/lib/console-navigation';

/** Panel lateral de la zona de administración. Cada página valida su rol con requireRole. */
export default function AdminLayout({ children }: Readonly<{ children: ReactNode }>) {
  return <ConsoleShell navigation={adminNavigation}>{children}</ConsoleShell>;
}
