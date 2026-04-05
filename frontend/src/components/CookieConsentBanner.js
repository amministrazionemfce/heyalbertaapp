import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { SITE_LEGAL } from '../constants';
import { readCookieConsent, writeCookieConsent } from '../lib/cookieConsent';

const CookieConsentContext = createContext(null);

export function useCookieConsent() {
  return useContext(CookieConsentContext);
}

export function CookieConsentProvider({ children }) {
  const [consent, setConsent] = useState(() => readCookieConsent());
  const [manageOpen, setManageOpen] = useState(false);
  const [draftAnalytics, setDraftAnalytics] = useState(true);
  const [draftMarketing, setDraftMarketing] = useState(true);

  const showBanner = consent === null;

  const persist = useCallback((next) => {
    writeCookieConsent(next);
    setConsent(readCookieConsent());
  }, []);

  const acceptAll = useCallback(() => {
    persist({ analytics: true, marketing: true });
    setManageOpen(false);
  }, [persist]);

  const rejectAll = useCallback(() => {
    persist({ analytics: false, marketing: false });
    setManageOpen(false);
  }, [persist]);

  const openManage = useCallback(() => {
    const c = readCookieConsent();
    setDraftAnalytics(c?.analytics ?? false);
    setDraftMarketing(c?.marketing ?? false);
    setManageOpen(true);
  }, []);

  const saveManage = useCallback(() => {
    persist({ analytics: draftAnalytics, marketing: draftMarketing });
    setManageOpen(false);
  }, [draftAnalytics, draftMarketing, persist]);

  const value = useMemo(
    () => ({
      consent,
      openManage,
      hasAnswered: consent !== null,
    }),
    [consent, openManage]
  );

  return (
    <CookieConsentContext.Provider value={value}>
      {children}

      {showBanner ? (
        <div
          className="fixed bottom-4 left-4 right-4 z-40 max-h-[min(70vh,calc(100vh-2rem))] overflow-y-auto sm:right-auto sm:max-w-md md:max-w-lg"
          role="dialog"
          aria-label="Cookie consent"
          aria-modal="false"
          data-testid="cookie-consent-banner"
        >
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-lg shadow-slate-900/10 md:p-5">
            <p className="text-sm leading-relaxed text-slate-800">
              We use strictly necessary cookies to run this site. With your permission, we also use optional
              cookies to understand how the site is used and to improve your experience. You can change your
              mind anytime — use{' '}
              <button
                type="button"
                onClick={openManage}
                className="font-medium text-spruce-800 underline decoration-spruce-600/60 underline-offset-2 hover:text-spruce-900"
              >
                Manage cookies
              </button>{' '}
              for choices. See our{' '}
              <a
                href={SITE_LEGAL.PRIVACY_HREF}
                className="font-medium text-spruce-800 underline decoration-spruce-600/60 underline-offset-2 hover:text-spruce-900"
              >
                {SITE_LEGAL.PRIVACY_LABEL}
              </a>
              .
            </p>

            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-stretch">
              <Button
                type="button"
                variant="outline"
                onClick={openManage}
                className="h-10 shrink-0 rounded-sm border-slate-900 bg-white px-4 text-sm font-semibold text-slate-900 hover:bg-slate-50"
                data-testid="cookie-manage-btn"
              >
                Manage cookies
              </Button>
              <Button
                type="button"
                onClick={acceptAll}
                className="h-10 shrink-0 rounded-sm bg-spruce-800 px-4 text-sm font-semibold text-white hover:bg-spruce-900"
                data-testid="cookie-accept-all-btn"
              >
                Accept all
              </Button>
              <Button
                type="button"
                onClick={rejectAll}
                className="h-10 shrink-0 rounded-sm bg-spruce-800 px-4 text-sm font-semibold text-white hover:bg-spruce-900"
                data-testid="cookie-reject-all-btn"
              >
                Reject all
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <Dialog open={manageOpen} onOpenChange={setManageOpen}>
        <DialogContent className="z-[60] max-w-md rounded-xl">
          <DialogHeader>
            <DialogTitle className="font-heading">Cookie preferences</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-600">
            Essential cookies are always on — they keep the site secure and working. Choose optional categories
            below.
          </p>
          <ul className="space-y-4 border-y border-slate-100 py-4">
            <li className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">Strictly necessary</p>
                <p className="text-xs text-slate-500">Required for login, security, and basic features.</p>
              </div>
              <span className="shrink-0 text-xs font-medium text-slate-400">Always on</span>
            </li>
            <li className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">Analytics</p>
                <p className="text-xs text-slate-500">Helps us understand traffic and improve the product.</p>
              </div>
              <label className="inline-flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={draftAnalytics}
                  onChange={(e) => setDraftAnalytics(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-spruce-800 focus:ring-spruce-600"
                />
              </label>
            </li>
            <li className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">Marketing</p>
                <p className="text-xs text-slate-500">Used for relevant offers and measurement across sessions.</p>
              </div>
              <label className="inline-flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={draftMarketing}
                  onChange={(e) => setDraftMarketing(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-spruce-800 focus:ring-spruce-600"
                />
              </label>
            </li>
          </ul>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" className="rounded-sm" onClick={() => setManageOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              className="rounded-sm bg-spruce-800 text-white hover:bg-spruce-900"
              onClick={saveManage}
              data-testid="cookie-save-preferences-btn"
            >
              Save preferences
            </Button>
          </div>
          <p className="text-center text-xs text-slate-500">
            <a href={SITE_LEGAL.PRIVACY_HREF} className="font-medium text-spruce-800 underline underline-offset-2">
              {SITE_LEGAL.PRIVACY_LABEL}
            </a>
          </p>
        </DialogContent>
      </Dialog>
    </CookieConsentContext.Provider>
  );
}
