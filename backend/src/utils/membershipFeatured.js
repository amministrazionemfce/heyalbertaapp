import Listing from "../models/Listing.js";
import User from "../models/User.js";
import { promoStandardIsActive } from "./promotionTier.js";

/**
 * Stripe says “free” but user has an active promotion → keep Standard listings.
 */
export async function applyFreeStripeTierToUser(userId) {
  const uid = String(userId || "");
  if (!uid) return;
  const u = await User.findById(uid).select("promoStandardExpiresAt").lean();
  const promoActive = promoStandardIsActive(u?.promoStandardExpiresAt);
  await User.updateOne({ _id: uid }, { $set: { billingTier: "free" } });
  if (promoActive) {
    await Listing.updateMany({ userId: uid }, { $set: { tier: "standard", featured: true } });
  } else {
    await Listing.updateMany({ userId: uid }, { $set: { tier: "free" } });
    await clearFeaturedForFreeUser(uid);
  }
}

/**
 * Remove expired promo flag and realign listings with Stripe billing only.
 */
export async function expirePromoIfNeeded(userId) {
  const uid = String(userId || "");
  if (!uid) return;
  const u = await User.findById(uid).select("promoStandardExpiresAt billingTier").lean();
  if (!u?.promoStandardExpiresAt) return;
  if (promoStandardIsActive(u.promoStandardExpiresAt)) return;
  await User.updateOne({ _id: uid }, { $unset: { promoStandardExpiresAt: 1 } });
  const b = String(u.billingTier || "free").toLowerCase();
  if (b === "premium") {
    await Listing.updateMany({ userId: uid }, { $set: { tier: "premium", featured: true } });
  } else if (b === "standard") {
    await Listing.updateMany({ userId: uid }, { $set: { tier: "standard", featured: true } });
  } else {
    await Listing.updateMany({ userId: uid }, { $set: { tier: "free" } });
    await clearFeaturedForFreeUser(uid);
  }
}

/**
 * Align listing `tier` and `featured` with account `billingTier` for paid plans (fixes drift / legacy data).
 * Also applies active promotion (Standard) when billing is free.
 */
export async function syncUserListingTiersFromBilling(userId) {
  const uid = String(userId || "");
  if (!uid) return;
  const u = await User.findById(uid).select("billingTier promoStandardExpiresAt").lean();
  if (!u) return;
  const t = String(u.billingTier || "").toLowerCase();
  if (t === "premium") {
    await Listing.updateMany({ userId: uid }, { $set: { tier: "premium", featured: true } });
  } else if (t === "standard") {
    await Listing.updateMany({ userId: uid }, { $set: { tier: "standard", featured: true } });
  } else if (promoStandardIsActive(u.promoStandardExpiresAt)) {
    await Listing.updateMany({ userId: uid }, { $set: { tier: "standard", featured: true } });
  }
}

/** New listings for paid plans should match webhook `setFeaturedForPaidUser` behavior. */
export function listingsFeaturedForBillingTier(billingTier) {
  const t = String(billingTier || "").toLowerCase();
  return t === "standard" || t === "premium";
}

/** Paid Standard/Gold or active promo Standard. */
export function listingsFeaturedForUserPlan(userDoc) {
  if (listingsFeaturedForBillingTier(userDoc?.billingTier)) return true;
  return promoStandardIsActive(userDoc?.promoStandardExpiresAt);
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
