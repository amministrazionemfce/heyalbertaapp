export const MEMBERSHIP_PLANS = Object.freeze([
  {
    id: 'free',
    name: 'Free',
    priceMonthlyLabel: '$0/month',
    priceYearlyLabel: null,
    features: [
      '75-word description limit',
      'One image',
      'No video links',
      'No direct contact links',
      'No Review Display',
    ],
  },
  {
    id: 'standard',
    name: 'Standard',
    /** Dual-currency amounts (Stripe may charge in one currency). */
    pricing: Object.freeze({
      monthly: Object.freeze({ cad: 15, usd: 11 }),
      yearly: Object.freeze({ cad: 160, usd: 118 }),
    }),
    features: [
      'Expanded listing copy (unlimited text)',
      'Multiple images',
      'Embedded YouTube video introduction',
      'Direct contact options (phone, email, website)',
      'Ability to display reviews',
    ],
  },
  {
    id: 'premium',
    name: 'Gold',
      pricing: Object.freeze({
        monthly: Object.freeze({ cad: 20, usd: 15 }),
        yearly: Object.freeze({ cad: 200, usd: 150 }),
      }),
    features: [
      'Priority placement in category and city search results',
      'Highlighted placement in dynamic on-site ads',
      'Ability to post coupons and limited-time promotions',
      'Included in category and city outbound email campaigns',
      'Placement in "Did You Know" recommendation emails',
    ],
  },
]);

export function getPlanById(planId) {
  return MEMBERSHIP_PLANS.find((p) => p.id === planId) || MEMBERSHIP_PLANS[0];
}

/**
 * Display USD amounts only (no CAD line, no “Or monthly/yearly” alternates).
 * @returns {{ primary: string, secondary: string | null, alternate: null }}
 */
export function getPlanPriceDisplay(plan, cadence) {
  if (plan.id === 'free') {
    return { primary: '$0', secondary: 'per month', alternate: null };
  }

  const pricing = plan.pricing;
  if (!pricing) {
    return { primary: '', secondary: null, alternate: null };
  }

  const isYearly = cadence === 'yearly';
  const current = isYearly ? pricing.yearly : pricing.monthly;
  const usd = current?.usd ?? current?.cad;

  return {
    primary: usd != null ? `$${usd}` : '',
    secondary: isYearly ? 'per year' : 'per month',
    alternate: null,
  };
}
