function bestTierFromTierString(rawIn) {
  const raw = String(rawIn || '')
    .trim()
    .toLowerCase();
  let rank = 0;
  let normalized = 'free';
  if (raw === 'premium' || raw === 'gold' || raw === 'platinum' || raw === 'enterprise') {
    rank = 2;
    normalized = 'premium';
  } else if (raw === 'standard') {
    rank = 1;
    normalized = 'standard';
  }
  return { rank, normalized };
}

/**
 * Derive membership UI plan from listing records (tier is set by Stripe webhook / sync-subscription).
 */
export function membershipPlanTierFromListings(listings) {
  if (!Array.isArray(listings) || listings.length === 0) return 'free';

  let bestRank = 0;
  let bestTier = 'free';

  for (const l of listings) {
    const { rank, normalized } = bestTierFromTierString(l?.tier);
    if (rank > bestRank) {
      bestRank = rank;
      bestTier = normalized;
    }
  }

  return bestTier;
}

/**
 * Effective plan for UI: max of account billing tier (Stripe) and any listing tiers.
 * Fixes “subscribed but still Free” when the user has zero listings yet.
 */
export function membershipPlanTierFromUserAndListings(user, listings) {
  const fromListings = membershipPlanTierFromListings(listings);
  const { rank: rankUser, normalized: userTier } = bestTierFromTierString(user?.billingTier);
  const { rank: rankList } = bestTierFromTierString(fromListings);
  return rankUser > rankList ? userTier : fromListings;
}

/** @deprecated Use membershipPlanTierFromListings */
export function membershipPlanTierFromVendors(vendors) {
  return membershipPlanTierFromListings(vendors);
}
