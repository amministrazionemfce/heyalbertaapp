import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import { Button } from './ui/button';

const PLANS = [
  {
    id: 'free',
    name: 'Starter',
    tagline: 'Get discovered',
    price: 'Free',
    period: '',
    features: [
      'Directory listing with essentials',
      '1 profile image',
      'Short business description',
      'Basic visibility in search',
    ],
    popular: false,
  },
  {
    id: 'standard',
    name: 'Growth',
    tagline: 'Build trust',
    price: '$29',
    period: '/month',
    features: [
      'Everything in Starter',
      'Unlimited description & gallery',
      'Video introduction',
      'Verified badge & contact display',
      'Reply to customer reviews',
    ],
    popular: true,
  },
  {
    id: 'premium',
    name: 'Scale',
    tagline: 'Maximum reach',
    price: '$39',
    period: '/month',
    features: [
      'Everything in Growth',
      'Priority placement in directory',
      'Promotions & featured spots',
      'Email campaign inclusion',
      'Dedicated partner support',
    ],
    popular: false,
  },
];

/**
 * Homepage membership / pricing — three tiers, middle plan highlighted.
 */
export default function HomeMembershipTiersSection({ onGetStarted }) {
  return (
    <section
      className="border-t border-slate-200/80 from-slate-100/80 via-white to-slate-50 py-16 md:py-24"
      data-testid="membership-tiers-section"
    >
      <div className="container mx-auto max-w-7xl px-4 md:px-8">
        <div className="mx-auto mb-12 max-w-2xl text-center md:mb-16">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-violet-600">
            Membership
          </p>
          <h2 className="font-heading text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
            Plans that grow with your business
          </h2>
          <p className="mt-4 text-base text-slate-600 md:text-lg">
            Choose a tier that fits today — upgrade anytime as you reach more newcomers across Alberta.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3 lg:gap-8 lg:items-stretch">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`relative flex flex-col rounded-3xl border bg-white p-8 shadow-lg transition md:p-9 ${
                plan.popular
                  ? 'z-10 border-violet-200 ring-2 ring-violet-500/25 shadow-xl shadow-violet-200/40 lg:-translate-y-2 lg:scale-[1.02]'
                  : 'border-slate-200/90 shadow-slate-200/50'
              }`}
              data-testid={`membership-tier-${plan.id}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-violet-600 to-purple-600 px-4 py-1 text-xs font-bold uppercase tracking-wide text-white shadow-md">
                  Most popular
                </div>
              )}

              <div className="mb-6 text-center">
                <p className="text-sm font-medium text-violet-600">{plan.tagline}</p>
                <h3 className="mt-1 font-heading text-2xl font-bold text-slate-900">{plan.name}</h3>
                <div className="mt-4 flex items-baseline justify-center gap-0.5">
                  <span className="text-4xl font-bold tracking-tight text-slate-900 md:text-5xl">{plan.price}</span>
                  {plan.period && (
                    <span className="text-base font-medium text-slate-500">{plan.period}</span>
                  )}
                </div>
              </div>

              <ul className="mb-8 flex flex-1 flex-col gap-3 text-left text-sm text-slate-600">
                {plan.features.map((f) => (
                  <li key={f} className="flex gap-3">
                    <span
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                        plan.popular ? 'bg-violet-100 text-violet-700' : 'bg-purple-50 text-purple-700'
                      }`}
                    >
                      <Check className="h-3 w-3" strokeWidth={3} aria-hidden />
                    </span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              {plan.popular ? (
                <Button
                  type="button"
                  onClick={onGetStarted}
                  className="mt-auto bg-purple-700 hover:bg-purple-800 text-white h-12 w-full rounded-xl text-base font-semibold shadow-md"
                  data-testid={`membership-cta-${plan.id}`}
                >
                  Get started
                </Button>
              ) : (
                <div className="mt-auto flex flex-col gap-2 sm:flex-row">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onGetStarted}
                    className="h-12 w-full rounded-xl border-2 border-slate-200 font-semibold text-slate-800 hover:border-purple-300 hover:bg-purple-50"
                    data-testid={`membership-cta-${plan.id}`}
                  >
                    {plan.id === 'free' ? 'Start free' : 'Choose plan'}
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
