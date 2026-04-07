import { billingAPI } from './api';
import { getStoredAuthToken } from './authStorage';

const CHECKOUT_LINKS = Object.freeze({
  standardMonthly: process.env.REACT_APP_STRIPE_STANDARD_MONTHLY_URL || '',
  standardYearly: process.env.REACT_APP_STRIPE_STANDARD_YEARLY_URL || '',
  premiumMonthly: process.env.REACT_APP_STRIPE_GOLD_MONTHLY_URL || '',
  premiumYearly: process.env.REACT_APP_STRIPE_GOLD_YEARLY_URL || '',
  portal: process.env.REACT_APP_STRIPE_BILLING_PORTAL_URL || '',
});

function envFallbackResult(planId, cadence) {
  const y = cadence === 'yearly';
  if (planId === 'free') {
    const url = CHECKOUT_LINKS.portal;
    if (!url) return { ok: false, message: 'Billing portal URL is not configured.' };
    return { ok: true, url, mode: 'portal' };
  }
  if (planId === 'standard') {
    const url = y
      ? CHECKOUT_LINKS.standardYearly || CHECKOUT_LINKS.standardMonthly
      : CHECKOUT_LINKS.standardMonthly || CHECKOUT_LINKS.standardYearly;
    if (!url) return { ok: false, message: 'Checkout link is not configured.' };
    return { ok: true, url, mode: 'subscription' };
  }
  if (planId === 'premium') {
    const url = y
      ? CHECKOUT_LINKS.premiumYearly || CHECKOUT_LINKS.premiumMonthly
      : CHECKOUT_LINKS.premiumMonthly || CHECKOUT_LINKS.premiumYearly;
    if (!url) return { ok: false, message: 'Checkout link is not configured.' };
    return { ok: true, url, mode: 'subscription' };
  }
  return { ok: false, message: 'Unknown plan.' };
}

export function getPlanActionLabel(planId, currentTier = 'free') {
  if (planId === currentTier) return 'Current plan';
  if (planId === 'free') return 'Downgrade to Free';
  if (planId === 'standard') return 'Upgrade to Standard';
  if (planId === 'premium') return 'Upgrade to Gold';
  return 'Select plan';
}

export async function redirectToPlanCheckout(planId, cadence = 'monthly') {
  const normalizedCadence = cadence === 'yearly' ? 'yearly' : 'monthly';
  const token = typeof window !== 'undefined' ? getStoredAuthToken() : null;

  const tryBackend = async () => {
    if (!token) return null;
    try {
      if (planId === 'free') {
        const res = await billingAPI.createPortalSession();
        const url = res.data?.url;
        if (url) return { ok: true, url, mode: 'portal' };
      } else if (planId === 'standard' || planId === 'premium') {
        const res = await billingAPI.createCheckoutSession({
          planId,
          cadence: normalizedCadence,
        });
        const { clientSecret, url } = res.data || {};
        if (clientSecret) return { ok: true, clientSecret, mode: 'subscription' };
        if (url) return { ok: true, url, mode: 'subscription' };
      }
    } catch (err) {
      if (!err?.response) {
        return {
          backendError: true,
          message:
            'Cannot reach the billing server. Check that the API is running and REACT_APP_BACKEND_URL matches your backend URL.',
        };
      }
      const status = err.response.status;
      const msg = err.response.data?.message;
      if (status === 401) return { needAuth: true, message: msg };
      if (status === 503 || status === 500) return { backendError: true, message: msg };
      return { fatal: true, message: msg || err?.message || 'Could not start billing.' };
    }
    return null;
  };

  const backendResult = await tryBackend();
  if (backendResult?.ok) return backendResult;
  if (backendResult?.fatal) return { ok: false, message: backendResult.message };

  const fb = envFallbackResult(planId, normalizedCadence);
  if (fb.ok) return fb;

  if (backendResult?.needAuth) return { ok: false, needAuth: true };
  if (!token) return { ok: false, needAuth: true };
  if (backendResult?.backendError && backendResult.message) {
    return { ok: false, message: backendResult.message };
  }

  return { ok: false, message: fb.message || backendResult?.message || 'Billing is not available.' };
}
