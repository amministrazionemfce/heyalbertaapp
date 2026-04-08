import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Check } from 'lucide-react';
import { Button } from './ui/button';
import { ROUTES } from '../constants';
import { getPlanPriceDisplay } from '../data/membershipPlans';
import { siteAPI, listingAPI, billingAPI } from '../lib/api';
import {
  mergeMembershipPlansFromSettings,
  membershipSectionHeadlinesFromSettings,
} from '../lib/membershipCopy';
import { getPlanActionLabel, redirectToPlanCheckout } from '../lib/billing';
import { useCheckoutLoading } from '../lib/checkoutLoadingContext';
import { useAuth } from '../lib/auth';
import { membershipPlanTierFromUserAndListings } from '../lib/membershipTier';

/** Shared spruce palette for all tiers (no per-tier accent colors). */
const MEMBERSHIP_CARD_THEME = {
  shell:
    'bg-white border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow duration-300',
  price: 'text-slate-900',
  freq: 'text-spruce-700',
  divider: 'border-slate-200',
  tagline: 'text-spruce-700',
  name: 'text-slate-900',
  desc: 'text-slate-600',
  feature: 'text-slate-700',
  btnActive:
    '!rounded-lg !bg-spruce-700 !text-white hover:!bg-spruce-800 !font-semibold !tracking-normal',
};

function CurrentPlanBadge() {
  return (
    <span
      className="inline-flex items-center gap-2 rounded-full py-1.5 pl-1.5 pr-4 text-sm font-semibold text-spruce-900"
      data-testid="membership-current-plan-badge"
    >
      <span
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-spruce-700 text-white shadow-inner"
        aria-hidden
      >
        <Check className="h-4 w-4" strokeWidth={2.75} />
      </span>
      Current plan
    </span>
  );
}

/** Top-right corner ribbon for Standard — spruce gradient to match site accents. */
function PopularRibbon({ compact = false }) {
  return (
    <div
      className={`pointer-events-none absolute right-0 top-0 z-20 overflow-hidden rounded-tr-2xl ${
        compact ? 'h-14 w-14' : 'h-[4.25rem] w-[4.25rem] md:h-[4.75rem] md:w-[4.75rem]'
      }`}
      aria-hidden
      data-testid="membership-popular-ribbon"
    >
      <div
        className={`absolute rotate-45 bg-gradient-to-r from-spruce-800 via-spruce-700 to-spruce-900 text-center font-extrabold uppercase tracking-[0.18em] text-white shadow-md ${
          compact
            ? '-right-7 top-3 w-[110px] py-1.5 text-[9px]'
            : '-right-8 top-4 w-[130px] py-2 text-[10px] md:-right-9 md:top-5 md:w-[140px] md:text-[11px]'
        }`}
      >
        Popular
      </div>
    </div>
  );
}

