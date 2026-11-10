export function noShowPercent(input: { issued: number; checkedIn: number; eventEnded: boolean }): number | null {
  if (!input.eventEnded || input.issued <= 0) return null;
  return Math.round(((input.issued - input.checkedIn) / input.issued) * 1000) / 10;
}

export function formatNoShow(value: number | null): string {
  return value === null ? '—' : `${value.toFixed(1)} %`;
}
