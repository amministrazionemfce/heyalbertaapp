import express from "express";
import mongoose from "mongoose";
import { requireAuth } from "../middleware/auth.js";
import Vendor from "../models/Vendor.js";
import { findReviewsForVendorSorted, serializeReviewForApi } from "../utils/reviewVendorQuery.js";

const router = express.Router();

const WEEK_DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

function normalizeTags(raw) {
  if (Array.isArray(raw)) {
    return [...new Set(raw.map((t) => String(t).trim()).filter(Boolean))].slice(0, 30);
  }
  if (typeof raw === "string") {
    return [...new Set(raw.split(/[,;]+/).map((s) => s.trim()).filter(Boolean))].slice(0, 30);
  }
  return [];
}

function normalizeOpeningHours(raw) {
  if (!raw || typeof raw !== "object") return {};
  const out = {};
  for (const d of WEEK_DAYS) {
    const v = raw[d];
    if (v == null) continue;
    const s = String(v).trim();
    if (!s) continue;
    out[d] = s.slice(0, 120);
  }
  return out;
}

function isValidObjectId(id) {
  return id && typeof id === "string" && id !== "undefined" && mongoose.Types.ObjectId.isValid(id);
}

router.get("/", async (req, res) => {
  const { featured, limit, page, category, city, tier, verified, q, sort } = req.query;

  const query = { status: "approved" };
  if (featured === "true" || featured === true) query.featured = true;
  if (category) query.category = String(category).trim();
  if (city) query.city = new RegExp(`^${String(city).trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i");
  if (tier) query.tier = String(tier).trim();
  if (verified === "true" || verified === true) query.verified = true;
  if (q) {
    const search = String(q).trim();
    if (search) {
      const rx = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      query.$or = [
        { name: rx },
        { description: rx },
        { neighborhood: rx },
        { city: rx },
      ];
    }
  }

  const sortMap = {
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    name_asc: { name: 1 },
    name_desc: { name: -1 },
  };
  const sortBy = sortMap[String(sort || "newest")] || sortMap.newest;

  const hasLimit = limit !== undefined && limit !== null && String(limit).trim() !== "";
  const perPage = hasLimit ? Math.min(Math.max(parseInt(limit, 10) || 0, 1), 200) : null;
  const pageNum = hasLimit && page ? Math.max(parseInt(page, 10) || 1, 1) : 1;

  const pipeline = [
    { $match: query },
    { $sort: sortBy },
    ...(hasLimit && pageNum > 1 ? [{ $skip: (pageNum - 1) * perPage }] : []),
    ...(hasLimit ? [{ $limit: perPage }] : []),
    {
      $lookup: {
        from: "reviews",
        let: { vid: { $toString: "$_id" } },
        pipeline: [
          {
            $match: {
              $or: [
                {
                  $expr: {
                    $eq: [{ $toString: { $ifNull: ["$vendorId", ""] } }, "$$vid"],
                  },
                },
                { $expr: { $eq: ["$vendorId", "$$vid"] } },
              ],
            },
          },
        ],
        as: "reviews",
      },
    },
    {
      $addFields: {
        review_count: { $size: "$reviews" },
        avg_rating: {
          $cond: [
            { $gt: [{ $size: "$reviews" }, 0] },
            { $round: [{ $avg: "$reviews.rating" }, 1] },
            0
          ]
        }
      }
    },
    {
      $project: {
        _id: 0,
        id: { $toString: "$_id" },
        userId: 1,
        name: 1,
        description: 1,
        category: 1,
        city: 1,
        neighborhood: 1,
        phone: 1,
        email: 1,
        website: 1,
        images: 1,
        coverImageIndex: 1,
        tier: 1,
        videoUrl: 1,
        googleMapUrl: 1,
        latitude: 1,
        longitude: 1,
        verified: 1,
        featured: 1,
        status: 1,
        createdAt: 1,
        tags: 1,
        openingHours: 1,
        avg_rating: 1,
        review_count: 1
      }
    }
  ];

  const vendors = await Vendor.aggregate(pipeline);
  res.json(vendors);
});

router.get("/count", async (req, res) => {
  const count = await Vendor.countDocuments({ status: "approved" });
  res.json({ count });
});

router.get("/:id", async (req, res) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) {
    return res.status(404).json({ message: "Vendor not found" });
  }
  const vendor = await Vendor.findById(id);
  if (!vendor) {
    return res.status(404).json({ message: "Vendor not found" });
  }
  const canonicalVendorId = vendor._id.toString();
  const reviewRows = await findReviewsForVendorSorted(canonicalVendorId);
  const reviews = reviewRows.map(serializeReviewForApi);
  const vendorObj = vendor.toJSON ? vendor.toJSON() : vendor;
  const avgRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length
      : 0;
  const payload = {
    ...vendorObj,
    user_id: vendor.userId,
    avg_rating: Math.round(avgRating * 10) / 10,
    review_count: reviews.length,
    reviews,
  };
  res.json(payload);
});

function normalizeName(name) {
  return (name || "").trim().toLowerCase();
}

async function isDuplicateName(name, excludeVendorId = null) {
  const n = normalizeName(name);
  if (!n) return false;
  const query = { name: new RegExp(`^${n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") };
  if (excludeVendorId) query._id = { $ne: excludeVendorId };
  const existing = await Vendor.findOne(query);
  return !!existing;
}

router.post("/", requireAuth, async (req, res) => {
  const name = (req.body.name || "").trim();
  if (name && (await isDuplicateName(name))) {
    return res.status(400).json({ message: "The business name already exists, please rename it." });
  }
  const images = Array.isArray(req.body.images) ? req.body.images.filter(Boolean) : [];
  const coverImageIndex = Math.min(
    Math.max(0, Number(req.body.coverImageIndex) || 0),
    Math.max(0, images.length - 1)
  );
  const latitude =
    req.body.latitude === "" || req.body.latitude === undefined || req.body.latitude === null
      ? undefined
      : Number(req.body.latitude);
  const longitude =
    req.body.longitude === "" || req.body.longitude === undefined || req.body.longitude === null
      ? undefined
      : Number(req.body.longitude);

  const tags = normalizeTags(req.body.tags);
  const openingHours = normalizeOpeningHours(req.body.openingHours);

  const vendor = await Vendor.create({
    ...req.body,
    images,
    coverImageIndex,
    latitude: Number.isFinite(latitude) ? latitude : undefined,
    longitude: Number.isFinite(longitude) ? longitude : undefined,
    tags,
    openingHours,
    userId: req.user._id.toString(),
    status: "pending",
    createdAt: new Date().toISOString()
  });
  res.json(vendor);
});

router.put("/:id", requireAuth, async (req, res) => {
  const { id } = req.params;
  const vendor = await Vendor.findById(id);
  if (!vendor) return res.status(404).json({ message: "Vendor not found" });
  if (vendor.userId !== req.user._id.toString()) {
    return res.status(403).json({ message: "Not authorized to update this vendor" });
  }
  const name = (req.body.name || "").trim();
  if (name && (await isDuplicateName(name, id))) {
    return res.status(400).json({ message: "The business name already exists, please rename it." });
  }
  const allowed = [
    "name",
    "description",
    "category",
    "city",
    "neighborhood",
    "phone",
    "email",
    "website",
    "images",
    "coverImageIndex",
    "tier",
    "videoUrl",
    "googleMapUrl",
    "latitude",
    "longitude",
    "tags",
    "openingHours",
  ];
  const payload = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) payload[key] = req.body[key];
  }
  if (payload.tags !== undefined) payload.tags = normalizeTags(payload.tags);
  if (payload.openingHours !== undefined) payload.openingHours = normalizeOpeningHours(payload.openingHours);
  if (payload.images !== undefined) {
    payload.images = Array.isArray(payload.images) ? payload.images.filter(Boolean) : [];
    const requestedCover = Number(payload.coverImageIndex ?? vendor.coverImageIndex ?? 0) || 0;
    payload.coverImageIndex = Math.min(
      Math.max(0, requestedCover),
      Math.max(0, payload.images.length - 1)
    );
  } else if (payload.coverImageIndex !== undefined) {
    const imageCount = Array.isArray(vendor.images) ? vendor.images.length : 0;
    payload.coverImageIndex = Math.min(
      Math.max(0, Number(payload.coverImageIndex) || 0),
      Math.max(0, imageCount - 1)
    );
  }
  if (payload.latitude !== undefined) {
    const parsed = payload.latitude === "" ? undefined : Number(payload.latitude);
    payload.latitude = Number.isFinite(parsed) ? parsed : undefined;
  }
  if (payload.longitude !== undefined) {
    const parsed = payload.longitude === "" ? undefined : Number(payload.longitude);
    payload.longitude = Number.isFinite(parsed) ? parsed : undefined;
  }
  const updated = await Vendor.findByIdAndUpdate(id, payload, { new: true, runValidators: false });
  res.json(updated);
});

router.delete("/:id", requireAuth, async (req, res) => {
  const vendor = await Vendor.findById(req.params.id);
  if (!vendor) return res.status(404).json({ message: "Vendor not found" });
  if (vendor.userId !== req.user._id.toString()) {
    return res.status(403).json({ message: "Forbidden" });
  }
  await Vendor.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

export default router;