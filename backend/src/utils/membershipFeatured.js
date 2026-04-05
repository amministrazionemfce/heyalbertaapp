import Listing from "../models/Listing.js";
import User from "../models/User.js";

/**
 * Ensure every listing owned by a premium subscriber uses the premium tier and is featured (fixes drift / legacy data).
 */
export async function syncUserListingTiersFromBilling(userId) {
  const uid = String(userId || "");
  if (!uid) return;
  const u = await User.findById(uid).select("billingTier").lean();
  if (!u || u.billingTier !== "premium") return;
  await Listing.updateMany({ userId: uid }, { $set: { tier: "premium", featured: true } });
}

/** New listings for paid plans should match webhook `setFeaturedForPaidUser` behavior. */
export function listingsFeaturedForBillingTier(billingTier) {
  const t = String(billingTier || "").toLowerCase();
  return t === "standard" || t === "premium";
}

/**
 * When a user has a paid membership (standard / gold), feature their listings.
 */
export async function setFeaturedForPaidUser(userId) {
  const uid = String(userId || "");
  if (!uid) return;
  await Listing.updateMany({ userId: uid }, { $set: { featured: true } });
}

/**
 * When membership returns to free, remove featured flags for that user's listings.
 */
export async function clearFeaturedForFreeUser(userId) {
  const uid = String(userId || "");
  if (!uid) return;
  await Listing.updateMany({ userId: uid }, { $set: { featured: false } });
}
