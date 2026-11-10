export function provisionalFeaturedTotal(input: {
  days: number;
  dailyRateCents: number;
  freeDays?: number;
  discountPercent?: number;
}): number {
  const days = Math.max(0, Math.trunc(input.days));
  const freeDays = Math.min(days, Math.max(0, Math.trunc(input.freeDays ?? 0)));
  const discountPercent = Math.min(100, Math.max(0, input.discountPercent ?? 0));
  const billableDays = days - freeDays;
  const total = (billableDays * input.dailyRateCents * (100 - discountPercent)) / 100;

  return Math.floor(total + 0.5);
}
