import { beforeEach, describe, expect, it, vi } from 'vitest';

const { createPublicClient } = vi.hoisted(() => ({ createPublicClient: vi.fn() }));
vi.mock('@/lib/supabase/public', () => ({ createPublicClient }));

import { getCategoryFeaturedIds, getHomeFeaturedIds } from '../../src/features/featured/queries';

describe('featured queries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('la portada solo recibe los ids de active_featured', async () => {
    const rpc = vi.fn().mockResolvedValue({ data: [{ event_id: 'a' }, { event_id: 'b' }], error: null });
    createPublicClient.mockReturnValue({ rpc });

    await expect(getHomeFeaturedIds()).resolves.toEqual(['a', 'b']);
    expect(rpc).toHaveBeenCalledWith('active_featured', { p_limit: 4, p_event_type_id: null });
  });

  it('la categoría solo recibe destacados de su tipo', async () => {
    const rpc = vi.fn().mockResolvedValue({ data: [{ event_id: 'c' }], error: null });
    createPublicClient.mockReturnValue({ rpc });

    await expect(getCategoryFeaturedIds('tipo-1')).resolves.toEqual(['c']);
    expect(rpc).toHaveBeenCalledWith('active_featured', { p_limit: 3, p_event_type_id: 'tipo-1' });
  });
});
