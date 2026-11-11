'use server';

import { requireRole } from '@/lib/auth/require-role';

import { normalizeScannedCode, type CheckInResult } from './check-in';
import { hashScannedCode } from './check-in-token';

const eventIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type CheckInActionResult = { ok: true; result: CheckInResult } | { ok: false; message: string };

export async function checkInAction(formData: FormData): Promise<CheckInActionResult> {
  const account = await requireRole('organizer', '/panel/');
  const eventId = formData.get('eventId');
  const scannedCode = formData.get('code');
  if (typeof eventId !== 'string' || !eventIdPattern.test(eventId) || typeof scannedCode !== 'string') {
    return { ok: false, message: 'Revisa el código e intenta nuevamente.' };
  }

  const code = normalizeScannedCode(scannedCode);
  if (!code) return { ok: true, result: 'not_found' };

  const { data, error } = await account.client.rpc('organizer_check_in', {
    p_event_id: eventId,
    p_qr_hash: hashScannedCode(code),
  });
  if (error || !['checked_in', 'already_checked_in', 'not_found', 'wrong_event'].includes(data)) {
    return { ok: false, message: 'No pudimos validar la entrada. Intenta nuevamente.' };
  }
  return { ok: true, result: data as CheckInResult };
}
