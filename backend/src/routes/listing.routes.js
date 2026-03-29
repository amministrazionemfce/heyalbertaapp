import express from "express";
import mongoose from "mongoose";
import { requireAuth, optionalAuth } from "../middleware/auth.js";
import Listing from "../models/Listing.js";
import Vendor from "../models/Vendor.js";
import CityImage from "../models/CityImage.js";
import CategoryImage from "../models/CategoryImage.js";

const router = express.Router();

function escapeRegex(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Case-insensitive unique title across all listings (excluding optional ObjectId). */
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



// Public: directory listings from LISTINGS collection
// Query: page, limit, city, vendorId, categoryId/category, search, featured, myLikings+favoriteIds, myListings (auth), minPrice, maxPrice (parsed from listing.price string)
// Response: listings include reviewCount, avgRating, price
router.get("/", optionalAuth, async (req, res) => {
  try {
    const categoryId = (req.query.categoryId || req.query.category || "").trim();
    const vendorIdParam = (req.query.vendorId || "").trim();
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
    const limit = Math.min(24, Math.max(1, parseInt(req.query.limit, 10) || 12));
    const skip = (page - 1) * limit;

    const matchListing = { status: "published" };
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
    } else if (myListings) {
      if (!req.user) {
        return res.status(401).json({ message: "Sign in to see your listings" });
      }
      const vendors = await Vendor.find({ userId: req.user._id.toString() }).select("_id");
      const vendorIds = vendors.map((v) => v._id.toString());
      if (vendorIds.length === 0) {
        return res.json({ listings: [], total: 0, pages: 1, page });
      }
      matchListing.vendorId = { $in: vendorIds };
    } else if (vendorIdParam) {
      matchListing.vendorId = vendorIdParam;
    }

    const pipeline = [
      { $match: matchListing },
      {
        $lookup: {
          from: "vendors",
          let: { vid: "$vendorId" },
          pipeline: [
            { $match: { $expr: { $eq: [{ $toString: "$_id" }, "$$vid"] } } },
          ],
          as: "vendorDoc",
        },
      },
      { $unwind: { path: "$vendorDoc", preserveNullAndEmptyArrays: false } },
      { $match: { "vendorDoc.status": "approved" } },
      {
        $lookup: {
          from: "reviews",
          let: { vid: { $toString: { $ifNull: ["$vendorId", ""] } } },
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
          as: "_reviewDocs",
        },
      },
      {
        $addFields: {
          reviewCount: { $size: { $ifNull: ["$_reviewDocs", []] } },
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

    // Category filter is already applied via matchListing.categoryId (listing document).
    // Do not also require vendorDoc.category — it can differ from listing.categoryId and
    // would hide listings that homepage counts-by-category still includes.
    if (city) pipeline.push({ $match: { "vendorDoc.city": new RegExp(city, "i") } });
    if (search) {
      const searchRegex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      pipeline.push({
        $match: {
          $or: [
            { title: searchRegex },
            { description: searchRegex },
            { "vendorDoc.name": searchRegex },
          ],
        },
      });
    }
    if (hasMinPrice) pipeline.push({ $match: { priceNumeric: { $gte: minPriceQ } } });
    if (hasMaxPrice) pipeline.push({ $match: { priceNumeric: { $lte: maxPriceQ } } });

    pipeline.push(
      { $sort: { createdAt: -1 } },
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
                vendorId: 1,
                featured: 1,
                features: { $ifNull: ["$features", []] },
                images: { $ifNull: ["$images", []] },
                coverImageIndex: { $ifNull: ["$coverImageIndex", 0] },
                videoUrl: { $ifNull: ["$videoUrl", ""] },
                price: { $ifNull: ["$price", ""] },
                reviewCount: 1,
                avgRating: 1,
                createdAt: 1,
                vendor: {
                  id: { $toString: "$vendorDoc._id" },
                  name: "$vendorDoc.name",
                  city: "$vendorDoc.city",
                  neighborhood: "$vendorDoc.neighborhood",
                  images: "$vendorDoc.images",
                  description: "$vendorDoc.description",
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

    res.json({ listings, total, pages, page });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch listings" });
  }
});

// Public: city images (used by homepage city carousel)
// Returns mapping: { [cityName]: imageUrl }
router.get("/city-images", async (req, res) => {
  try {
    const docs = await CityImage.find({}, { cityName: 1, imageUrl: 1 }).lean();
    const out = {};
    for (const d of docs) {
      if (d?.cityName) out[d.cityName] = d.imageUrl || "";
    }
    res.json(out);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch city images" });
  }
});

// Public: category images (used by homepage category cards)
// Returns mapping: { [categoryId]: imageUrl }
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


// Public: get published listing counts by category (for homepage)
// Only count listings whose vendor is approved, to match directory results
router.get("/counts-by-category", async (req, res) => {
  try {
    const counts = await Listing.aggregate([
      { $match: { status: "published" } },
      {
        $lookup: {
          from: "vendors",
          let: { vid: "$vendorId" },
          pipeline: [
            { $match: { $expr: { $eq: [{ $toString: "$_id" }, "$$vid"] } } },
          ],
          as: "vendorDoc",
        },
      },
      { $unwind: { path: "$vendorDoc", preserveNullAndEmptyArrays: false } },
      { $match: { "vendorDoc.status": "approved" } },
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

// Public: published listing counts by vendor city (lowercase keys, for homepage city cards)
router.get("/counts-by-city", async (req, res) => {
  try {
    const counts = await Listing.aggregate([
      { $match: { status: "published" } },
      {
        $lookup: {
          from: "vendors",
          let: { vid: "$vendorId" },
          pipeline: [
            { $match: { $expr: { $eq: [{ $toString: "$_id" }, "$$vid"] } } },
          ],
          as: "vendorDoc",
        },
      },
      { $unwind: { path: "$vendorDoc", preserveNullAndEmptyArrays: false } },
      { $match: { "vendorDoc.status": "approved" } },
      { $match: { "vendorDoc.city": { $exists: true, $nin: [null, ""] } } },
      {
        $group: {
          _id: { $toLower: "$vendorDoc.city" },
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

// Get listings for current user's vendors
router.get("/my-listings", requireAuth, async (req, res) => {
  try {
    const vendors = await Vendor.find({ userId: req.user._id.toString() }).select("_id");
    const vendorIds = vendors.map((v) => v._id.toString());
    const listings = await Listing.find({ vendorId: { $in: vendorIds } }).sort({ createdAt: -1 });
    res.json(listings);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch listings" });
  }
});

router.get("/listByVendor", requireAuth, async (req, res) => {
  const { vendorId } = req.query;
  if (!vendorId) return res.status(400).json({ message: "vendorId required" });
  const vendor = await Vendor.findOne({ _id: vendorId, userId: req.user._id.toString() });
  if (!vendor) return res.status(403).json({ message: "Not authorized" });
  const listings = await Listing.find({ vendorId }).sort({ createdAt: -1 });
  res.json(listings);
});

// Public: get single listing by id (published only, with vendor)
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (id === "my-listings" || id === "listByVendor") 
      return res.status(404).json({ message: "Not found" });

    const listing = await Listing.findOne({ _id: id, status: "published" });
    if (!listing) return res.status(404).json({ message: "Listing not found" });
    const vendor = await Vendor.findOne({ _id: listing.vendorId, status: "approved" });
    if (!vendor) return res.status(404).json({ message: "Vendor not found" });
    const listingObj = listing.toObject();
    listingObj.id = listing._id.toString();
    listingObj.vendor = {
      id: vendor._id.toString(),
      userId: vendor.userId || null,
      name: vendor.name,
      description: vendor.description,
      city: vendor.city,
      neighborhood: vendor.neighborhood,
      phone: vendor.phone,
      email: vendor.email,
      website: vendor.website,
      images: vendor.images,
      tier: vendor.tier,
      verified: vendor.verified,
    };
    res.json(listingObj);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch listing" });
  }
});


router.post("/", requireAuth, async (req, res) => {
  const body = req.body || {};
  const { vendorId, categoryId, title, description, status, features, videoUrl, price } = body;
  const vendor = await Vendor.findOne({ _id: vendorId, userId: req.user._id.toString() });
  if (!vendor) return res.status(403).json({ message: "Not authorized" });
  const cat = categoryId != null ? String(categoryId).trim() : "";
  const desc = description != null ? String(description).trim() : "";
  const tit = title != null ? String(title).trim() : "";
  const images = normalizeListingImages(body);
  const stat = status && String(status).trim() ? String(status).trim() : "";
  if (!cat) return res.status(400).json({ message: "Category is required" });
  if (!tit) return res.status(400).json({ message: "Title is required" });
  if (!desc) return res.status(400).json({ message: "Description is required" });
  if (!stat) return res.status(400).json({ message: "Status is required" });
  if (images.length === 0) return res.status(400).json({ message: "At least one image is required" });
  const priceStr = price != null ? String(price).trim() : "";
  if (!priceStr) return res.status(400).json({ message: "Price is required" });
  const dup = await findListingByTitleCaseInsensitive(tit);
  if (dup) return res.status(400).json({ message: "A listing with this title already exists. Choose a different title." });
  const coverImageIndex = normalizeCoverIndex(body.coverImageIndex, images.length);
  let vid = "";
  if (videoUrl != null && String(videoUrl).trim()) {
    const u = String(videoUrl).trim();
    if (!/^https?:\/\//i.test(u) && !u.startsWith("/uploads")) {
      return res.status(400).json({ message: "Video must be a valid URL (https://) or an uploaded file path." });
    }
    vid = u;
  }
  try {
    const listing = await Listing.create({
      vendorId: vendor._id.toString(),
      categoryId: cat,
      title: tit,
      description: desc,
      status: stat,
      features: Array.isArray(features) ? features : [],
      images,
      coverImageIndex,
      videoUrl: vid,
      price: priceStr,
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
  const vendor = await Vendor.findOne({ _id: listing.vendorId, userId: req.user._id.toString() });
  if (!vendor) return res.status(403).json({ message: "Not authorized" });
  const body = req.body || {};
  const allowed = ["categoryId", "title", "description", "status", "features", "images", "coverImageIndex", "videoUrl", "price"];
  const payload = {};
  for (const key of allowed) {
    if (body[key] === undefined) continue;
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
    const v = body[key] != null ? String(body[key]).trim() : "";
    if (key === "status") payload[key] = v || "draft";
    else if ((key === "categoryId" || key === "title" || key === "description") && !v) continue;
    else payload[key] = v;
  }
  if (payload.categoryId !== undefined && !payload.categoryId) return res.status(400).json({ message: "Category is required" });
  if (payload.description !== undefined && !payload.description) return res.status(400).json({ message: "Description is required" });
  if (payload.title !== undefined && !payload.title) return res.status(400).json({ message: "Title is required" });
  if (payload.price !== undefined && !String(payload.price).trim()) {
    return res.status(400).json({ message: "Price is required" });
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
  const newTitle = payload.title !== undefined ? payload.title : listing.title;
  if (newTitle && String(newTitle).trim().toLowerCase() !== String(listing.title || "").trim().toLowerCase()) {
    const dup = await findListingByTitleCaseInsensitive(newTitle, listing._id);
    if (dup) return res.status(400).json({ message: "A listing with this title already exists. Choose a different title." });
  }
  try {
    const updated = await Listing.findByIdAndUpdate(req.params.id, payload, { new: true, runValidators: true });
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
  const vendor = await Vendor.findOne({ _id: listing.vendorId, userId: req.user._id.toString() });
  if (!vendor) return res.status(403).json({ message: "Not authorized" });
  await Listing.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});


export default router;
