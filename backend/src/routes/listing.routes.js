import express from "express";
import { requireAuth } from "../middleware/auth.js";
import Listing from "../models/Listing.js";
import Vendor from "../models/Vendor.js";

const router = express.Router();



// Public: directory listings (published only; filter by categoryId = query category)
router.get("/", async (req, res) => {
  try {
    const categoryId = (req.query.categoryId || req.query.category || "").trim();
    const city = (req.query.city || "").trim();
    const search = (req.query.search || "").trim();
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(24, Math.max(1, parseInt(req.query.limit, 10) || 12));
    const skip = (page - 1) * limit;

    const matchListing = { status: "published" };
    if (categoryId) matchListing.categoryId = categoryId;

    const pipeline = [
      { $match: matchListing },
      {
        $lookup: {
          from: "vendors",
          let: { vid: { $toObjectId: "$vendorId" } },
          pipeline: [{ $match: { $expr: { $eq: ["$_id", "$$vid"] } } }],
          as: "vendorDoc",
        },
      },
      { $unwind: { path: "$vendorDoc", preserveNullAndEmptyArrays: false } },
      { $match: { "vendorDoc.status": "approved" } },
    ];

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
    res.status(500).json({ message: "Failed to fetch directory listings" });
  }
});


// Public: get published listing counts by category (for homepage)
router.get("/counts-by-category", async (req, res) => {
  try {
    const counts = await Listing.aggregate([
      { $match: { status: "published" } },
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
  const { vendorId, categoryId, title, description, status, features } = body;
  const vendor = await Vendor.findOne({ _id: vendorId, userId: req.user._id.toString() });
  if (!vendor) return res.status(403).json({ message: "Not authorized" });
  const cat = categoryId != null ? String(categoryId).trim() : "";
  const desc = description != null ? String(description).trim() : "";
  const tit = title != null ? String(title).trim() : "";
  if (!cat) return res.status(400).json({ message: "Category is required" });
  if (!tit) return res.status(400).json({ message: "Title is required" });
  if (!desc) return res.status(400).json({ message: "Description is required" });
  try {
    const listing = await Listing.create({
      vendorId: vendor._id.toString(),
      categoryId: cat,
      title: tit,
      description: desc,
      status: status && String(status).trim() ? status.trim() : "draft",
      features: Array.isArray(features) ? features : [],
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
  const allowed = ["categoryId", "title", "description", "status", "features"];
  const payload = {};
  for (const key of allowed) {
    if (body[key] === undefined) continue;
    const v = key === "features" ? body[key] : (body[key] != null ? String(body[key]).trim() : "");
    if (key === "features") payload[key] = Array.isArray(v) ? v : [];
    else if (key === "status") payload[key] = v || "draft";
    else if ((key === "categoryId" || key === "title" || key === "description") && !v) continue;
    else payload[key] = v;
  }
  if (payload.categoryId !== undefined && !payload.categoryId) return res.status(400).json({ message: "Category is required" });
  if (payload.description !== undefined && !payload.description) return res.status(400).json({ message: "Description is required" });
  if (payload.title !== undefined && !payload.title) return res.status(400).json({ message: "Title is required" });
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
