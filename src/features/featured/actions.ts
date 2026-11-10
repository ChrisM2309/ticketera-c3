'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { requireRole } from '@/lib/auth/require-role';

import { adminFeaturedPath } from './paths';
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;

function field(formData: FormData, name: string): string | null {
  const value = formData.get(name);
  return typeof value === 'string' ? value : null;
}

export async function createManualFeaturedAction(formData: FormData): Promise<void> {
  const account = await requireRole('admin', adminFeaturedPath);
  const eventId = field(formData, 'eventId');
  const startsOn = field(formData, 'startsOn');
  const endsOn = field(formData, 'endsOn');

  if (!eventId || !uuidPattern.test(eventId) || !startsOn || !datePattern.test(startsOn) || !endsOn || !datePattern.test(endsOn)) {
    redirect(`${adminFeaturedPath}?error=manual`);
  }

  const { error } = await account.client.rpc('admin_create_manual_featured', {
    p_event_id: eventId,
    p_starts_on: startsOn,
    p_ends_on: endsOn,
  });
  if (error) redirect(`${adminFeaturedPath}?error=manual`);

  revalidatePath('/', 'layout');
  redirect(`${adminFeaturedPath}?ok=manual`);
}

export async function reviewFeaturedAction(formData: FormData): Promise<void> {
  const account = await requireRole('admin', adminFeaturedPath);
  const id = field(formData, 'id');
  const decision = field(formData, 'decision');
  if (!id || !uuidPattern.test(id) || (decision !== 'approved' && decision !== 'rejected')) {
    redirect(`${adminFeaturedPath}?error=revision`);
  }

  const { error } = await account.client.rpc('admin_review_featured', {
    p_id: id,
    p_decision: decision,
  });
  if (error) redirect(`${adminFeaturedPath}?error=revision`);

  revalidatePath('/', 'layout');
  redirect(`${adminFeaturedPath}?ok=revision`);
}

export async function cancelFeaturedAction(formData: FormData): Promise<void> {
  const account = await requireRole('admin', adminFeaturedPath);
  const id = field(formData, 'id');
  if (!id || !uuidPattern.test(id)) redirect(`${adminFeaturedPath}?error=cancel`);

  const { error } = await account.client.rpc('admin_cancel_featured', { p_id: id });
  if (error) redirect(`${adminFeaturedPath}?error=cancel`);

  revalidatePath('/', 'layout');
  redirect(`${adminFeaturedPath}?ok=cancel`);
}
