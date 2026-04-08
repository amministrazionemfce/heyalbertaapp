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

const TIER_RANK = { free: 0, standard: 1, premium: 2 };

export function getPlanActionLabel(planId, currentTier = 'free') {
  if (planId === currentTier) return 'Current plan';
  if (planId === 'free') return 'Downgrade to Free';
  const cur = TIER_RANK[currentTier] ?? 0;
  const target = TIER_RANK[planId] ?? 0;
  if (planId === 'standard') {
    return target < cur ? 'Downgrade to Standard' : 'Upgrade to Standard';
  }
  if (planId === 'premium') {
    return target > cur ? 'Upgrade to Gold' : 'Downgrade to Gold';
  }
  return 'Select plan';
}

/**
 * @param {string} planId
 * @param {string} [cadence]
 * @param {{ billingTier?: string, refreshUser?: () => Promise<unknown> }} [options] — billingTier from DB (Stripe); used to update subscription instead of new Checkout when already paid.
 */
export async function redirectToPlanCheckout(planId, cadence = 'monthly', options = {}) {
  const normalizedCadence = cadence === 'yearly' ? 'yearly' : 'monthly';
  const token = typeof window !== 'undefined' ? getStoredAuthToken() : null;
  const { billingTier, refreshUser } = options;
  const bt = String(billingTier || 'free').toLowerCase();

  const tryBackend = async () => {
    if (!token) return null;
    try {
      if (planId === 'free') {
        // If user is already paid, cancel immediately so the app reflects Free right away.
        if (bt === 'standard' || bt === 'premium') {
          const res = await billingAPI.cancelSubscription();
          if (res.data?.ok) {
            if (typeof refreshUser === 'function') {
              try {
                await refreshUser();
              } catch {
                /* ignore */
              }
            }
            return {
              ok: true,
              mode: 'updated',
              tier: res.data.tier,
              effectiveTier: res.data.effectiveTier,
              unchanged: false,
            };
          }
        }

        // Otherwise fall back to customer portal (manage billing / subscribe later).
        const portalRes = await billingAPI.createPortalSession();
        const url = portalRes.data?.url;
        if (url) return { ok: true, url, mode: 'portal' };
      } else if (planId === 'standard' || planId === 'premium') {
        if (bt === 'standard' || bt === 'premium') {
          try {
            const res = await billingAPI.changeSubscriptionPlan({
              planId,
              cadence: normalizedCadence,
            });
            if (res.data?.ok) {
              if (typeof refreshUser === 'function') {
                try {
                  await refreshUser();
                } catch {
                  /* ignore */
                }
              }
              return {
                ok: true,
                mode: 'updated',
                tier: res.data.tier,
                effectiveTier: res.data.effectiveTier,
                unchanged: res.data.unchanged,
              };
            }
          } catch (changeErr) {
            const code = changeErr?.response?.data?.code;
            const status = changeErr?.response?.status;
            if (status === 400 && code === 'NO_ACTIVE_SUBSCRIPTION') {
              /* fall through to new Checkout */
            } else if (changeErr?.response) {
              const msg = changeErr.response.data?.message || changeErr.message;
              if (status === 401) return { needAuth: true, message: msg };
              if (status === 503 || status === 500) return { backendError: true, message: msg };
              return { fatal: true, message: msg };
            } else {
              return {
                backendError: true,
                message:
                  'Cannot reach the billing server. Check that the API is running and REACT_APP_BACKEND_URL matches your backend URL.',
              };
            }
          }
        }
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
