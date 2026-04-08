import express from "express";
import mongoose from "mongoose";
import { requireAuth, optionalAuth } from "../middleware/auth.js";
import Listing from "../models/Listing.js";
import User from "../models/User.js";
import Review from "../models/Review.js";
import CityImage from "../models/CityImage.js";
import CategoryImage from "../models/CategoryImage.js";
import {
  validateListingForVendorTier,
  vendorMaySetPublicContactFields,
  maxListingsForPlanTier,
} from "../utils/listingTierCaps.js";
import { matchReviewsByListingId } from "../utils/reviewListingQuery.js";
import { listingsFeaturedForUserPlan } from "../utils/membershipFeatured.js";

const router = express.Router();

/** Published listings visible on the public directory (not drafts). */
const DIRECTORY_PUBLIC_BASE = {
  status: "published",
  $or: [{ sellerStatus: "approved" }, { featured: true, sellerStatus: "pending" }],
};

const WEEK_DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

function escapeRegex(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Express / qs may return a string or duplicate-key array. */
function firstQueryString(val) {
  if (val == null) return "";
  const s = Array.isArray(val) ? val[0] : val;
  return String(s).trim().toLowerCase();
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

async function findListingByTitleCaseInsensitive(title, excludeId) {
  const tit = String(title || "").trim();
  if (!tit) return null;
  const filter = { title: new RegExp(`^${escapeRegex(tit)}$`, "i") };
  if (excludeId && mongoose.Types.ObjectId.isValid(String(excludeId))) {
    filter._id = { $ne: new mongoose.Types.ObjectId(String(excludeId)) };
  }
  return Listing.findOne(filter).select("_id title").lean();
}

function normalizeListingImages(body) {
  const raw = body.images;
  if (!Array.isArray(raw)) return [];
  return raw.map((x) => (x != null ? String(x).trim() : "")).filter(Boolean);
}

function normalizeCoverIndex(coverImageIndex, imageCount) {
  const n = Number(coverImageIndex);
  const idx = Number.isFinite(n) ? Math.floor(n) : 0;
  if (imageCount <= 0) return 0;
  return Math.min(Math.max(0, idx), imageCount - 1);
}

async function resolveSellerStatusForCreate() {
  return "approved";
}

function tierRankForDefault(raw) {
  const t = String(raw || "").toLowerCase();
  if (t === "premium" || t === "gold") return 2;
  if (t === "standard") return 1;
  return 0;
}

function effectiveBillingWithPromo(userDoc) {
  const b = String(userDoc?.billingTier || "free").toLowerCase();
  if (b === "premium") return "premium";
  if (b === "standard") return "standard";
  const exp = userDoc?.promoStandardExpiresAt;
  if (exp && new Date(exp) > new Date()) return "standard";
  return "free";
}

async function defaultTierForUser(userId) {
  const uid = String(userId);
  const [first, userDoc] = await Promise.all([
    Listing.findOne({ userId: uid }).sort({ createdAt: 1 }).lean(),
    User.findById(uid).select("billingTier promoStandardExpiresAt").lean(),
  ]);
  const rList = tierRankForDefault(first?.tier || "free");
  const rBill = tierRankForDefault(effectiveBillingWithPromo(userDoc));
  const r = Math.max(rList, rBill);
  if (r >= 2) return "premium";
  if (r >= 1) return "standard";
  return "free";
}

/** Public JSON snapshot for cards / detail (not a separate collection). */
function buildSellerShapeFromListing(listing) {
  const o = typeof listing.toObject === "function" ? listing.toObject() : listing;
  const uid = String(o.userId || "");
  const business = String(o.businessName || "").trim();
  const displayName = business || o.title;
  return {
    userId: uid,
    /** @deprecated use userId — kept for older clients */
    id: uid,
    title: o.title,
    businessName: business,
    name: displayName,
    description: o.description,
    city: o.city,
    neighborhood: o.neighborhood,
    phone: o.phone,
    email: o.email,
    website: o.website,
    images: Array.isArray(o.images) ? o.images : [],
    tier: o.tier,
    googleMapUrl: o.googleMapUrl,
    latitude: o.latitude,
    longitude: o.longitude,
    openingHours: o.openingHours || {},
  };
}

router.get("/", optionalAuth, async (req, res) => {
  try {
    const categoryId = (req.query.categoryId || req.query.category || "").trim();
    const userIdParam = (req.query.userId || "").trim();
    const city = (req.query.city || "").trim();
    const search = (req.query.search || "").trim();
    const featuredOnly = req.query.featured === "true" || req.query.featured === true;
    const myLikings = req.query.myLikings === "true" || req.query.myLikings === true;
    const favoriteIdsParam = (req.query.favoriteIds || "").trim();
    const myListings = req.query.myListings === "true" || req.query.myListings === true;
    const minPriceQ = parseFloat(req.query.minPrice);
    const maxPriceQ = parseFloat(req.query.maxPrice);
    const hasMinPrice = Number.isFinite(minPriceQ);
    const hasMaxPrice = Number.isFinite(maxPriceQ);
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;
    const reviewSortRaw =
      firstQueryString(req.query.reviewSort) ||
      firstQueryString(req.query.review_sort) ||
      firstQueryString(req.get("x-directory-review-sort"));

    const reviewsCollName = Review.collection?.collectionName || "reviews";

    let matchListing;

    if (myListings) {
      if (!req.user) {
        return res.status(401).json({ message: "Sign in to see your listings" });
      }
      matchListing = { status: "published", userId: req.user._id.toString() };
      if (categoryId) matchListing.categoryId = categoryId;
      if (featuredOnly) matchListing.featured = true;
    } else {
      matchListing = { ...DIRECTORY_PUBLIC_BASE };
      if (categoryId) matchListing.categoryId = categoryId;
      if (featuredOnly) matchListing.featured = true;

      if (myLikings) {
        const ids = favoriteIdsParam
          ? favoriteIdsParam.split(",").map((s) => s.trim()).filter(Boolean)
          : [];
        if (ids.length === 0) {
          return res.json({ listings: [], total: 0, pages: 1, page });
        }
        const objectIds = ids
          .filter((id) => mongoose.Types.ObjectId.isValid(id))
          .map((id) => new mongoose.Types.ObjectId(id));
        if (objectIds.length === 0) {
          return res.json({ listings: [], total: 0, pages: 1, page });
        }
        matchListing._id = { $in: objectIds };
      } else if (userIdParam) {
        matchListing.userId = userIdParam;
      }
    }

    const pipeline = [
      { $match: matchListing },
      {
        $lookup: {
          from: reviewsCollName,
          let: { lid: { $toString: "$_id" } },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: [{ $toString: { $ifNull: ["$listingId", ""] } }, "$$lid"],
                },
              },
            },
          ],
          as: "_reviewDocs",
        },
      },
      {
        $addFields: {
          /** Prefer live review rows; merge with stored `reviewCount` on the listing doc (Compass / denormalized). */
          reviewCount: {
            $let: {
              vars: {
                stored: {
                  $convert: {
                    input: { $ifNull: ["$reviewCount", 0] },
                    to: "long",
                    onError: 0,
                    onNull: 0,
                  },
                },
                live: { $size: { $ifNull: ["$_reviewDocs", []] } },
              },
              in: { $max: ["$$stored", "$$live"] },
            },
          },
          avgRating: {
            $cond: [
              { $gt: [{ $size: { $ifNull: ["$_reviewDocs", []] } }, 0] },
              {
                $round: [
                  {
                    $avg: {
                      $map: {
                        input: "$_reviewDocs",
                        as: "r",
                        in: "$$r.rating",
                      },
                    },
                  },
                  1,
                ],
              },
              null,
            ],
          },
          priceNumeric: {
            $let: {
              vars: {
                rf: {
                  $regexFind: {
                    input: { $ifNull: ["$price", ""] },
                    regex: "[0-9]+\\.?[0-9]*",
                  },
                },
              },
              in: {
                $convert: {
                  input: "$$rf.match",
                  to: "double",
                  onError: 0,
                  onNull: 0,
                },
              },
            },
          },
        },
      },
      { $project: { _reviewDocs: 0 } },
    ];

    if (city) pipeline.push({ $match: { city: new RegExp(escapeRegex(city), "i") } });
    if (search) {
      const searchRegex = new RegExp(escapeRegex(search), "i");
      pipeline.push({
        $match: {
          $or: [{ title: searchRegex }, { description: searchRegex }],
        },
      });
    }
    if (hasMinPrice) pipeline.push({ $match: { priceNumeric: { $gte: minPriceQ } } });
    if (hasMaxPrice) pipeline.push({ $match: { priceNumeric: { $lte: maxPriceQ } } });

    /** Default browse: tier first. Review-sorted browse: review count first, then tier tie-break. */
    const membershipRankAddFields = {
      $addFields: {
        _membershipRank: {
          $switch: {
            branches: [
              { case: { $eq: [{ $toLower: { $ifNull: ["$tier", ""] } }, "premium"] }, then: 5 },
              { case: { $eq: [{ $toLower: { $ifNull: ["$tier", ""] } }, "gold"] }, then: 4 },
              { case: { $eq: [{ $toLower: { $ifNull: ["$tier", ""] } }, "platinum"] }, then: 4 },
              { case: { $eq: [{ $toLower: { $ifNull: ["$tier", ""] } }, "enterprise"] }, then: 4 },
              { case: { $eq: [{ $toLower: { $ifNull: ["$tier", ""] } }, "standard"] }, then: 2 },
              { case: { $eq: [{ $toLower: { $ifNull: ["$tier", ""] } }, "free"] }, then: 1 },
            ],
            default: 1,
          },
        },
      },
    };

    const defaultSortStage = { $sort: { _membershipRank: -1, featured: -1, createdAt: -1 } };
    const mostReviewsSortStage = {
      $sort: {
        reviewCount: -1,
        _membershipRank: -1,
        featured: -1,
        createdAt: -1,
      },
    };
    const leastReviewsSortStage = {
      $sort: {
        reviewCount: 1,
        _membershipRank: -1,
        featured: -1,
        createdAt: -1,
      },
    };
    let sortStage = defaultSortStage;
    if (reviewSortRaw === "most") sortStage = mostReviewsSortStage;
    else if (reviewSortRaw === "least") sortStage = leastReviewsSortStage;

    pipeline.push(membershipRankAddFields, sortStage,
      {
        $facet: {
          total: [{ $count: "n" }],
          listings: [
            { $skip: skip },
            { $limit: limit },
            {
              $project: {
                id: { $toString: "$_id" },
                title: 1,
                description: 1,
                categoryId: 1,
                status: 1,
                sellerStatus: 1,
                userId: 1,
                featured: 1,
                features: { $ifNull: ["$features", []] },
                images: { $ifNull: ["$images", []] },
                coverImageIndex: { $ifNull: ["$coverImageIndex", 0] },
                videoUrl: { $ifNull: ["$videoUrl", ""] },
                price: { $ifNull: ["$price", ""] },
                businessName: { $ifNull: ["$businessName", ""] },
                reviewCount: 1,
                avgRating: 1,
                createdAt: 1,
                city: 1,
                neighborhood: 1,
                tier: 1,
                seller: {
                  userId: { $toString: { $ifNull: ["$userId", ""] } },
                  id: { $toString: { $ifNull: ["$userId", ""] } },
                  title: "$title",
                  businessName: { $ifNull: ["$businessName", ""] },
                  name: {
                    $let: {
                      vars: {
                        bn: { $trim: { input: { $ifNull: ["$businessName", ""] } } },
                      },
                      in: {
                        $cond: [{ $gt: [{ $strLenCP: "$$bn" }, 0] }, "$$bn", "$title"],
                      },
                    },
                  },
                  city: "$city",
                  neighborhood: "$neighborhood",
                  images: "$images",
                  description: "$description",
                },
              },
            },
          ],
        },
      }
    );

    const result = await Listing.aggregate(pipeline);
    const total = result[0]?.total[0]?.n ?? 0;
    const listings = result[0]?.listings ?? [];
    const pages = Math.ceil(total / limit) || 1;

    res.set("Cache-Control", "private, no-store, must-revalidate");
    res.json({ listings, total, pages, page });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch listings" });
  }
});