export default function MembershipTiersSection({ defaultCadence = 'monthly', onSelectPlan } = {}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, refreshUser } = useAuth();
  const { startCheckoutLoading, stopCheckoutLoading } = useCheckoutLoading();
  const [cadence, setCadence] = useState(defaultCadence === 'yearly' ? 'yearly' : 'monthly');
  const [loadingPlanId, setLoadingPlanId] = useState('');
  const [currentTier, setCurrentTier] = useState('free');
  const [membershipLoading, setMembershipLoading] = useState(true);
  const [siteSettings, setSiteSettings] = useState(null);
  /** Latest user for async tier resolution without re-subscribing when refreshUser() replaces the object. */
  const userRef = useRef(user);
  userRef.current = user;

  useEffect(() => {
    let cancelled = false;
    siteAPI
      .settings()
      .then((r) => {
        if (!cancelled) setSiteSettings(r.data || null);
      })
      .catch(() => {
        if (!cancelled) setSiteSettings(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const displayPlans = useMemo(
    () => mergeMembershipPlansFromSettings(siteSettings),
    [siteSettings]
  );
  const headlines = useMemo(
    () => membershipSectionHeadlinesFromSettings(siteSettings),
    [siteSettings]
  );

  const resolveTier = useCallback(async () => {
    const u = userRef.current;
    if (!u) {
      setCurrentTier('free');
      setMembershipLoading(false);
      return;
    }
    setMembershipLoading(true);
    try {
      try {
        const syncRes = await billingAPI.syncSubscription();
        const eff = syncRes?.data?.effectiveTier;
        if (eff === 'free' || eff === 'standard' || eff === 'premium') {
          setCurrentTier(eff);
          try {
            await refreshUser();
          } catch {
            /* ignore */
          }
          setMembershipLoading(false);
          return;
        }
      } catch {
        /* Stripe not configured or offline */
      }
      const listingsRes = await listingAPI.myListings();
      const rows = listingsRes.data || [];
      setCurrentTier(membershipPlanTierFromUserAndListings(userRef.current, rows));
    } catch {
      setCurrentTier(membershipPlanTierFromUserAndListings(userRef.current, []));
    } finally {
      setMembershipLoading(false);
    }
  }, [refreshUser]);

  useEffect(() => {
    resolveTier();
    // Intentionally omit user.billingTier / promo fields: refreshUser() after sync would retrigger forever.
  }, [user?.id, location.search, resolveTier]);

  useEffect(() => {
    setCadence(defaultCadence === 'yearly' ? 'yearly' : 'monthly');
  }, [defaultCadence]);

  const handlePlanAction = async (plan) => {
    try {
      setLoadingPlanId(plan.id);
      setMembershipLoading(true);
      if (typeof onSelectPlan === 'function') {
        await onSelectPlan(plan, { cadence });
        return;
      }
      const bt = String(userRef.current?.billingTier || 'free').toLowerCase();
      const likelySubscriptionUpdate =
        (bt === 'standard' || bt === 'premium') && (plan.id === 'standard' || plan.id === 'premium');
      startCheckoutLoading(
        plan.id === 'free'
          ? 'Opening billing portal…'
          : likelySubscriptionUpdate
            ? 'Updating your plan…'
            : 'Preparing secure checkout…'
      );
      const result = await redirectToPlanCheckout(plan.id, cadence, {
        billingTier: userRef.current?.billingTier,
        refreshUser,
      });
      if (!result.ok) {
        if (result.needAuth) {
          toast.info('Sign in to subscribe or manage billing.');
          navigate(ROUTES.LOGIN, { state: { from: location.pathname } });
          return;
        }
        toast.error(result.message || 'Billing is not available right now.');
        return;
      }
      if (result.mode === 'updated') {
        if (result.effectiveTier === 'free' || result.effectiveTier === 'standard' || result.effectiveTier === 'premium') {
          setCurrentTier(result.effectiveTier);
        }
        toast.success(result.unchanged ? 'You are already on this plan.' : 'Your subscription was updated.');
        return;
      }
      if (result.mode === 'portal') {
        window.location.href = result.url;
        return;
      }
      sessionStorage.setItem(
        'hey_alberta_checkout_payload',
        JSON.stringify({
          clientSecret: result.clientSecret || '',
          checkoutUrl: result.url || '',
          planId: plan.id,
          cadence,
          ts: Date.now(),
        })
      );
      navigate(ROUTES.CHECKOUT);
    } finally {
      stopCheckoutLoading();
      setLoadingPlanId('');
      setMembershipLoading(false);
    }
  };

  return (
    <section
      id="membership"
      className="relative scroll-mt-20 border-t border-slate-200/70 bg-white"
      data-testid="membership-tiers-section"
    >
      <div className="container relative mx-auto max-w-7xl px-4 pb-16 pt-12 md:px-8 md:pb-24 md:pt-16">
        <div className="mx-auto mb-10 max-w-2xl text-center md:mb-14">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-spruce-700">
            {headlines.eyebrow}
          </p>
          <h2 className="font-heading text-3xl font-bold tracking-tight text-slate-900 md:text-4xl md:leading-tight">
            {headlines.title}
          </h2>
          <p className="mt-4 text-base leading-relaxed text-slate-600 md:text-lg">{headlines.subtitle}</p>
        </div>

        <div className="mb-12 flex justify-center md:mb-14">
          <div
            className="inline-flex rounded-xl border border-slate-200/90 bg-white p-1 shadow-sm"
            role="group"
            aria-label="Billing period"
          >
            <button
              type="button"
              onClick={() => setCadence('monthly')}
              className={`rounded-lg px-6 py-2.5 text-sm font-semibold transition-colors ${
                cadence === 'monthly'
                  ? 'bg-spruce-800 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-spruce-50 hover:text-spruce-900'
              }`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setCadence('yearly')}
              className={`rounded-lg px-6 py-2.5 text-sm font-semibold transition-colors ${
                cadence === 'yearly'
                  ? 'bg-spruce-800 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-spruce-50 hover:text-spruce-900'
              }`}
            >
              Yearly
            </button>
          </div>
        </div>

        <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-3 md:items-stretch md:gap-6 lg:gap-8">
          {displayPlans.map((plan) => {
            const prices = getPlanPriceDisplay(plan, cadence);
            const isFeatured = plan.id === 'standard';
            const loading = loadingPlanId === plan.id;
            const t = MEMBERSHIP_CARD_THEME;
            const isCurrent = !membershipLoading && plan.id === currentTier;
            const label = loading ? 'Please wait…' : getPlanActionLabel(plan.id, currentTier);
            const isDowngradeFreeCta = plan.id === 'free' && currentTier !== 'free';

            return (
              <div
                key={plan.id}
                className={`relative flex h-full flex-col overflow-hidden rounded-2xl ${t.shell}`}
              >
                {membershipLoading ? null : isFeatured ? <PopularRibbon /> : null}
                <div className="flex flex-1 flex-col px-7 pb-8 pt-7 md:px-8 md:pb-9 md:pt-8">
                  <div className="mb-5 flex min-h-[2.75rem] flex-wrap items-center justify-center gap-2">
                    {membershipLoading ? (
                      <div className="h-9 w-36 animate-pulse rounded-full bg-slate-100" aria-hidden />
                    ) : isCurrent ? (
                      <CurrentPlanBadge />
                    ) : null}
                  </div>

                  <div className="flex flex-col items-center text-center">
                    {membershipLoading ? (
                      <>
                        <div className="h-10 w-24 animate-pulse rounded-lg bg-slate-100" aria-hidden />
                        <div className="mt-2 h-4 w-28 animate-pulse rounded bg-slate-100" aria-hidden />
                      </>
                    ) : (
                      <>
                        <p
                          className={`font-heading text-3xl font-bold tabular-nums tracking-tight md:text-[2.125rem] md:leading-none ${t.price}`}
                        >
                          {prices.primary}
                        </p>
                        {prices.secondary && (
                          <p className={`mt-1.5 text-sm font-medium ${t.freq}`}>{prices.secondary}</p>
                        )}
                      </>
                    )}

                    <hr className={`my-6 w-full max-w-[220px] border-t ${t.divider}`} />

                    {membershipLoading ? (
                      <>
                        <div className="h-3 w-20 animate-pulse rounded bg-slate-100" aria-hidden />
                        <div className="mt-3 h-6 w-28 animate-pulse rounded bg-slate-100" aria-hidden />
                      </>
                    ) : (
                      <>
                        <p className={`text-xs font-semibold uppercase tracking-wider ${t.tagline}`}>
                          {plan.tagline}
                        </p>
                        <h3 className={`mt-2 font-heading text-xl font-bold leading-snug ${t.name}`}>
                          {plan.name}
                        </h3>
                      </>
                    )}

                    <p className={`mt-3 text-sm leading-relaxed ${t.desc}`}>{plan.description}</p>
                  </div>

                  <ul className="mt-7 flex w-full flex-1 flex-col gap-3 text-left">
                    {membershipLoading
                      ? Array.from({ length: Math.min(5, plan.features?.length || 5) }).map((_, i) => (
                          <li
                            key={`${plan.id}-sk-${i}`}
                            className={`flex w-full items-start gap-3 text-left text-sm leading-snug ${t.feature}`}
                            aria-hidden
                          >
                            <div className="mt-1 h-5 w-5 shrink-0 animate-pulse rounded bg-slate-100" />
                            <div className="h-4 w-full animate-pulse rounded bg-slate-100" />
                          </li>
                        ))
                      : plan.features.map((f, fi) => (
                          <li
                            key={`${plan.id}-${fi}-${String(f).slice(0, 24)}`}
                            className={`flex w-full items-start gap-3 text-left text-sm leading-snug ${t.feature}`}
                          >
                            <Check
                              className="mt-0.5 h-5 w-5 shrink-0 text-spruce-700"
                              strokeWidth={2.5}
                              aria-hidden
                            />
                            <span className="min-w-0 flex-1 text-left">{f}</span>
                          </li>
                        ))}
                  </ul>

                  {isCurrent ? (
                    <div
                      className="mt-8 h-11 w-full shrink-0"
                      aria-hidden
                    />
                  ) : (
                    <Button
                      type="button"
                      disabled={membershipLoading || loading}
                      onClick={() => handlePlanAction(plan)}
                      variant="default"
                      className={`mt-8 h-11 w-full text-sm disabled:pointer-events-none ${
                        isDowngradeFreeCta
                          ? '!rounded-lg !bg-spruce-900 !text-white hover:!bg-spruce-800 !font-semibold disabled:!opacity-55'
                          : `${t.btnActive} disabled:!opacity-55`
                      }`}
                    >
                      {label}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/**
 * Read-only preview of the membership block for admin (uses same merge rules as the public section).
 * @param {{ form: Record<string, string> }} props
 */
export function MembershipTiersPreview({ form }) {
  const [cadence, setCadence] = useState('monthly');
  const displayPlans = useMemo(() => mergeMembershipPlansFromSettings(form), [form]);
  const headlines = useMemo(() => membershipSectionHeadlinesFromSettings(form), [form]);
  const previewTier = 'free';

  return (
    <section
      className="relative overflow-hidden rounded-xl border border-slate-200 shadow-inner"
      data-testid="membership-tiers-preview"
      aria-label="Membership section preview"
    >
      <div className="max-h-[min(85vh,900px)] overflow-y-auto overflow-x-hidden overscroll-contain">
        <div className="relative w-full px-3 pb-10 pt-6 md:px-5 md:pb-12 md:pt-8">
          <div className="mx-auto mb-6 max-w-2xl text-center md:mb-8">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-spruce-700 md:text-xs">
              {headlines.eyebrow}
            </p>
            <h2 className="font-heading text-xl font-bold tracking-tight text-slate-900 sm:text-2xl md:text-[1.85rem] md:leading-tight">
              {headlines.title}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 md:text-base">{headlines.subtitle}</p>
          </div>

          <div className="mb-6 flex justify-center md:mb-8">
            <div
              className="inline-flex rounded-xl border border-slate-200/90 bg-white p-1 shadow-sm"
              role="group"
              aria-label="Billing period (preview)"
            >
              <button
                type="button"
                onClick={() => setCadence('monthly')}
                className={`rounded-lg px-4 py-2 text-xs font-semibold transition-colors md:px-5 md:py-2.5 md:text-sm ${
                  cadence === 'monthly'
                    ? 'bg-spruce-800 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-spruce-50 hover:text-spruce-900'
                }`}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setCadence('yearly')}
                className={`rounded-lg px-4 py-2 text-xs font-semibold transition-colors md:px-5 md:py-2.5 md:text-sm ${
                  cadence === 'yearly'
                    ? 'bg-spruce-800 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-spruce-50 hover:text-spruce-900'
                }`}
              >
                Yearly
              </button>
            </div>
          </div>

          <div className="mx-auto grid w-full max-w-6xl gap-5 md:grid-cols-3 md:items-stretch md:gap-6">
            {displayPlans.map((plan) => {
              const prices = getPlanPriceDisplay(plan, cadence);
              const isFeatured = plan.id === 'standard';
              const isCurrent = plan.id === previewTier;
              const t = MEMBERSHIP_CARD_THEME;
              const label = getPlanActionLabel(plan.id, previewTier);

              return (
                <div
                  key={plan.id}
                  className={`relative flex h-full flex-col overflow-hidden rounded-2xl ${t.shell}`}
                >
                  {isFeatured ? <PopularRibbon compact /> : null}
                  <div className="flex flex-1 flex-col px-5 pb-6 pt-5 md:px-6 md:pb-7 md:pt-6">
                    <div className="mb-4 flex min-h-[2.25rem] flex-wrap items-center justify-center gap-2 md:mb-5 md:min-h-[2.5rem]">
                      {isCurrent ? (
                        <span className="scale-90 md:scale-100">
                          <CurrentPlanBadge />
                        </span>
                      ) : null}
                    </div>

                    <div className="flex flex-col items-center text-center">
                      <p
                        className={`font-heading text-xl font-bold tabular-nums tracking-tight md:text-2xl md:leading-none ${t.price}`}
                      >
                        {prices.primary}
                      </p>
                      {prices.secondary && (
                        <p className={`mt-1 text-xs font-medium md:text-sm ${t.freq}`}>{prices.secondary}</p>
                      )}

                      <hr className={`my-4 w-full max-w-[180px] border-t md:my-5 md:max-w-[200px] ${t.divider}`} />

                      <p className={`text-[10px] font-semibold uppercase tracking-wider md:text-xs ${t.tagline}`}>
                        {plan.tagline}
                      </p>
                      <h3 className={`mt-1.5 font-heading text-base font-bold leading-snug md:text-lg ${t.name}`}>
                        {plan.name}
                      </h3>

                      <p className={`mt-2 text-xs leading-relaxed md:mt-3 md:text-sm ${t.desc}`}>
                        {plan.description}
                      </p>
                    </div>

                    <ul className="mt-4 flex w-full flex-1 flex-col gap-2 text-left md:mt-5 md:gap-2.5">
                      {plan.features.map((f, fi) => (
                        <li
                          key={`${plan.id}-pv-${fi}-${String(f).slice(0, 20)}`}
                          className={`flex w-full items-start gap-2 text-left text-xs leading-snug md:gap-2.5 md:text-sm ${t.feature}`}
                        >
                          <Check
                            className="mt-0.5 h-4 w-4 shrink-0 text-spruce-700 md:h-5 md:w-5"
                            strokeWidth={2.5}
                            aria-hidden
                          />
                          <span className="min-w-0 flex-1 text-left">{f}</span>
                        </li>
                      ))}
                    </ul>

                    {isCurrent ? (
                      <div
                        className="mt-5 h-9 w-full shrink-0 md:mt-7 md:h-10"
                        aria-hidden
                      />
                    ) : (
                      <Button
                        type="button"
                        disabled
                        variant="default"
                        title="Preview only"
                        className={`mt-5 h-9 w-full cursor-not-allowed text-xs opacity-90 md:mt-7 md:h-10 md:text-sm ${t.btnActive}`}
                      >
                        {label}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
