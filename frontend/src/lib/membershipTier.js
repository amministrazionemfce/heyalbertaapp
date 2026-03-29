/**
 * Derive membership UI plan id (`free` | `standard` | `premium`) from vendor records.
 * Vendor.tier is set by Stripe webhook / sync-subscription.
 */
export function membershipPlanTierFromVendors(vendors) {
  if (!Array.isArray(vendors) || vendors.length === 0) return 'free';

  let bestRank = 0;
  let bestTier = 'free';

  for (const v of vendors) {
    const raw = String(v?.tier || '')
      .trim()
      .toLowerCase();
    let rank = 0;
    let normalized = 'free';
    if (raw === 'premium' || raw === 'gold') {
      rank = 2;
      normalized = 'premium';
    } else if (raw === 'standard') {
      rank = 1;
      normalized = 'standard';
    }
    if (rank > bestRank) {
      bestRank = rank;
      bestTier = normalized;
    }
  }

  return bestTier;
}