router.get("/city-images", async (req, res) => {
  try {
    const docs = await CityImage.find({}, { cityName: 1, imageUrl: 1 }).lean();
    const out = {};
    for (const d of docs) {
      if (d?.cityName) {
        out[String(d.cityName).toLowerCase()] = String(d.imageUrl || "").trim();
      }
    }
    res.json(out);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch city images" });
  }
});

router.get("/category-images", async (req, res) => {
  try {
    const docs = await CategoryImage.find({}, { categoryId: 1, imageUrl: 1 }).lean();
    const out = {};
    for (const d of docs) {
      if (d?.categoryId) out[d.categoryId] = d.imageUrl || "";
    }
    res.json(out);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch category images" });
  }
});

router.get("/counts-by-category", async (req, res) => {
  try {
    const counts = await Listing.aggregate([
      { $match: { ...DIRECTORY_PUBLIC_BASE } },
      { $group: { _id: "$categoryId", count: { $sum: 1 } } },
    ]);
    const byCategory = {};
    counts.forEach(({ _id, count }) => {
      byCategory[_id] = count;
    });
    res.json(byCategory);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch counts" });
  }
});

router.get("/counts-by-city", async (req, res) => {
  try {
    const counts = await Listing.aggregate([
      {
        $match: {
          ...DIRECTORY_PUBLIC_BASE,
          city: { $exists: true, $nin: [null, ""] },
        },
      },
      {
        $group: {
          _id: { $toLower: "$city" },
          count: { $sum: 1 },
        },
      },
    ]);
    const byCity = {};
    counts.forEach(({ _id, count }) => {
      if (_id) byCity[_id] = count;
    });
    res.json(byCity);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch city counts" });
  }
});

