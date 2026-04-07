import { Link } from 'react-router-dom';
import { Check, X } from 'lucide-react';
import { Button } from './ui/button';
import { MEMBERSHIP_PLANS_URL } from '../constants';
import { getMembershipEntitlementsCopy } from '../lib/listingTierRules';

/**
 * Vendor dashboard: what's included / not included for the current listing plan.
 */
export default function MembershipTierEntitlementsCard({ planTier }) {
  const copy = getMembershipEntitlementsCopy(planTier);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      <h3 className="font-heading font-semibold text-slate-900 mb-3">{copy.headline}</h3>
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Included</p>
      <ul className="space-y-2 text-sm text-slate-600 mb-4">
        {copy.included.map((line) => (
          <li key={line} className="flex items-start gap-2">
            <Check className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" aria-hidden />
            <span>{line}</span>
          </li>
        ))}
      </ul>
      {copy.notIncluded.length > 0 ? (
        <>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Not included</p>
          <ul className="space-y-2 text-sm text-slate-600">
            {copy.notIncluded.map((line) => (
              <li key={line} className="flex items-start gap-2">
                <X className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" aria-hidden />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </div>
  );
}

export function MembershipUpgradeCard({ planTier }) {
  if (planTier === 'premium') return null;

  const nextLabel = planTier === 'free' ? 'Standard or Gold' : 'Gold';

  return (
    <div className="bg-gradient-to-br from-amber-50 to-secondary-50 rounded-xl border border-amber-200/60 p-5 shadow-sm">
      <h3 className="font-heading font-semibold text-slate-900 mb-3">Upgrade</h3>
      <p className="text-sm text-slate-700 mb-4">
        Unlock more visibility, media, contact options, and review tools on {nextLabel}.
      </p>
      <Button asChild className="w-full bg-amber-500 hover:bg-amber-600 text-white text-sm">
        <Link to={MEMBERSHIP_PLANS_URL}>View plans</Link>
      </Button>
    </div>
  );
}
