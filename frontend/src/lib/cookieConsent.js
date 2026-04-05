const STORAGE_KEY = 'hey_alberta_cookie_consent_v1';

/**
 * @returns {{ analytics: boolean, marketing: boolean, updatedAt: string } | null}
 */
export function readCookieConsent() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw);
    if (!p || typeof p !== 'object' || p.v !== 1) return null;
    return {
      analytics: Boolean(p.analytics),
      marketing: Boolean(p.marketing),
      updatedAt: typeof p.updatedAt === 'string' ? p.updatedAt : '',
    };
  } catch {
    return null;
  }
}

export function writeCookieConsent({ analytics, marketing }) {
  if (typeof window === 'undefined') return;
  const payload = {
    v: 1,
    analytics: Boolean(analytics),
    marketing: Boolean(marketing),
    updatedAt: new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  window.dispatchEvent(
    new CustomEvent('hey-alberta:cookie-consent', {
      detail: { analytics: payload.analytics, marketing: payload.marketing },
    })
  );
}
