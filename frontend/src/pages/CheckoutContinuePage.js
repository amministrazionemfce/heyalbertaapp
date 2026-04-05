import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { ArrowLeft, Lock } from 'lucide-react';
import { Button } from '../components/ui/button';
import { ROUTES } from '../constants';
import { SITE_CONTACT } from '../constants/site';
import { useAuth } from '../lib/auth';
import { getPlanById, getPlanPriceDisplay } from '../data/membershipPlans';
import { BACKEND_URL, BACKEND_EXTRA_FETCH_HEADERS } from '../lib/api';
import BrandLoadingOverlay from '../components/BrandLoadingOverlay';

const STORAGE_KEY = 'hey_alberta_checkout_payload';

async function resolveStripePublishableKey() {
  let pk = String(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || '').trim();
  if (pk.startsWith('pk_')) return pk;
  const base = String(BACKEND_URL || '').replace(/\/$/, '');
  if (!base) return '';
  try {
    const res = await fetch(`${base}/api/billing/public-config`, {
      headers: { ...BACKEND_EXTRA_FETCH_HEADERS },
    });
    if (!res.ok) return '';
    const data = await res.json();
    pk = String(data?.publishableKey || '').trim();
    return pk.startsWith('pk_') ? pk : '';
  } catch {
    return '';
  }
}
const MAX_AGE_MS = 15 * 60 * 1000;

function readPayload() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data?.planId || !data?.cadence || !data?.ts) return null;
    if (Date.now() - data.ts > MAX_AGE_MS) {
      sessionStorage.removeItem(STORAGE_KEY);
      return null;
    }
    if (data.planId !== 'standard' && data.planId !== 'premium') return null;
    const checkoutUrl = String(data.checkoutUrl || '');
    const clientSecret = String(data.clientSecret || '').trim();
    const urlOk = /^https:\/\//i.test(checkoutUrl);
    const secretOk = clientSecret.length >= 20;
    if (!urlOk && !secretOk) return null;
    return {
      ...data,
      checkoutUrl: urlOk ? checkoutUrl : '',
      clientSecret: secretOk ? clientSecret : '',
    };
  } catch {
    return null;
  }
}

