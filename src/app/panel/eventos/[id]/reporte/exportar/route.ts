import { requireRole } from '@/lib/auth/require-role';
import { buildAdvancedCsv, type BreakdownRow, type DailyRow } from '@/features/organizers/advanced-report';

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!uuidPattern.test(id)) return new Response('Evento no válido.', { status: 400 });

  const account = await requireRole('organizer', `/panel/eventos/${id}/reporte/exportar/`);
  const [dailyResult, breakdownResult] = await Promise.all([
    account.client.rpc('organizer_event_daily_issuance', { p_event_id: id }),
    account.client.rpc('organizer_event_ticket_type_breakdown', { p_event_id: id }),
  ]);

  if (dailyResult.error?.code === '42501' || breakdownResult.error?.code === '42501') {
    return new Response('El reporte superior requiere un paquete activo.', { status: 403 });
  }
  if (dailyResult.error || breakdownResult.error) {
    return new Response('No pudimos generar el reporte.', { status: 500 });
  }

  const csv = buildAdvancedCsv(
    (dailyResult.data ?? []) as DailyRow[],
    (breakdownResult.data ?? []) as BreakdownRow[],
  );
  return new Response(csv, {
    headers: {
      'Cache-Control': 'private, no-store',
      'Content-Disposition': `attachment; filename="reporte-${id}.csv"`,
      'Content-Type': 'text/csv; charset=utf-8',
    },
  });
}
