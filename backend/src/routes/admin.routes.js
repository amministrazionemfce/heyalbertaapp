import express from "express";
import mongoose from "mongoose";
import { requireAdmin } from "../middleware/admin.js";

import Vendor from "../models/Vendor.js";
import Listing from "../models/Listing.js";
import Review from "../models/Review.js";
import User from "../models/User.js";
import Resource from "../models/Resource.js";
import CityImage from "../models/CityImage.js";
import CategoryImage from "../models/CategoryImage.js";
import SiteSettings from "../models/SiteSettings.js";
import ContactMessage from "../models/ContactMessage.js";
import { matchReviewsByVendorId } from "../utils/reviewVendorQuery.js";

const router = express.Router();

async function getOrCreateSiteSettings() {
  let doc = await SiteSettings.findById("default");
  if (!doc) {
    doc = await SiteSettings.create({ _id: "default" });
  }
  return doc;
}

function isValidObjectId(id) {
  return id &&
    typeof id === "string"
    && id !== "undefined"
    && mongoose.Types.ObjectId.isValid(id);
}


/*
------------------------------------------------
GET ALL VENDORS (Admin panel)
------------------------------------------------
*/
router.get("/vendors", requireAdmin, async (req, res) => {
  try {
    const { status } = req.query;

    const query = {};
    if (status) query.status = status;

    const vendors = await Vendor.find(query).sort({ createdAt: -1 });

    const result = [];

    for (const v of vendors) {
      const vendorIdStr = v._id ? v._id.toString() : v.id;
      const reviews = await Review.find(matchReviewsByVendorId(vendorIdStr));

      const avg =
        reviews.length > 0
          ? reviews.reduce((a, r) => a + r.rating, 0) / reviews.length
          : 0;

      result.push({
        ...v.toObject(),
        avgRating: Number(avg.toFixed(1)),
        reviewCount: reviews.length
      });
    }

    res.json(result);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


/*
------------------------------------------------
GET ONE VENDOR (Admin panel)
------------------------------------------------
*/
router.get("/vendors/:vendorId", requireAdmin, async (req, res) => {
  try {
    const { vendorId } = req.params;
    if (!isValidObjectId(vendorId))
      return res.status(400).json({ message: "Invalid vendor id" });

    const vendor = await Vendor.findById(vendorId);
    if (!vendor)
      return res.status(404).json({ message: "Vendor not found" });

    const vendorIdStr = vendor._id.toString();
    const reviews = await Review.find(matchReviewsByVendorId(vendorIdStr));
    const avg =
      reviews.length > 0
        ? reviews.reduce((a, r) => a + r.rating, 0) / reviews.length
        : 0;

    const listingCount = await Listing.countDocuments({ vendorId: vendorIdStr });

    res.json({
      ...vendor.toObject(),
      avgRating: Number(avg.toFixed(1)),
      reviewCount: reviews.length,
      listingCount,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


function normalizeVendorName(name) {
  return (name || "").trim().toLowerCase();
}

async function isDuplicateVendorNameForAdmin(name, excludeVendorId) {
  const n = normalizeVendorName(name);
  if (!n) return false;
  const query = {
    name: new RegExp(`^${n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i"),
  };
  if (excludeVendorId) query._id = { $ne: excludeVendorId };
  const existing = await Vendor.findOne(query);
  return !!existing;
}


/*
------------------------------------------------
UPDATE VENDOR (Admin)
------------------------------------------------
*/
router.put("/vendors/:vendorId", requireAdmin, async (req, res) => {
  try {
    const { vendorId } = req.params;
    if (!isValidObjectId(vendorId))
      return res.status(400).json({ message: "Invalid vendor id" });

    const vendor = await Vendor.findById(vendorId);
    if (!vendor)
      return res.status(404).json({ message: "Vendor not found" });

    const name = (req.body.name !== undefined ? req.body.name : vendor.name) || "";
    const trimmedName = (name || "").trim();
    if (trimmedName && (await isDuplicateVendorNameForAdmin(trimmedName, vendor._id))) {
      return res.status(400).json({ message: "The business name already exists, please rename it." });
    }

    const allowed = [
      "name", "description", "category", "city", "neighborhood",
      "phone", "email", "website", "images", "tier", "videoUrl", "verified",
    ];
    const payload = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) payload[key] = req.body[key];
    }

    const updated = await Vendor.findByIdAndUpdate(vendorId, payload, {
      new: true,
      runValidators: false,
    });

    res.json({ message: "Vendor updated", vendor: updated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


/*
------------------------------------------------
APPROVE VENDOR
------------------------------------------------
*/
router.put("/vendors/:vendorId/approve", requireAdmin, async (req, res) => {
  try {
    const { vendorId } = req.params;
    if (!isValidObjectId(vendorId))
      return res.status(400).json({ message: "Invalid vendor id" });

    const vendor = await Vendor.findByIdAndUpdate(
      vendorId,
      { status: "approved" },
      { new: true }
    );

    if (!vendor)
      return res.status(404).json({ message: "Vendor not found" });

    res.json({ message: "Vendor approved", vendor });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/*
------------------------------------------------
REJECT VENDOR
------------------------------------------------
*/
router.put("/vendors/:vendorId/reject", requireAdmin, async (req, res) => {
  try {
    const { vendorId } = req.params;
    if (!isValidObjectId(vendorId))
      return res.status(400).json({ message: "Invalid vendor id" });

    const vendor = await Vendor.findByIdAndUpdate(
      vendorId,
      { status: "rejected" },
      { new: true }
    );

    if (!vendor)
      return res.status(404).json({ message: "Vendor not found" });

    res.json({ message: "Vendor rejected", vendor });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/*
------------------------------------------------
FEATURE / UNFEATURE VENDOR
------------------------------------------------
*/
router.put("/vendors/:vendorId/feature", requireAdmin, async (req, res) => {
  try {
    const { vendorId } = req.params;
    const { featured } = req.body;
    if (!isValidObjectId(vendorId))
      return res.status(400).json({ message: "Invalid vendor id" });

    const value = featured === true || featured === "true";
    const vendor = await Vendor.findByIdAndUpdate(
      vendorId,
      { featured: value },
      { new: true }
    );

    if (!vendor)
      return res.status(404).json({ message: "Vendor not found" });

    res.json({ message: value ? "Vendor featured" : "Vendor unfeatured", vendor });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/*
------------------------------------------------
DELETE VENDOR (cascade: listings + reviews)
------------------------------------------------
*/
router.delete("/vendors/:vendorId", requireAdmin, async (req, res) => {
  try {
    const { vendorId } = req.params;
    const notifyEmail =
      req.body?.notifyEmail === true || req.body?.notifyEmail === "true";

    if (!isValidObjectId(vendorId))
      return res.status(400).json({ message: "Invalid vendor id" });

    const vendor = await Vendor.findById(vendorId);
    if (!vendor)
      return res.status(404).json({ message: "Vendor not found" });

    const vendorIdStr = vendor._id.toString();

    const listingsResult = await Listing.deleteMany({ vendorId: vendorIdStr });
    const reviewsResult = await Review.deleteMany(matchReviewsByVendorId(vendorIdStr));
    await Vendor.findByIdAndDelete(vendorId);

    // Future: if (notifyEmail) send vendor deletion notice to vendor.email / user
    if (notifyEmail) {
      // Placeholder for email integration (e.g. queue job)
    }

    res.json({
      message: "Vendor and related data deleted",
      deletedListingsCount: listingsResult.deletedCount,
      deletedReviewsCount: reviewsResult.deletedCount,
      notifyEmailRequested: notifyEmail,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


/*
------------------------------------------------
GET ALL LISTINGS (Admin panel) — with vendor info
------------------------------------------------
*/
router.get("/listings", requireAdmin, async (req, res) => {
  try {
    const { status } = req.query;
    const query = {};
    if (status) query.status = status;

    const listings = await Listing.find(query).sort({ createdAt: -1 });
    const result = [];

    for (const list of listings) {
      const vendor = await Vendor.findById(list.vendorId);
      result.push({
        ...list.toObject(),
        id: list._id.toString(),
        vendorName: vendor?.name ?? null,
        vendorCity: vendor?.city ?? null,
      });
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/*
------------------------------------------------
FEATURE / UNFEATURE LISTING
------------------------------------------------
*/
router.put("/listings/:listingId/feature", requireAdmin, async (req, res) => {
  try {
    const { listingId } = req.params;
    const { featured } = req.body;
    if (!isValidObjectId(listingId))
      return res.status(400).json({ message: "Invalid listing id" });

    const value = featured === true || featured === "true";
    const listing = await Listing.findByIdAndUpdate(
      listingId,
      { featured: value },
      { new: true }
    );

    if (!listing)
      return res.status(404).json({ message: "Listing not found" });

    res.json({ message: value ? "Listing featured" : "Listing unfeatured", listing });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/*
------------------------------------------------
ADMIN DASHBOARD STATS
------------------------------------------------
*/
router.get("/stats", requireAdmin, async (req, res) => {
  try {

    const totalUsers = await User.countDocuments();
    const totalVendors = await Vendor.countDocuments();
    const pendingVendors = await Vendor.countDocuments({ status: "pending" });
    const approvedVendors = await Vendor.countDocuments({ status: "approved" });
    const totalReviews = await Review.countDocuments();
    const totalResources = await Resource.countDocuments();
    const unreadContactMessages = await ContactMessage.countDocuments({ read: false });

    res.json({
      totalUsers,
      totalVendors,
      pendingVendors,
      approvedVendors,
      totalReviews,
      totalResources,
      unreadContactMessages,
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


/*
------------------------------------------------
GET ALL USERS
------------------------------------------------
*/
router.get("/users", requireAdmin, async (req, res) => {
  try {

    const users = await User.find({}, { passwordHash: 0 });

    res.json(users);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/*
------------------------------------------------
GET city images (Admin panel)
------------------------------------------------
*/
router.get("/city-images", requireAdmin, async (req, res) => {
  try {
    const docs = await CityImage.find({}, { cityName: 1, imageUrl: 1 }).lean();
    const out = {};
    for (const d of docs) {
      if (d?.cityName) out[d.cityName] = d.imageUrl || "";
    }
    res.json(out);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/*
------------------------------------------------
UPDATE city images (Admin panel)
------------------------------------------------
Body: { cities: [{ cityName, imageUrl }, ...] }
If imageUrl is empty, the custom override is removed (fallback to defaults).
*/
router.put("/city-images", requireAdmin, async (req, res) => {
  try {
    const cities = Array.isArray(req.body?.cities) ? req.body.cities : [];
    let upserts = 0;
    let deletes = 0;

    for (const c of cities) {
      const cityName = (c?.cityName ?? "").trim();
      if (!cityName) continue;
      const imageUrl = (c?.imageUrl ?? "").trim();

      if (!imageUrl) {
        await CityImage.deleteOne({ cityName });
        deletes += 1;
        continue;
      }

      await CityImage.findOneAndUpdate(
        { cityName },
        { imageUrl },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      upserts += 1;
    }

    res.json({ message: "City images updated", upserts, deletes });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/*
------------------------------------------------
GET category images (Admin panel)
------------------------------------------------
*/
router.get("/category-images", requireAdmin, async (req, res) => {
  try {
    const docs = await CategoryImage.find({}, { categoryId: 1, imageUrl: 1 }).lean();
    const out = {};
    for (const d of docs) {
      if (d?.categoryId) out[d.categoryId] = d.imageUrl || "";
    }
    res.json(out);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/*
------------------------------------------------
UPDATE category images (Admin panel)
------------------------------------------------
Body: { categories: [{ categoryId, imageUrl }, ...] }
If imageUrl is empty, the custom override is removed.
*/
router.put("/category-images", requireAdmin, async (req, res) => {
  try {
    const categories = Array.isArray(req.body?.categories) ? req.body.categories : [];
    let upserts = 0;
    let deletes = 0;

    for (const c of categories) {
      const categoryId = (c?.categoryId ?? "").trim();
      if (!categoryId) continue;
      const imageUrl = (c?.imageUrl ?? "").trim();

      if (!imageUrl) {
        await CategoryImage.deleteOne({ categoryId });
        deletes += 1;
        continue;
      }

      await CategoryImage.findOneAndUpdate(
        { categoryId },
        { imageUrl },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      upserts += 1;
    }

    res.json({ message: "Category images updated", upserts, deletes });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/*
------------------------------------------------
Site settings (News hero copy, CTAs; hero image often set from Images admin)
------------------------------------------------
*/
router.get("/site-settings", requireAdmin, async (req, res) => {
  try {
    const s = await getOrCreateSiteSettings();
    res.json(s.toJSON());
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put("/site-settings", requireAdmin, async (req, res) => {
  try {
    const s = await getOrCreateSiteSettings();
    const allowed = [
      "newsHeroImage",
      "aboutHeroImage",
      "contactHeroImage",
      "newsHeadline",
      "newsSubhead",
      "newsCtaPrimaryText",
      "newsCtaPrimaryLink",
      "newsCtaSecondaryText",
      "newsCtaSecondaryLink",
    ];
    for (const k of allowed) {
      if (req.body[k] !== undefined) s[k] = req.body[k];
    }
    if (req.body.homeHeroSlides !== undefined) {
      const raw = req.body.homeHeroSlides;
      s.homeHeroSlides = Array.isArray(raw)
        ? raw
            .map((x) => ({
              imageUrl: String(x?.imageUrl ?? "").trim(),
              headline: String(x?.headline ?? "").trim(),
              headlineLine2: String(x?.headlineLine2 ?? "").trim(),
              subhead: String(x?.subhead ?? "").trim(),
            }))
            .filter((x) => x.imageUrl)
        : [];
    }
    if (req.body.aboutMissionImages !== undefined) {
      const raw = req.body.aboutMissionImages;
      s.aboutMissionImages = Array.isArray(raw)
        ? raw.map((x) => String(x ?? "").trim()).filter(Boolean)
        : [];
    }
    await s.save();
    res.json(s.toJSON());
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/*
------------------------------------------------
Contact / support messages (from public contact page)
------------------------------------------------
*/
router.get("/contact-messages", requireAdmin, async (req, res) => {
  try {
    const readParam = req.query.read;
    const q = {};
    if (readParam === "true") q.read = true;
    else if (readParam === "false") q.read = false;

    const limit = Math.min(parseInt(req.query.limit, 10) || 100, 200);
    const messages = await ContactMessage.find(q)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.patch("/contact-messages/:id/read", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid id" });
    }

    const doc = await ContactMessage.findByIdAndUpdate(
      id,
      { read: true, readAt: new Date() },
      { new: true }
    );

    if (!doc) return res.status(404).json({ message: "Message not found" });

    res.json(doc.toJSON());
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;