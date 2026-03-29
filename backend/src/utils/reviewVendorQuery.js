import Review from "../models/Review.js";

/**
 * Review.vendorId is stored as a string (vendor _id hex). Some legacy docs may
 * hold ObjectId; Mongo $lookup with localField _id + foreignField vendorId
 * never matches. Use $expr + $toString for lookups and for Mongoose find().
 *
 * Always combine a plain { vendorId } branch with $expr: some drivers / data
 * shapes match one path but not the other — using both avoids "0 reviews" while
 * POST still hits duplicate key / "already reviewed".
 */
export function matchReviewsByVendorId(vendorHexId) {
  const vid = String(vendorHexId ?? "").trim();
  return {
    $or: [
      { vendorId: vid },
      {
        $expr: {
          $eq: [{ $toString: { $ifNull: ["$vendorId", ""] } }, vid],
        },
      },
    ],
  };
}

export function matchReviewByVendorAndUser(vendorHexId, userHexId) {
  const vid = String(vendorHexId ?? "").trim();
  const uid = String(userHexId ?? "").trim();
  return {
    $expr: {
      $and: [
        { $eq: [{ $toString: { $ifNull: ["$vendorId", ""] } }, vid] },
        { $eq: [{ $toString: { $ifNull: ["$userId", ""] } }, uid] },
      ],
    },
  };
}

/** One review per user per vendor: string match OR normalized $expr (legacy-safe). */
export function matchExistingReviewForUser(vendorHexId, userHexId) {
  const vid = String(vendorHexId ?? "").trim();
  const uid = String(userHexId ?? "").trim();
  return {
    $or: [{ vendorId: vid, userId: uid }, matchReviewByVendorAndUser(vid, uid)],
  };
}

/**
 * Load reviews via aggregation (more reliable than Mongoose find() with $or + $expr).
 */
export async function findReviewsForVendorSorted(vendorHexId) {
  const vid = String(vendorHexId ?? "").trim();
  if (!vid) return [];
  return Review.aggregate([
    { $match: matchReviewsByVendorId(vid) },
    { $sort: { createdAt: -1 } },
  ]);
}

/** Consistent JSON shape for vendor detail + 409 existingReview payload. */
export function serializeReviewForApi(r) {
  if (!r) return null;
  const o = typeof r.toJSON === "function" ? r.toJSON() : r;
  const rawId = o.id ?? o._id;
  const id = rawId != null ? String(rawId) : "";
  return {
    id,
    userId: o.userId != null ? String(o.userId) : undefined,
    userName: o.userName,
    user_name: o.userName,
    rating: o.rating,
    comment: o.comment,
    reply: o.reply ?? null,
    createdAt: o.createdAt,
    created_at: o.createdAt,
  };
}
