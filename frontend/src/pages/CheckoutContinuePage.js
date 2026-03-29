import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { ArrowLeft, Lock } from 'lucide-react';
import { Button } from '../components/ui/button';
import { ROUTES } from '../constants';
import { SITE_CONTACT } from '../constants/site';
import { useAuth } from '../lib/auth';
import { getPlanById, getPlanPriceDisplay } from '../data/membershipPlans';
import { BACKEND_URL } from '../lib/api';

const STORAGE_KEY = 'hey_alberta_checkout_payload';

async function resolveStripePublishableKey() {
  let pk = String(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || '').trim();
  if (pk.startsWith('pk_')) return pk;
  const base = String(BACKEND_URL || '').replace(/\/$/, '');
  if (!base) return '';
  try {
    const res = await fetch(`${base}/api/billing/public-config`);
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
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <p className="text-sm text-slate-500">Loading…</p>
      </div>
    );
  }

  const cadenceLabel = payload.cadence === 'yearly' ? 'Yearly billing' : 'Monthly billing';

  return (
    <div className="flex min-h-screen bg-slate-200/90" data-testid="checkout-continue-page">
      <div className="relative hidden min-h-screen lg:flex lg:w-1/2">
        <img src={`${process.env.PUBLIC_URL}/background.jpeg`} alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-slate-900/65" aria-hidden />
        <div className="absolute inset-0 flex items-center justify-center p-8 sm:p-12">
          <div className="max-w-lg text-center">
            <div className="mx-auto mb-6 flex justify-center">
              <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 ring-2 ring-white/30">
                <Lock className="h-7 w-7 text-white" aria-hidden />
              </span>
            </div>
            <h2 className="mb-4 font-heading text-3xl font-bold text-white drop-shadow-md sm:text-4xl">
              Secure checkout
            </h2>
            <p className="text-lg leading-relaxed text-white/95 drop-shadow-sm">
              {useEmbedded
                ? 'Complete payment below using Stripe’s secure form. We never store your card on our servers.'
                : 'You’ll finish payment on Stripe’s encrypted page. We never store your card on our servers.'}
            </p>
          </div>
        </div>
      </div>

      <div className="flex max-h-screen flex-1 flex-col overflow-y-auto bg-slate-100 p-6 sm:p-8 lg:max-h-none">
        <div className="mx-auto w-full max-w-lg pb-10">
          <Link
            to={ROUTES.HOME}
            className="mb-4 flex items-center gap-2"
            onClick={() => sessionStorage.removeItem(STORAGE_KEY)}
          >
            <div className="flex h-14 w-24 items-center justify-center sm:h-16 sm:w-28">
              <img src={`${process.env.PUBLIC_URL}/logo.png`} alt="Hey Alberta" className="h-full w-full object-contain" />
            </div>
          </Link>
          <button
            type="button"
            onClick={handleCancel}
            className="mb-6 inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-spruce-700"
            data-testid="checkout-back-home"
          >
            <ArrowLeft className="h-4 w-4" /> Cancel and return home
          </button>

          <h1 className="mb-2 font-heading text-2xl font-bold text-slate-900">Review your plan</h1>
          <p className="mb-6 text-sm text-slate-600">{cadenceLabel}</p>

          <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-spruce-700">Selected plan</p>
            <h2 className="mt-1 font-heading text-xl font-bold text-slate-900">{plan.name}</h2>
            <p className="mt-2 text-sm text-slate-600">{plan.description}</p>

            <div className="mt-6 border-t border-slate-100 pt-6">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Price</p>
              <p className="mt-1 font-heading text-xl font-bold leading-snug text-spruce-800 sm:text-2xl">
                {prices.primary}
              </p>
              {prices.secondary && (
                <p className="mt-1 text-sm font-medium text-slate-600">{prices.secondary}</p>
              )}
              {prices.alternate && (
                <p className="mt-2 text-xs leading-relaxed text-slate-500">{prices.alternate}</p>
              )}
            </div>

            <div className="mt-8 border-t border-slate-100 pt-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Contact</p>
              <p className="mt-2 text-sm text-slate-700">
                Signed in as <span className="font-medium text-slate-900">{user?.email || 'your account'}</span>
              </p>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                Questions before you pay?{' '}
                <a href={`mailto:${SITE_CONTACT.email}`} className="font-semibold text-spruce-700 hover:underline">
                  {SITE_CONTACT.email}
                </a>{' '}
                or{' '}
                <Link to={ROUTES.CONTACT} className="font-semibold text-spruce-700 hover:underline">
                  contact form
                </Link>
                .
              </p>
            </div>
          </div>

          {useEmbedded && (
            <div className="mt-6">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Payment</p>
              {embedError ? (
                <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{embedError}</p>
              ) : (
                <div
                  ref={embedMountRef}
                  className="min-h-[420px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
                  data-testid="checkout-embedded-mount"
                />
              )}
            </div>
          )}

          {useHostedUrl && (
            <Button
              type="button"
              onClick={handleContinue}
              className="mt-8 h-12 w-full rounded-xl bg-spruce-700 text-base font-semibold text-white hover:bg-spruce-800"
              data-testid="checkout-continue-stripe"
            >
              Continue to secure payment
            </Button>
          )}

          <p className="mt-4 text-center text-xs text-slate-500">
            Secured by Stripe · Cancel anytime from your billing portal
          </p>
        </div>
      </div>
    </div>
  );
}
