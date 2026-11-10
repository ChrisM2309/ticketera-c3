import { createPublicClient } from '@/lib/supabase/public';

type FeaturedRpcRow = { event_id: string };

async function getFeaturedIds(limit: number, eventTypeId: string | null): Promise<string[]> {
  const client = createPublicClient();
  if (!client) return [];

  const { data, error } = await client.rpc('active_featured', {
    p_limit: limit,
    p_event_type_id: eventTypeId,
  });
  if (error) return [];
  return ((data ?? []) as FeaturedRpcRow[]).map((row) => row.event_id);
}

export function getHomeFeaturedIds(limit = 4): Promise<string[]> {
  return getFeaturedIds(limit, null);
}

export function getCategoryFeaturedIds(eventTypeId: string, limit = 3): Promise<string[]> {
  return getFeaturedIds(limit, eventTypeId);
}
