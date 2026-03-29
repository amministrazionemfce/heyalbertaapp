import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Check, Crown, Sprout, Zap } from 'lucide-react';
import { Button } from './ui/button';
import { ROUTES } from '../constants';
import { getPlanPriceDisplay } from '../data/membershipPlans';
import { siteAPI, vendorAPI } from '../lib/api';
import {
  mergeMembershipPlansFromSettings,
  membershipSectionHeadlinesFromSettings,
} from '../lib/membershipCopy';
import { getPlanActionLabel, redirectToPlanCheckout } from '../lib/billing';
import { useCheckoutLoading } from '../lib/checkoutLoadingContext';
import { useAuth } from '../lib/auth';
import { membershipPlanTierFromVendors } from '../lib/membershipTier';

const TIER_ICONS = {
  free: Sprout,
  standard: Zap,
  premium: Crown,
};

/** Visual theme per tier — mid-depth gradients; white text stays readable. */
function tierTheme(planId) {
  if (planId === 'free') {
    return {
      card: 'border-0 bg-gradient-to-b from-[#5f8f32] via-[#2dd4bf] to-[#0f766e] text-white shadow-[0_18px_50px_-14px_rgba(15,118,110,0.45)]',
      iconWrap: 'bg-white/20 text-white ring-1 ring-white/45 backdrop-blur-sm',
      price: 'text-white drop-shadow-sm',
      freq: 'text-white',
      altPrice: 'text-white/90',
      rule: 'border-white/35',
      planTitle: 'text-white drop-shadow-sm',
      desc: 'text-white',
      feature: 'text-white',
      checkBg: 'bg-white/25 text-white ring-1 ring-white/40',
      btnActive: '!rounded-full !bg-white !text-teal-900 hover:!bg-teal-50 !shadow-lg',
      btnCurrent: '!rounded-full !bg-white/30 !text-white hover:!bg-white/35',
    };
  }
  if (planId === 'standard') {
    return {
      card: 'border-0 bg-gradient-to-b from-[#8b5cf6] via-[#7c3aed] to-[#5b21b6] text-white shadow-[0_18px_48px_-12px_rgba(91,33,182,0.45)]',
      iconWrap: 'bg-white/20 text-white ring-1 ring-white/40 backdrop-blur-sm',
      price: 'text-white drop-shadow-sm',
      freq: 'text-white',
      altPrice: 'text-white/90',
      rule: 'border-white/35',
      planTitle: 'text-white drop-shadow-sm',
      desc: 'text-white',
      feature: 'text-white',
      checkBg: 'bg-white/25 text-white ring-1 ring-white/40',
      btnActive: '!rounded-full !bg-white !text-violet-800 hover:!bg-violet-50 !shadow-lg',
      btnCurrent: '!rounded-full !bg-white/30 !text-white hover:!bg-white/35',
    };
  }
  return {
    card: 'border-0 bg-gradient-to-b from-[#ea580c] via-[#e11d48] to-[#9f1239] text-white shadow-[0_18px_50px_-12px_rgba(159,18,57,0.45)]',
    iconWrap: 'bg-white/20 text-white ring-1 ring-white/40 backdrop-blur-sm',
    price: 'text-white drop-shadow-sm',
    freq: 'text-white',
    altPrice: 'text-white/90',
    rule: 'border-white/35',
    planTitle: 'text-white drop-shadow-sm',
    desc: 'text-white',
    feature: 'text-white',
    checkBg: 'bg-white/25 text-white ring-1 ring-white/40',
    btnActive: '!rounded-full !bg-white !text-rose-700 hover:!bg-rose-50 !shadow-lg',
    btnCurrent: '!rounded-full !bg-white/30 !text-white hover:!bg-white/35',
  };
}

function TierBadge({ tier }) {
  if (tier === 'premium') {
    return (
      <span className="inline-flex rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-semibold text-rose-900 ring-1 ring-rose-200/80">
        Gold
      </span>
    );
  }
  if (tier === 'standard') {
    return (
      <span className="inline-flex rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-semibold text-violet-900 ring-1 ring-violet-200/80">
        Standard
      </span>
    );
  }
  return (
    <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700 ring-1 ring-slate-200/80">
      Free
    </span>
  );
}

