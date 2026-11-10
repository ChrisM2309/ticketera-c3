import { beforeEach, describe, expect, it, vi } from 'vitest';

const { requireRole, rpc } = vi.hoisted(() => ({
  requireRole: vi.fn(),
  rpc: vi.fn(),
}));

vi.mock('@/lib/auth/require-role', () => ({ requireRole }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('next/navigation', () => ({
  redirect: (path: string) => {
    throw new Error(`redirect:${path}`);
  },
}));

import { toggleIndexingAction, updateSettingsAction } from '@/features/settings/actions';

describe('updateSettingsAction', () => {
  beforeEach(() => {
    rpc.mockReset().mockResolvedValue({ error: null });
    requireRole.mockReset().mockResolvedValue({ client: { rpc } });
  });

  it('guarda todas las claves juntas en una sola llamada con valores JSON tipados', async () => {
    const formData = new FormData();
    formData.set('dailyRate', '12.50');
    formData.set('packagePrice', '99.99');
    formData.set('eventsIncluded', '10');
    formData.set('featuredDaysIncluded', '30');
    formData.set('featuredDiscountPercent', '50');
    formData.set('personalizedFollowUp', 'true');
    formData.set('advancedReport', 'true');

    await expect(updateSettingsAction(formData)).rejects.toThrow('redirect:/admin/ajustes/?ok=guardar');

    expect(rpc).toHaveBeenCalledTimes(1);
    expect(rpc).toHaveBeenCalledWith('admin_set_settings', {
      p_settings: {
        featured_daily_rate_cents: 1250,
        package_annual_price_cents: 9999,
        package_benefits: {
          eventsIncluded: 10,
          featuredDaysIncluded: 30,
          featuredDiscountPercent: 50,
          personalizedFollowUp: true,
          advancedReport: true,
        },
      },
    });
  });

  it('envía el interruptor de indexación como booleano JSON', async () => {
    const formData = new FormData();
    formData.set('indexingEnabled', 'true');
    formData.set('acknowledgeDemo', 'on');

    await expect(toggleIndexingAction(formData)).rejects.toThrow('redirect:/admin/ajustes/?ok=indexacion');

    expect(rpc).toHaveBeenCalledWith('admin_set_setting', {
      p_key: 'indexing_enabled',
      p_value: true,
    });
  });

  it('rechaza un valor de indexación malformado sin cambiar los ajustes', async () => {
    const formData = new FormData();
    formData.set('indexingEnabled', 'desconocido');

    await expect(toggleIndexingAction(formData)).rejects.toThrow('redirect:/admin/ajustes/?error=formulario');

    expect(rpc).not.toHaveBeenCalled();
  });
});
