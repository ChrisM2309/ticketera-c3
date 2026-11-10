'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import type { SupabaseClient } from '@supabase/supabase-js';

import { requireRole } from '@/lib/auth/require-role';

import { parseSettingsForm } from './form';

const settingsPath = '/admin/ajustes/';

async function setSetting(client: SupabaseClient, key: string, value: unknown) {
  const { error } = await client.rpc('admin_set_setting', { p_key: key, p_value: value });
  if (error) throw new Error(error.message);
}

export async function updateSettingsAction(formData: FormData): Promise<void> {
  const account = await requireRole('admin', settingsPath);
  const parsed = parseSettingsForm(formData);
  if (!parsed.valid) redirect(`${settingsPath}?error=formulario`);

  try {
    const { error } = await account.client.rpc('admin_set_settings', {
      p_settings: {
        featured_daily_rate_cents: parsed.data.dailyRateCents,
        package_annual_price_cents: parsed.data.packagePriceCents,
        package_benefits: parsed.data.benefits,
      },
    });
    if (error) throw new Error(error.message);
  } catch {
    redirect(`${settingsPath}?error=guardar`);
  }

  revalidatePath('/robots.txt');
  revalidatePath('/sitemap.xml');
  revalidatePath('/');
  redirect(`${settingsPath}?ok=guardar`);
}

export async function toggleIndexingAction(formData: FormData): Promise<void> {
  const account = await requireRole('admin', settingsPath);
  const indexingValue = formData.get('indexingEnabled');
  if (indexingValue !== 'true' && indexingValue !== 'false') {
    redirect(`${settingsPath}?error=formulario`);
  }
  const enabled = indexingValue === 'true';
  if (enabled && formData.get('acknowledgeDemo') !== 'on') {
    redirect(`${settingsPath}?error=confirmacion`);
  }

  try {
    await setSetting(account.client, 'indexing_enabled', enabled);
  } catch {
    redirect(`${settingsPath}?error=guardar`);
  }

  revalidatePath('/robots.txt');
  revalidatePath('/sitemap.xml');
  revalidatePath('/');
  redirect(`${settingsPath}?ok=indexacion`);
}
