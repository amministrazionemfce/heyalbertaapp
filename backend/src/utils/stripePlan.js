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
