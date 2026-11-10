export type ConsentState = 'granted' | 'denied' | 'unset';

const consentName = 'ticketera_consent';

export function parseConsent(cookieHeader: string | undefined): ConsentState {
  const value = cookieHeader?.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${consentName}=`))?.slice(consentName.length + 1);
  return value === 'granted' || value === 'denied' ? value : 'unset';
}

export function consentCookie(state: 'granted' | 'denied'): string {
  return `${consentName}=${state}; Path=/; Max-Age=15552000; SameSite=Lax`;
}

export const consentCookieName = consentName;
