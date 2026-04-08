/**
 * Map Stripe Price IDs (from env) to app plan ids used by Vendor.tier and the membership UI.
 */
export function planIdFromPriceId(priceId) {
  const p = String(priceId || "").trim();
  if (!p) return null;
  const env = (k) => String(process.env[k] || "").trim();
  if (p === env("STRIPE_STANDARD_MONTHLY_PRICE_ID")) return "standard";
  if (p === env("STRIPE_STANDARD_YEARLY_PRICE_ID")) return "standard";
  if (p === env("STRIPE_GOLD_MONTHLY_PRICE_ID")) return "premium";
  if (p === env("STRIPE_GOLD_YEARLY_PRICE_ID")) return "premium";
  return null;
}

/**
 * Prefer current line-item price over subscription.metadata.planId (metadata often stale after portal/plan changes).
 */
export function planIdFromStripeSubscription(sub) {
  const priceId = sub?.items?.data?.[0]?.price?.id;
  const fromPrice = planIdFromPriceId(priceId);
  if (fromPrice === "standard" || fromPrice === "premium") return fromPrice;
  const meta = String(sub?.metadata?.planId || "").trim();
  if (meta === "standard" || meta === "premium") return meta;
  return null;
}

/** Highest tier among active/trialing subscriptions (by resolved plan id). */
export function bestPaidPlanFromSubscriptions(subscriptions) {
  let best = "free";
  for (const sub of subscriptions) {
    const st = sub.status;
    if (st !== "active" && st !== "trialing") continue;
    const planId = planIdFromStripeSubscription(sub);
    if (planId === "premium") best = "premium";
    else if (planId === "standard" && best !== "premium") best = "standard";
  }
  return best;
}
