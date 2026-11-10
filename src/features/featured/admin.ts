export type FeaturedRow = {
  id: string;
  eventTitle: string;
  source: 'manual' | 'paid';
  status: string;
  startsOn: string;
  endsOn: string;
  days: number;
  totalCents: number;
};

export type FeaturedFilters = {
  status: 'all' | 'pending' | 'approved' | 'rejected' | 'payment_failed' | 'cancelled';
  source: 'all' | 'manual' | 'paid';
  page: number;
};

const statuses = new Set<FeaturedFilters['status']>([
  'all',
  'pending',
  'approved',
  'rejected',
  'payment_failed',
  'cancelled',
]);
const sources = new Set<FeaturedFilters['source']>(['all', 'manual', 'paid']);

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function parseFeaturedFilters(
  searchParams: Record<string, string | string[] | undefined>,
): FeaturedFilters {
  const statusValue = first(searchParams.status);
  const sourceValue = first(searchParams.source);
  const pageValue = first(searchParams.page);
  const page = pageValue && /^[1-9][0-9]*$/.test(pageValue) ? Number(pageValue) : 1;

  return {
    status: statuses.has(statusValue as FeaturedFilters['status'])
      ? (statusValue as FeaturedFilters['status'])
      : 'all',
    source: sources.has(sourceValue as FeaturedFilters['source'])
      ? (sourceValue as FeaturedFilters['source'])
      : 'all',
    page: Number.isSafeInteger(page) ? page : 1,
  };
}