router.get("/my-listings", requireAuth, async (req, res) => {
  try {
    const listings = await Listing.find({ userId: req.user._id.toString() }).sort({ createdAt: -1 });
    res.json(listings);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch listings" });
  }
});

router.delete("/mine", requireAuth, async (req, res) => {
  try {
    const uid = req.user._id.toString();
    const listings = await Listing.find({ userId: uid }).select("_id");
    for (const l of listings) {
      await Review.deleteMany(matchReviewsByListingId(l._id.toString()));
    }
    await Listing.deleteMany({ userId: uid });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete listings" });
  }
});

router.post("/", requireAuth, async (req, res) => {
  const body = req.body || {};
  const uid = req.user._id.toString();
  const tier = await defaultTierForUser(uid);

  const cat = body.categoryId != null ? String(body.categoryId).trim() : "";
  const desc = body.description != null ? String(body.description).trim() : "";
  const tit = body.title != null ? String(body.title).trim() : "";
  const images = normalizeListingImages(body);
  const stat = body.status && String(body.status).trim() ? String(body.status).trim() : "";
  const priceStr = body.price != null ? String(body.price).trim() : "";

  if (!cat) return res.status(400).json({ message: "Category is required" });
  if (!tit) return res.status(400).json({ message: "Title is required" });
  if (!desc) return res.status(400).json({ message: "Description is required" });
  if (!stat) return res.status(400).json({ message: "Status is required" });
  if (images.length === 0) return res.status(400).json({ message: "At least one image is required" });

  if (!vendorMaySetPublicContactFields(tier)) {
    if (String(body.phone || "").trim()) {
      return res.status(400).json({ message: "Phone is available on Standard and Gold plans." });
    }
    if (String(body.email || "").trim()) {
      return res.status(400).json({ message: "Email is available on Standard and Gold plans." });
    }
    if (String(body.website || "").trim()) {
      return res.status(400).json({ message: "Website is available on Standard and Gold plans." });
    }
  }

  const tierCheck = validateListingForVendorTier(tier, {
    description: desc,
    images,
    videoUrl: body.videoUrl != null ? String(body.videoUrl).trim() : "",
  });
  if (!tierCheck.ok) return res.status(400).json({ message: tierCheck.message });

  const listingCap = maxListingsForPlanTier(tier);
  if (listingCap != null) {
    const existingCount = await Listing.countDocuments({ userId: uid });
    if (existingCount >= listingCap) {
      return res.status(400).json({
        message:
          "Your free plan includes one listing. Upgrade your membership to add more listings.",
      });
    }
  }

  const dup = await findListingByTitleCaseInsensitive(tit);
  if (dup) return res.status(400).json({ message: "A listing with this title already exists. Choose a different title." });

  const coverImageIndex = normalizeCoverIndex(body.coverImageIndex, images.length);
  let vid = "";
  if (body.videoUrl != null && String(body.videoUrl).trim()) {
    const u = String(body.videoUrl).trim();
    if (!/^https?:\/\//i.test(u) && !u.startsWith("/uploads")) {
      return res.status(400).json({ message: "Video must be a valid URL (https://) or an uploaded file path." });
    }
    vid = u;
  }

  const latitude =
    body.latitude === "" || body.latitude === undefined || body.latitude === null
      ? undefined
      : Number(body.latitude);
  const longitude =
    body.longitude === "" || body.longitude === undefined || body.longitude === null
      ? undefined
      : Number(body.longitude);

  const sellerStatus = await resolveSellerStatusForCreate();
  const ownerBilling = await User.findById(uid).select("billingTier promoStandardExpiresAt").lean();
  const featured = listingsFeaturedForUserPlan(ownerBilling);

  try {
    const listing = await Listing.create({
      userId: uid,
      categoryId: cat,
      title: tit,
      description: desc,
      status: stat,
      sellerStatus,
      tier,
      featured,
      features: Array.isArray(body.features) ? body.features : [],
      images,
      coverImageIndex,
      videoUrl: vid,
      price: priceStr || "",
      businessName: String(body.businessName != null ? body.businessName : "")
        .trim()
        .slice(0, 200),
      city: String(body.city || "").trim(),
      neighborhood: String(body.neighborhood || "").trim(),
      phone: String(body.phone || "").trim(),
      email: String(body.email || "").trim(),
      website: String(body.website || "").trim(),
      googleMapUrl: String(body.googleMapUrl || "").trim(),
      latitude: Number.isFinite(latitude) ? latitude : undefined,
      longitude: Number.isFinite(longitude) ? longitude : undefined,
      openingHours: normalizeOpeningHours(body.openingHours),
      showOpeningHours: body.showOpeningHours === false ? false : true,
    });
    return res.status(201).json(listing);
  } catch (err) {
    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors || {}).map((e) => e.message).filter(Boolean);
      return res.status(400).json({ message: messages.length ? messages.join(" ") : "Validation failed" });
    }
    throw err;
  }
});

