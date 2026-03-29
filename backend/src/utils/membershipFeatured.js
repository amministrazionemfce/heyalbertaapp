import Vendor from "../models/Vendor.js";
import Listing from "../models/Listing.js";

/**
 * When a user has a paid membership (standard / gold), feature their vendor(s)
 * and every listing tied to those vendors.
 */
export async function setFeaturedForPaidUser(userId) {
  const uid = String(userId || "");
  if (!uid) return;
  const vendors = await Vendor.find({ userId: uid }).select("_id");
  const vendorIds = vendors.map((v) => v._id.toString());
  await Vendor.updateMany({ userId: uid }, { $set: { featured: true } });
  if (vendorIds.length > 0) {
    await Listing.updateMany({ vendorId: { $in: vendorIds } }, { $set: { featured: true } });
  }
}

/**
 * When membership returns to free, remove featured flags for that user's vendors and listings.
 */
export async function clearFeaturedForFreeUser(userId) {
  const uid = String(userId || "");
  if (!uid) return;
  const vendors = await Vendor.find({ userId: uid }).select("_id");
  const vendorIds = vendors.map((v) => v._id.toString());
  await Vendor.updateMany({ userId: uid }, { $set: { featured: false } });
  if (vendorIds.length > 0) {
    await Listing.updateMany({ vendorId: { $in: vendorIds } }, { $set: { featured: false } });
  }
}
