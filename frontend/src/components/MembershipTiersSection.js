import { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Check, Crown, Sprout, Zap } from 'lucide-react';
import { Button } from './ui/button';
import { ROUTES } from '../constants';
import { MEMBERSHIP_PLANS, getPlanPriceDisplay } from '../data/membershipPlans';
import { getPlanActionLabel, redirectToPlanCheckout } from '../lib/billing';
import { useCheckoutLoading } from '../lib/checkoutLoadingContext';
import { useAuth } from '../lib/auth';
import { vendorAPI } from '../lib/api';
import { membershipPlanTierFromVendors } from '../lib/membershipTier';

const TIER_ICONS = {
  free: Sprout,
  standard: Zap,
  premium: Crown,
};

/** Visual theme per tier — free: spruce on white; standard: purple gradient + Best ribbon; gold: warm gradient. */
function tierTheme(planId) {
  if (planId === 'free') {
    return {
      card: 'border border-spruce-100 bg-white text-spruce-900 shadow-[0_10px_40px_-10px_rgba(15,76,58,0.12)]',
      iconWrap: 'bg-spruce-50 text-spruce-700 ring-1 ring-spruce-200/90',
      price: 'text-spruce-900',
      freq: 'text-spruce-700',
      altPrice: 'text-spruce-600/95',
      rule: 'border-spruce-200',
      planTitle: 'text-spruce-900',
      desc: 'text-spruce-800',
      feature: 'text-spruce-800',
      checkBg: 'bg-spruce-100 text-spruce-800 ring-1 ring-spruce-200/80',
      btnActive: '!rounded-full !bg-spruce-700 !text-white hover:!bg-spruce-800 !shadow-md !shadow-spruce-900/15',
      btnCurrent: '!rounded-full !bg-spruce-100 !text-spruce-700 hover:!bg-spruce-100',
    };
  }
  if (planId === 'standard') {
    return {
      card: 'border-0 bg-gradient-to-b from-[#c4b5fd] via-[#8b5cf6] to-[#5b21b6] text-white shadow-[0_14px_44px_-12px_rgba(91,33,182,0.55)]',
      iconWrap: 'bg-white/15 text-white ring-1 ring-white/35 backdrop-blur-sm',
      price: 'text-white',
      freq: 'text-white/85',
      altPrice: 'text-white/75',
      rule: 'border-white/25',
      planTitle: 'text-white',
      desc: 'text-white/88',
      feature: 'text-white/92',
      checkBg: 'bg-white/20 text-white ring-white/30',
      btnActive: '!rounded-full !bg-white !text-violet-700 hover:!bg-violet-50 !shadow-lg',
      btnCurrent: '!rounded-full !bg-white/25 !text-white/80 hover:!bg-white/25',
    };
  }
  return {
    card: 'border-0 bg-gradient-to-b from-[#fb923c] via-[#f43f5e] to-[#9f1239] text-white shadow-[0_16px_48px_-12px_rgba(190,18,60,0.5)]',
    iconWrap: 'bg-white/15 text-white ring-1 ring-white/35 backdrop-blur-sm',
    price: 'text-white',
    freq: 'text-white/85',
    altPrice: 'text-white/75',
    rule: 'border-white/25',
    planTitle: 'text-white',
    desc: 'text-white/88',
    feature: 'text-white/92',
    checkBg: 'bg-white/20 text-white ring-white/30',
    btnActive: '!rounded-full !bg-white !text-rose-600 hover:!bg-rose-50 !shadow-lg',
    btnCurrent: '!rounded-full !bg-white/25 !text-white/80 hover:!bg-white/25',
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
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.28em] text-spruce-700">Membership</p>
          <h2 className="font-heading text-3xl font-bold tracking-tight text-slate-900 md:text-[2.35rem] md:leading-tight">
            Plans built for Alberta vendors
          </h2>
          <p className="mt-3 text-base leading-relaxed text-slate-600 md:text-lg">
            Start free, upgrade when you want more visibility and tools. Prices shown in CAD and USD.
          </p>
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
          {MEMBERSHIP_PLANS.map((plan) => {
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
                  {plan.features.map((f) => (
                    <li key={f} className={`flex w-full items-start justify-start gap-3 text-left text-sm leading-snug ${t.feature}`}>
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
