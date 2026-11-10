export type DailyRow = { day: string; issued: number; checked_in: number };
export type BreakdownRow = {
  ticket_type_name: string;
  issued: number;
  checked_in: number;
  subtotal_cents: number;
};

function renderCsv(columns: string[], rows: Record<string, string | number>[]): string {
  const encode = (value: string | number) => {
    const text = String(value);
    return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
  };
  return [columns.map(encode).join(','), ...rows.map((row) => columns.map((column) => encode(row[column] ?? '')).join(','))].join('\r\n');
}

export function toCsv(rows: Record<string, string | number>[]): string {
  if (rows.length === 0) return '';
  return renderCsv(Object.keys(rows[0]), rows);
}

export function buildAdvancedCsv(daily: DailyRow[], breakdown: BreakdownRow[]): string {
  const dailyCsv = renderCsv(['day', 'issued', 'checked_in'], daily.map(({ day, issued, checked_in }) => ({ day, issued, checked_in })));
  const breakdownCsv = renderCsv(
    ['ticket_type_name', 'issued', 'checked_in', 'subtotal_cents'],
    breakdown.map(({ ticket_type_name, issued, checked_in, subtotal_cents }) => ({
      ticket_type_name,
      issued,
      checked_in,
      subtotal_cents,
    })),
  );
  return `${dailyCsv}\r\n${breakdownCsv}`;
}
