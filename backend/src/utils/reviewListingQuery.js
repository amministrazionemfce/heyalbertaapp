import Review from "../models/Review.js";

export function matchReviewsByListingId(listingHexId) {
  const lid = String(listingHexId ?? "").trim();
  return {
    $or: [
      { listingId: lid },
      {
        $expr: {
          $eq: [{ $toString: { $ifNull: ["$listingId", ""] } }, lid],
        },
      },
    ],
  };
}

export function matchReviewByListingAndUser(listingHexId, userHexId) {
  const lid = String(listingHexId ?? "").trim();
  const uid = String(userHexId ?? "").trim();
  return {
    $expr: {
      $and: [
        { $eq: [{ $toString: { $ifNull: ["$listingId", ""] } }, lid] },
        { $eq: [{ $toString: { $ifNull: ["$userId", ""] } }, uid] },
      ],
    },
  };
}

export function matchExistingReviewForUser(listingHexId, userHexId) {
  const lid = String(listingHexId ?? "").trim();
  const uid = String(userHexId ?? "").trim();
  return {
    $or: [{ listingId: lid, userId: uid }, matchReviewByListingAndUser(lid, uid)],
  };
}

export async function findReviewsForListingSorted(listingHexId) {
  const lid = String(listingHexId ?? "").trim();
  if (!lid) return [];
  return Review.aggregate([
    { $match: matchReviewsByListingId(lid) },
    { $sort: { createdAt: -1 } },
  ]);
}

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
