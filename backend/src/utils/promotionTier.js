/**
 * Promotion-based Standard access (parallel to Stripe billingTier).
 */

export function promoStandardIsActive(promoStandardExpiresAt) {
  if (!promoStandardExpiresAt) return false;
  const t = promoStandardExpiresAt instanceof Date ? promoStandardExpiresAt : new Date(promoStandardExpiresAt);
  return Number.isFinite(t.getTime()) && t > new Date();
}

export function tierRankForCaps(raw) {
  const t = String(raw || "").toLowerCase();
  if (t === "premium" || t === "gold") return 2;
  if (t === "standard") return 1;
  return 0;
}

export function tierStringFromRank(r) {
  if (r >= 2) return "premium";
  if (r >= 1) return "standard";
  return "free";
}

/** Stripe / DB billing tier + active promo → max rank (promo counts as standard). */
export function effectiveMembershipRank(billingTier, promoStandardExpiresAt) {
  const rBill = tierRankForCaps(billingTier);
  const rPromo = promoStandardIsActive(promoStandardExpiresAt) ? 1 : 0;
  return Math.max(rBill, rPromo);
}

export function effectiveMembershipTier(billingTier, promoStandardExpiresAt) {
  return tierStringFromRank(effectiveMembershipRank(billingTier, promoStandardExpiresAt));
}