export default function MembershipTiersSection({ defaultCadence = 'monthly', onSelectPlan } = {}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { startCheckoutLoading, stopCheckoutLoading } = useCheckoutLoading();
  const [cadence, setCadence] = useState(defaultCadence === 'yearly' ? 'yearly' : 'monthly');
  const [loadingPlanId, setLoadingPlanId] = useState('');
  const [currentTier, setCurrentTier] = useState('free');
  const [siteSettings, setSiteSettings] = useState(null);

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
    if (!user) {
      setCurrentTier('free');
      return;
    }
    try {
      const vendorsRes = await vendorAPI.myVendors();
      const vendors = vendorsRes.data || [];
      setCurrentTier(membershipPlanTierFromVendors(vendors));
    } catch {
      setCurrentTier('free');
    }
  }, [user]);

  useEffect(() => {
    resolveTier();
  }, [user?.id, location.search, resolveTier]);

  useEffect(() => {
    setCadence(defaultCadence === 'yearly' ? 'yearly' : 'monthly');
  }, [defaultCadence]);

  const handlePlanAction = async (plan) => {
    try {
      setLoadingPlanId(plan.id);
      if (typeof onSelectPlan === 'function') {
        await onSelectPlan(plan, { cadence });
        return;
      }
      startCheckoutLoading(
        plan.id === 'free' ? 'Opening billing portal…' : 'Preparing secure checkout…'
      );
      const result = await redirectToPlanCheckout(plan.id, cadence);
      if (!result.ok) {
        if (result.needAuth) {
          toast.info('Sign in to subscribe or manage billing.');
          navigate(ROUTES.LOGIN, { state: { from: location.pathname } });
          return;
        }
        toast.error(result.message || 'Billing is not available right now.');
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
    }
  };

  return (
    <section
      className="relative border-t border-slate-200/80 bg-gradient-to-b from-white via-slate-50/90 to-slate-100/80"
      data-testid="membership-tiers-section"
    >
      <div className="container relative mx-auto max-w-7xl px-4 pb-16 pt-10 md:px-8 md:pb-24 md:pt-14">
        <div className="mx-auto mb-10 max-w-2xl text-center md:mb-12">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.28em] text-spruce-700">{headlines.eyebrow}</p>
          <h2 className="font-heading text-3xl font-bold tracking-tight text-slate-900 md:text-[2.35rem] md:leading-tight">
            {headlines.title}
          </h2>
          <p className="mt-3 text-base leading-relaxed text-slate-600 md:text-lg">{headlines.subtitle}</p>
        </div>

        <div className="mb-10 flex justify-center md:mb-12">
          <div
            className="inline-flex rounded-full bg-slate-200/80 p-1 shadow-inner ring-1 ring-slate-200/90"
            role="group"
            aria-label="Billing period"
          >
            <button
              type="button"
              onClick={() => setCadence('monthly')}
              className={`rounded-full px-5 py-2.5 text-sm font-bold uppercase tracking-wide transition-all duration-200 ${
                cadence === 'monthly'
                  ? 'bg-spruce-700 text-white shadow-md shadow-slate-900/10 ring-1 ring-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setCadence('yearly')}
              className={`rounded-full px-5 py-2.5 text-sm font-bold uppercase tracking-wide transition-all duration-200 ${
                cadence === 'yearly'
                  ? 'bg-spruce-700 text-white shadow-md shadow-slate-900/10 ring-1 ring-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Yearly
            </button>
          </div>
        </div>

        <div className="mx-auto grid max-w-6xl gap-6 sm:gap-7 md:grid-cols-3 md:items-stretch md:gap-6 lg:gap-8">
          {displayPlans.map((plan) => {
            const isCurrent = plan.id === currentTier;
            const prices = getPlanPriceDisplay(plan, cadence);
            const isFeatured = plan.id === 'standard';
            const isStandard = plan.id === 'standard';
            const loading = loadingPlanId === plan.id;
            const Icon = TIER_ICONS[plan.id] || Sprout;
            const t = tierTheme(plan.id);
            const label = loading ? 'Please wait…' : getPlanActionLabel(plan.id, currentTier);
            const isDowngradeFreeCta = plan.id === 'free' && currentTier !== 'free';

            return (
              <div
                key={plan.id}
                className={`relative flex h-full flex-col overflow-hidden rounded-[14px] p-8 transition duration-300 md:p-9 ${t.card} ${
                  isStandard ? 'md:z-10 md:-translate-y-4 lg:-translate-y-5' : ''
                }`}
              >
                {isFeatured && (
                  <div
                    className="pointer-events-none absolute right-0 top-0 z-20 h-16 w-16 overflow-hidden rounded-tr-[14px] md:h-[4.5rem] md:w-[4.5rem]"
                    aria-hidden
                  >
                    <div className="absolute right-[-28px] top-[14px] w-[120px] rotate-45 bg-gradient-to-r from-rose-500 to-pink-600 py-2 text-center text-[12px] font-extrabold uppercase tracking-widest text-white shadow-sm">
                      Popular
                    </div>
                  </div>
                )}

                <div className="flex flex-col items-center text-center">
                  <span
                    className={`mb-5 flex h-[52px] w-[52px] items-center justify-center rounded-2xl ${t.iconWrap}`}
                  >
                    <Icon className="h-7 w-7" strokeWidth={1.65} aria-hidden />
                  </span>

                  <p className={`font-heading text-3xl font-bold tabular-nums tracking-tight md:text-[2rem] md:leading-none ${t.price}`}>
                    {prices.primary}
                  </p>
                  {prices.secondary && (
                    <p className={`mt-2 text-sm font-medium ${t.freq}`}>{prices.secondary}</p>
                  )}
                  {prices.alternate && (
                    <p className={`mt-2 text-xs leading-relaxed ${t.altPrice}`}>{prices.alternate}</p>
                  )}

                  <hr className={`my-6 w-full max-w-[200px] border-t ${t.rule}`} />

                  <p className={`text-sm font-bold uppercase tracking-[0.12em] ${t.planTitle}`}>{plan.tagline}</p>
                  <h3 className={`mt-2 font-heading text-lg font-bold leading-snug ${t.planTitle}`}>
                    {plan.name}
                  </h3>

                  <p className={`mt-4 text-sm leading-relaxed ${t.desc}`}>{plan.description}</p>
                </div>

                <ul className="mt-6 flex w-full flex-1 flex-col gap-2.5 text-left">
                  {plan.features.map((f, fi) => (
                    <li
                      key={`${plan.id}-${fi}-${String(f).slice(0, 24)}`}
                      className={`flex w-full items-start justify-start gap-3 text-left text-sm leading-snug ${t.feature}`}
                    >
                      <span
                        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ring-1 ${t.checkBg}`}
                        aria-hidden
                      >
                        <Check className="h-3 w-3" strokeWidth={3} />
                      </span>
                      <span className="min-w-0 flex-1 text-left">{f}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  type="button"
                  disabled={loading || isCurrent}
                  onClick={() => handlePlanAction(plan)}
                  variant="default"
                  className={`mt-8 h-12 w-full text-sm font-extrabold uppercase tracking-wide disabled:pointer-events-none ${
                    isCurrent
                      ? `${t.btnCurrent} disabled:!opacity-100`
                      : isDowngradeFreeCta
                        ? '!rounded-full !bg-spruce-800 !text-white hover:!bg-spruce-900 !shadow-md disabled:!opacity-55'
                        : `${t.btnActive} disabled:!opacity-55`
                  }`}
                >
                  {label}
                </Button>
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
      className="relative overflow-hidden rounded-xl border border-slate-200 bg-gradient-to-b from-white via-slate-50/90 to-slate-100/80 shadow-inner"
      data-testid="membership-tiers-preview"
      aria-label="Membership section preview"
    >
      <div className="max-h-[min(85vh,900px)] overflow-y-auto overflow-x-hidden overscroll-contain">
        <div className="relative w-full px-3 pb-10 pt-6 md:px-5 md:pb-12 md:pt-8">
          <div className="mx-auto mb-6 max-w-2xl text-center md:mb-8">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.28em] text-spruce-700 md:text-[11px]">
              {headlines.eyebrow}
            </p>
            <h2 className="font-heading text-xl font-bold tracking-tight text-slate-900 sm:text-2xl md:text-[1.85rem] md:leading-tight">
              {headlines.title}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 md:text-base">{headlines.subtitle}</p>
          </div>

          <div className="mb-6 flex justify-center md:mb-8">
            <div
              className="inline-flex rounded-full bg-slate-200/80 p-1 shadow-inner ring-1 ring-slate-200/90"
              role="group"
              aria-label="Billing period (preview)"
            >
              <button
                type="button"
                onClick={() => setCadence('monthly')}
                className={`rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wide transition-all duration-200 md:px-5 md:py-2.5 md:text-sm ${
                  cadence === 'monthly'
                    ? 'bg-spruce-700 text-white shadow-md shadow-slate-900/10 ring-1 ring-slate-200/80'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setCadence('yearly')}
                className={`rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wide transition-all duration-200 md:px-5 md:py-2.5 md:text-sm ${
                  cadence === 'yearly'
                    ? 'bg-spruce-700 text-white shadow-md shadow-slate-900/10 ring-1 ring-slate-200/80'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Yearly
              </button>
            </div>
          </div>

          <div className="mx-auto grid w-full max-w-6xl gap-4 sm:gap-5 md:grid-cols-3 md:items-stretch md:gap-6 lg:gap-7">
            {displayPlans.map((plan) => {
              const prices = getPlanPriceDisplay(plan, cadence);
              const isFeatured = plan.id === 'standard';
              const isStandard = plan.id === 'standard';
              const Icon = TIER_ICONS[plan.id] || Sprout;
              const t = tierTheme(plan.id);
              const label = getPlanActionLabel(plan.id, previewTier);

              return (
                <div
                  key={plan.id}
                  className={`relative flex h-full flex-col overflow-hidden rounded-[14px] p-5 transition duration-300 md:p-7 ${t.card} ${
                    isStandard ? 'md:z-10 md:-translate-y-2 lg:-translate-y-3' : ''
                  }`}
                >
                  {isFeatured && (
                    <div
                      className="pointer-events-none absolute right-0 top-0 z-20 h-14 w-14 overflow-hidden rounded-tr-[14px] md:h-16 md:w-16"
                      aria-hidden
                    >
                      <div className="absolute right-[-26px] top-3 w-[110px] rotate-45 bg-gradient-to-r from-rose-500 to-pink-600 py-1.5 text-center text-[10px] font-extrabold uppercase tracking-widest text-white shadow-sm md:text-[12px] md:py-2">
                        Popular
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col items-center text-center">
                    <span
                      className={`mb-4 flex h-11 w-11 items-center justify-center rounded-2xl md:mb-5 md:h-[52px] md:w-[52px] ${t.iconWrap}`}
                    >
                      <Icon className="h-6 w-6 md:h-7 md:w-7" strokeWidth={1.65} aria-hidden />
                    </span>

                    <p
                      className={`font-heading text-2xl font-bold tabular-nums tracking-tight md:text-[1.75rem] md:leading-none ${t.price}`}
                    >
                      {prices.primary}
                    </p>
                    {prices.secondary && (
                      <p className={`mt-1.5 text-xs font-medium md:mt-2 md:text-sm ${t.freq}`}>{prices.secondary}</p>
                    )}
                    {prices.alternate && (
                      <p className={`mt-1.5 text-[10px] leading-relaxed md:mt-2 md:text-xs ${t.altPrice}`}>
                        {prices.alternate}
                      </p>
                    )}

                    <hr className={`my-4 w-full max-w-[180px] border-t md:my-6 md:max-w-[200px] ${t.rule}`} />

                    <p className={`text-xs font-bold uppercase tracking-[0.12em] md:text-sm ${t.planTitle}`}>
                      {plan.tagline}
                    </p>
                    <h3 className={`mt-1.5 font-heading text-base font-bold leading-snug md:mt-2 md:text-lg ${t.planTitle}`}>
                      {plan.name}
                    </h3>

                    <p className={`mt-3 text-xs leading-relaxed md:mt-4 md:text-sm ${t.desc}`}>{plan.description}</p>
                  </div>

                  <ul className="mt-4 flex w-full flex-1 flex-col gap-2 text-left md:mt-6 md:gap-2.5">
                    {plan.features.map((f, fi) => (
                      <li
                        key={`${plan.id}-pv-${fi}-${String(f).slice(0, 20)}`}
                        className={`flex w-full items-start justify-start gap-2 text-left text-xs leading-snug md:gap-3 md:text-sm ${t.feature}`}
                      >
                        <span
                          className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full ring-1 md:h-5 md:w-5 ${t.checkBg}`}
                          aria-hidden
                        >
                          <Check className="h-2.5 w-2.5 md:h-3 md:w-3" strokeWidth={3} />
                        </span>
                        <span className="min-w-0 flex-1 text-left">{f}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    type="button"
                    disabled
                    variant="default"
                    title="Preview only"
                    className={`mt-6 h-10 w-full cursor-not-allowed text-xs font-extrabold uppercase tracking-wide opacity-80 md:mt-8 md:h-12 md:text-sm ${t.btnActive}`}
                  >
                    {label}
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