router.put("/:id", requireAuth, async (req, res) => {
  const listing = await Listing.findById(req.params.id);
  if (!listing) return res.status(404).json({ message: "Listing not found" });
  if (listing.userId !== req.user._id.toString()) {
    return res.status(403).json({ message: "Not authorized" });
  }

  const body = req.body || {};
  const allowed = [
    "categoryId",
    "title",
    "businessName",
    "description",
    "status",
    "features",
    "images",
    "coverImageIndex",
    "videoUrl",
    "price",
    "city",
    "neighborhood",
    "phone",
    "email",
    "website",
    "googleMapUrl",
    "latitude",
    "longitude",
    "openingHours",
    "showOpeningHours",
  ];
  const payload = {};
  for (const key of allowed) {
    if (body[key] === undefined) continue;
    if (key === "businessName") {
      payload[key] = String(body[key] != null ? body[key] : "")
        .trim()
        .slice(0, 200);
      continue;
    }
    if (key === "features") {
      payload[key] = Array.isArray(body[key]) ? body[key] : [];
      continue;
    }
    if (key === "images") {
      payload[key] = normalizeListingImages(body);
      continue;
    }
    if (key === "coverImageIndex") {
      payload[key] = Number(body.coverImageIndex);
      continue;
    }
    if (key === "videoUrl") {
      const u = body[key] != null ? String(body[key]).trim() : "";
      payload[key] = u;
      continue;
    }
    if (key === "price") {
      payload[key] = body[key] != null ? String(body[key]).trim() : "";
      continue;
    }
    if (key === "openingHours") {
      payload[key] = normalizeOpeningHours(body[key]);
      continue;
    }
    if (key === "showOpeningHours") {
      payload[key] = Boolean(body[key]);
      continue;
    }
    if (key === "latitude" || key === "longitude") {
      const v = body[key];
      if (v === "" || v === undefined || v === null) {
        payload[key] = undefined;
      } else {
        const n = Number(v);
        payload[key] = Number.isFinite(n) ? n : undefined;
      }
      continue;
    }
    const v = body[key] != null ? String(body[key]).trim() : "";
    if (key === "status") payload[key] = v || "draft";
    else if ((key === "categoryId" || key === "title" || key === "description") && !v) continue;
    else payload[key] = v;
  }

  const tier = listing.tier || "free";
  if (!vendorMaySetPublicContactFields(tier)) {
    if (payload.phone !== undefined && String(payload.phone || "").trim()) {
      return res.status(400).json({ message: "Phone is available on Standard and Gold plans." });
    }
    if (payload.email !== undefined && String(payload.email || "").trim()) {
      return res.status(400).json({ message: "Email is available on Standard and Gold plans." });
    }
    if (payload.website !== undefined && String(payload.website || "").trim()) {
      return res.status(400).json({ message: "Website is available on Standard and Gold plans." });
    }
  }

  if (payload.categoryId !== undefined && !payload.categoryId) {
    return res.status(400).json({ message: "Category is required" });
  }
  if (payload.description !== undefined && !payload.description) {
    return res.status(400).json({ message: "Description is required" });
  }
  if (payload.title !== undefined && !payload.title) {
    return res.status(400).json({ message: "Title is required" });
  }
  if (payload.status !== undefined && !String(payload.status).trim()) {
    return res.status(400).json({ message: "Status is required" });
  }
  if (payload.images !== undefined) {
    if (!Array.isArray(payload.images) || payload.images.length === 0) {
      return res.status(400).json({ message: "At least one image is required" });
    }
  }
  const mergedImages = payload.images !== undefined ? payload.images : listing.images || [];
  const imageCount = Array.isArray(mergedImages) ? mergedImages.length : 0;
  if (payload.coverImageIndex !== undefined) {
    payload.coverImageIndex = normalizeCoverIndex(payload.coverImageIndex, imageCount);
  } else if (payload.images !== undefined) {
    payload.coverImageIndex = normalizeCoverIndex(listing.coverImageIndex, imageCount);
  }
  if (payload.videoUrl !== undefined) {
    const u = String(payload.videoUrl || "").trim();
    if (u && !/^https?:\/\//i.test(u) && !u.startsWith("/uploads")) {
      return res.status(400).json({ message: "Video must be a valid URL (https://) or an uploaded file path." });
    }
    payload.videoUrl = u;
  }
  const mergedDesc =
    payload.description !== undefined ? String(payload.description || "").trim() : String(listing.description || "").trim();
  const mergedVideo =
    payload.videoUrl !== undefined ? String(payload.videoUrl || "").trim() : String(listing.videoUrl || "").trim();
  const tierCheckPut = validateListingForVendorTier(tier, {
    description: mergedDesc,
    images: mergedImages,
    videoUrl: mergedVideo,
  });
  if (!tierCheckPut.ok) return res.status(400).json({ message: tierCheckPut.message });
  const newTitle = payload.title !== undefined ? payload.title : listing.title;
  if (newTitle && String(newTitle).trim().toLowerCase() !== String(listing.title || "").trim().toLowerCase()) {
    const dup = await findListingByTitleCaseInsensitive(newTitle, listing._id);
    if (dup) return res.status(400).json({ message: "A listing with this title already exists. Choose a different title." });
  }
  try {
    const updated = await Listing.findByIdAndUpdate(req.params.id, payload, {
      returnDocument: "after",
      runValidators: true,
    });
    return res.json(updated);
  } catch (err) {
    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors || {}).map((e) => e.message).filter(Boolean);
      return res.status(400).json({ message: messages.length ? messages.join(" ") : "Validation failed" });
    }
    throw err;
  }
});

router.delete("/:id", requireAuth, async (req, res) => {
  const listing = await Listing.findById(req.params.id);
  if (!listing) return res.status(404).json({ message: "Listing not found" });
  if (listing.userId !== req.user._id.toString()) {
    return res.status(403).json({ message: "Not authorized" });
  }
  await Review.deleteMany(matchReviewsByListingId(listing._id.toString()));
  await Listing.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (id === "my-listings" || id === "mine") return res.status(404).json({ message: "Not found" });

    const listing = await Listing.findOne({
      _id: id,
      ...DIRECTORY_PUBLIC_BASE,
    });
    if (!listing) return res.status(404).json({ message: "Listing not found" });
    const listingObj = listing.toObject();
    listingObj.id = listing._id.toString();
    listingObj.seller = buildSellerShapeFromListing(listing);
    res.json(listingObj);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch listing" });
  }
});

export default router;