export default function CheckoutContinuePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [payload, setPayload] = useState(null);
  const [embedError, setEmbedError] = useState('');
  const embedMountRef = useRef(null);

  useEffect(() => {
    const p = readPayload();
    if (!p) {
      navigate(ROUTES.HOME, { replace: true });
      return;
    }
    setPayload(p);
  }, [navigate]);

  const plan = useMemo(() => (payload ? getPlanById(payload.planId) : null), [payload]);
  const prices = useMemo(() => {
    if (!plan || !payload) return { primary: '', secondary: null, alternate: null };
    return getPlanPriceDisplay(plan, payload.cadence);
  }, [plan, payload]);

  const useEmbedded = Boolean(payload?.clientSecret);
  const useHostedUrl = Boolean(payload?.checkoutUrl);

  useEffect(() => {
    if (!useEmbedded || !payload?.clientSecret) return undefined;

    let embedded = null;
    let cancelled = false;

    (async () => {
      const pk = await resolveStripePublishableKey();
      if (cancelled) return;
      if (!pk) {
        setEmbedError(
          'Stripe publishable key is missing. Set REACT_APP_STRIPE_PUBLISHABLE_KEY in frontend/.env and restart the dev server, or set STRIPE_PUBLISHABLE_KEY on the backend and ensure REACT_APP_BACKEND_URL points at your API.'
        );
        return;
      }
      setEmbedError('');
      try {
        const stripe = await loadStripe(pk);
        if (cancelled) return;
        if (!stripe) {
          setEmbedError('Could not load Stripe.');
          return;
        }
        embedded = await stripe.initEmbeddedCheckout({
          clientSecret: payload.clientSecret,
        });
        if (cancelled) {
          embedded.destroy();
          return;
        }
        const el = embedMountRef.current;
        if (el) embedded.mount(el);
      } catch (e) {
        if (!cancelled) setEmbedError(e?.message || 'Checkout could not start.');
      }
    })();

    return () => {
      cancelled = true;
      if (embedded) {
        try {
          embedded.destroy();
        } catch {
          /* ignore */
        }
      }
    };
  }, [useEmbedded, payload?.clientSecret]);

  const handleContinue = useCallback(() => {
    if (!payload?.checkoutUrl) return;
    sessionStorage.removeItem(STORAGE_KEY);
    window.location.href = payload.checkoutUrl;
  }, [payload]);

  const handleCancel = useCallback(() => {
    sessionStorage.removeItem(STORAGE_KEY);
    navigate(ROUTES.HOME, { replace: true });
  }, [navigate]);

  if (!payload || !plan) {
    return <BrandLoadingOverlay open label="Preparing checkout…" />;
  }

  const cadenceLabel = payload.cadence === 'yearly' ? 'Yearly billing' : 'Monthly billing';

  const paymentPanelScroll =
    'min-h-0 flex-1 overflow-y-auto overflow-x-hidden [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden';

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col overflow-hidden bg-white"
      data-testid="checkout-continue-page"
    >
      <div className="mx-auto flex h-full min-h-0 w-full max-w-[92rem] flex-1 flex-col px-4 py-3 sm:px-6 sm:py-4">
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <Link
            to={ROUTES.HOME}
            className="flex h-9 w-24 items-center justify-center sm:h-10 sm:w-28"
            onClick={() => sessionStorage.removeItem(STORAGE_KEY)}
          >
            <img
              src={`${process.env.PUBLIC_URL}/logo.png`}
              alt="Hey Alberta"
              className="h-full w-full object-contain object-left"
            />
          </Link>
          <button
            type="button"
            onClick={handleCancel}
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-spruce-800 sm:text-sm"
            data-testid="checkout-back-home"
          >
            <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Cancel
          </button>
        </header>

        <div
          className={`mt-3 grid min-h-0 flex-1 grid-cols-1 gap-4 md:gap-5 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] xl:grid-cols-[minmax(0,24rem)_minmax(0,1fr)] 2xl:grid-cols-[minmax(0,28rem)_minmax(0,1fr)] 2xl:gap-8 ${
            useEmbedded ? 'grid-rows-[auto_minmax(0,1fr)] lg:grid-rows-1' : ''
          }`}
        >
          <section className="flex shrink-0 flex-col gap-3 lg:min-h-0">
            <div className="shrink-0">
              <h1 className="font-heading text-lg font-bold text-slate-900 sm:text-xl">
                Review &amp; pay
              </h1>
              <p className="text-xs text-slate-600 sm:text-sm">{cadenceLabel}</p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-spruce-700">
                Selected plan
              </p>
              <div className="mt-1 flex items-start justify-between gap-2">
                <h2 className="font-heading text-lg font-bold leading-tight text-slate-900 sm:text-xl">
                  {plan.name}
                </h2>
                <div className="shrink-0 text-right">
                  <p className="font-heading text-lg font-bold tabular-nums text-spruce-800 sm:text-xl">
                    {prices.primary}
                  </p>
                  {prices.secondary ? (
                    <p className="text-[11px] font-medium text-slate-500">{prices.secondary}</p>
                  ) : null}
                </div>
              </div>
              {plan.description ? (
                <p className="mt-1.5 line-clamp-2 text-[11px] leading-snug text-slate-600 sm:text-xs">
                  {plan.description}
                </p>
              ) : null}
              <div className="mt-3 border-t border-slate-100 pt-2">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  Signed in as
                </p>
                <p className="truncate text-xs font-medium text-slate-800" title={user?.email || ''}>
                  {user?.email || 'your account'}
                </p>
                <p className="mt-1.5 text-[10px] leading-snug text-slate-500">
                  Questions?{' '}
                  <a href={`mailto:${SITE_CONTACT.email}`} className="font-semibold text-spruce-700 hover:underline">
                    Email
                  </a>{' '}
                  ·{' '}
                  <Link to={ROUTES.CONTACT} className="font-semibold text-spruce-700 hover:underline">
                    Contact
                  </Link>
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/80 px-2.5 py-2">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-spruce-50 text-spruce-800">
                <Lock className="h-4 w-4" aria-hidden />
              </span>
              <p className="text-[11px] leading-snug text-slate-600 sm:text-xs">
                {useEmbedded
                  ? 'Pay securely with Stripe below. We never store your card.'
                  : 'You’ll finish on Stripe’s encrypted page.'}
              </p>
            </div>

            {useHostedUrl ? (
              <div className="shrink-0">
                <Button
                  type="button"
                  onClick={handleContinue}
                  className="h-10 w-full rounded-xl bg-spruce-700 text-sm font-semibold text-white hover:bg-spruce-800"
                  data-testid="checkout-continue-stripe"
                >
                  Continue to secure payment
                </Button>
              </div>
            ) : null}

            <p className="shrink-0 text-center text-[10px] text-slate-500 lg:mt-auto">
              Secured by Stripe · Cancel anytime from billing portal
            </p>
          </section>

          {useEmbedded ? (
            <section className="flex min-h-0 min-w-0 flex-1 flex-col">
              <p className="mb-2 shrink-0 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Payment
              </p>
              {embedError ? (
                <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
                  {embedError}
                </p>
              ) : (
                <div
                  ref={embedMountRef}
                  className={`rounded-xl border border-slate-200 bg-white shadow-sm ${paymentPanelScroll}`}
                  data-testid="checkout-embedded-mount"
                />
              )}
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}
