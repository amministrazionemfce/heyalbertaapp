/** Keep limits in sync with `frontend/src/lib/listingTierRules.js`. */

export const FREE_LISTING_DESCRIPTION_MAX_WORDS = 75;

export function normalizedVendorPlanTier(tier) {
  const r = String(tier || "").trim().toLowerCase();
  if (r === "premium" || r === "gold" || r === "platinum" || r === "enterprise") return "premium";
  if (r === "standard") return "standard";
  return "free";
}

/** Max listings per user for this plan; null = unlimited (aligned with `listingPlanTierCapabilities`). */
export function maxListingsForPlanTier(vendorTier) {
  return normalizedVendorPlanTier(vendorTier) === "free" ? 1 : null;
}

export function countWords(s) {
  return String(s || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

export function descriptionHasBlockedContactPatterns(text) {
  const t = String(text || "");
  if (/\bhttps?:\/\//i.test(t)) return true;
  if (/\bwww\./i.test(t)) return true;
  if (/\S+@\S+\.\S+/.test(t)) return true;
  return false;
}

/**
 * @returns {{ ok: true } | { ok: false, message: string }}
 */
export function validateListingForVendorTier(vendorTier, { description, images, videoUrl }) {
  const plan = normalizedVendorPlanTier(vendorTier);
  const imgs = Array.isArray(images) ? images : [];
  const vid = String(videoUrl || "").trim();
  const desc = String(description || "").trim();

  if (plan === "free") {
    if (imgs.length > 1) {
      return { ok: false, message: "Free plan allows only one image per listing." };
    }
    if (vid) {
      return { ok: false, message: "Video is not available on the Free plan." };
    }
    if (countWords(desc) > FREE_LISTING_DESCRIPTION_MAX_WORDS) {
      return {
        ok: false,
        message: `Description is limited to ${FREE_LISTING_DESCRIPTION_MAX_WORDS} words on the Free plan.`,
      };
    }
    if (descriptionHasBlockedContactPatterns(desc)) {
      return {
        ok: false,
        message:
          "URLs and email addresses are not allowed in your listing description on the Free plan.",
      };
    }
  }
  return { ok: true };
}

export function vendorMaySetPublicContactFields(vendorTier) {
  return normalizedVendorPlanTier(vendorTier) !== "free";
}

export function vendorMayReplyToReviews(vendorTier) {
  return normalizedVendorPlanTier(vendorTier) !== "free";
}
