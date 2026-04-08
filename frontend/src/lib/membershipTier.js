function promoStandardActive(user) {
  const exp = user?.promoStandardExpiresAt;
  if (!exp) return false;
  const t = new Date(exp);
  return Number.isFinite(t.getTime()) && t > new Date();
}

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
 * Effective plan for vendor UI and membership cards.
 * When Stripe billing says standard or premium, that wins — listing `tier` can lag or drift
 * (e.g. still `premium` after subscribing to Standard), which wrongly showed “Gold”.
 * If billing is free/unset, use the best tier from listings (e.g. legacy or comped listings).
 */
export function membershipPlanTierFromUserAndListings(user, listings) {
  const { rank: rankUser, normalized: userTier } = bestTierFromTierString(user?.billingTier);
  if (rankUser > 0) {
    return userTier;
  }
  if (promoStandardActive(user)) {
    return 'standard';
  }
  return membershipPlanTierFromListings(listings);
}

/** @deprecated Use membershipPlanTierFromListings */
export function membershipPlanTierFromVendors(vendors) {
  return membershipPlanTierFromListings(vendors);
}
