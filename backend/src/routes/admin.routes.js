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
import { setFeaturedForPaidUser, clearFeaturedForFreeUser } from "../utils/membershipFeatured.js";
import { sendMarketingBatch } from "../utils/mail.js";

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

/** Tiers that should trigger homepage featuring (aligned with Stripe Standard / Gold). */
function isPaidMembershipTier(t) {
  const x = String(t || "").toLowerCase();
  return x === "standard" || x === "premium" || x === "gold";
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
      "phone", "email", "website", "images", "tier", "videoUrl",
    ];
    const payload = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) payload[key] = req.body[key];
    }

    const prevTier = vendor.tier;

    const updated = await Vendor.findByIdAndUpdate(vendorId, payload, {
      new: true,
      runValidators: false,
    });

    if (payload.tier !== undefined && payload.tier !== prevTier && updated?.userId) {
      const uid = String(updated.userId);
      if (isPaidMembershipTier(payload.tier)) {
        await setFeaturedForPaidUser(uid);
      } else if (String(payload.tier).toLowerCase() === "free") {
        await clearFeaturedForFreeUser(uid);
      }
    }

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
      const vendorLite = vendor
        ? {
            name: vendor.name ?? null,
            city: vendor.city ?? null,
            neighborhood: vendor.neighborhood ?? null,
            images: Array.isArray(vendor.images) ? vendor.images : [],
          }
        : null;
      const obj = list.toObject();
      result.push({
        ...obj,
        id: list._id.toString(),
        vendorName: vendor?.name ?? null,
        vendorCity: vendor?.city ?? null,
        vendor: vendorLite,
      });
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/*
------------------------------------------------
ADMIN DASHBOARD STATS
------------------------------------------------
*/
function adminMonthKeys(monthCount) {
  const out = [];
  const now = new Date();
  for (let i = monthCount - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    out.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  return out;
}

function docMonthKey(createdAt) {
  if (createdAt == null || createdAt === "") return null;
  const d = createdAt instanceof Date ? createdAt : new Date(createdAt);
  if (Number.isNaN(d.getTime())) return null;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

router.get("/stats", requireAdmin, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalVendors = await Vendor.countDocuments();
    const pendingVendors = await Vendor.countDocuments({ status: "pending" });
    const approvedVendors = await Vendor.countDocuments({ status: "approved" });
    const totalReviews = await Review.countDocuments();
    const totalResources = await Resource.countDocuments();
    const unreadContactMessages = await ContactMessage.countDocuments({ read: false });

    const usersByRole = {
      admin: await User.countDocuments({ role: "admin" }),
      vendor: await User.countDocuments({ role: "vendor" }),
      user: await User.countDocuments({ role: "user" }),
    };
    const usersEmailVerified = await User.countDocuments({ emailVerified: true });
    const usersEmailUnverified = Math.max(0, totalUsers - usersEmailVerified);

    const vendorsFeatured = await Vendor.countDocuments({ featured: true });
    const vendorsTierStandard = await Vendor.countDocuments({ tier: "standard" });
    const vendorsTierPremium = await Vendor.countDocuments({ tier: "premium" });
    const vendorsTierFree = Math.max(0, totalVendors - vendorsTierStandard - vendorsTierPremium);

    const totalListings = await Listing.countDocuments();
    const listingsPublished = await Listing.countDocuments({ status: "published" });
    const listingsDraft = await Listing.countDocuments({ status: "draft" });
    const listingsFeatured = await Listing.countDocuments({ featured: true });

    const STANDARD_MRR_CAD = 15;
    const PREMIUM_MRR_CAD = 20;
    const estimatedMrrCad =
      vendorsTierStandard * STANDARD_MRR_CAD + vendorsTierPremium * PREMIUM_MRR_CAD;

    const monthKeys = adminMonthKeys(6);
    const userDocs = await User.find({}, { createdAt: 1 }).lean();
    const vendorDocs = await Vendor.find({}, { createdAt: 1 }).lean();
    const listingDocs = await Listing.find({}, { createdAt: 1 }).lean();

    const countInMonth = (docs, key) =>
      docs.filter((d) => docMonthKey(d.createdAt) === key).length;

    const trendLabels = monthKeys.map((k) => {
      const [y, m] = k.split("-").map(Number);
      return new Date(y, m - 1, 1).toLocaleString("en", { month: "short" });
    });

    const trends = {
      labels: trendLabels,
      newUsers: monthKeys.map((k) => countInMonth(userDocs, k)),
      newVendors: monthKeys.map((k) => countInMonth(vendorDocs, k)),
      newListings: monthKeys.map((k) => countInMonth(listingDocs, k)),
    };

    const stripeConnected = Boolean(
      String(process.env.STRIPE_SECRET_KEY || "").trim() &&
        !String(process.env.STRIPE_SECRET_KEY || "").startsWith("pk_")
    );

    res.json({
      totalUsers,
      totalVendors,
      pendingVendors,
      approvedVendors,
      totalReviews,
      totalResources,
      unreadContactMessages,
      usersByRole,
      usersEmailVerified,
      usersEmailUnverified,
      vendorsFeatured,
      vendorsByTier: {
        free: vendorsTierFree,
        standard: vendorsTierStandard,
        premium: vendorsTierPremium,
      },
      totalListings,
      listingsPublished,
      listingsDraft,
      listingsFeatured,
      finance: {
        estimatedMrrCad,
        currency: "CAD",
        stripeConnected,
      },
      trends,
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
      "membershipEyebrow",
      "membershipTitle",
      "membershipSubtitle",
      "membershipDescFree",
      "membershipDescStandard",
      "membershipDescPremium",
      "membershipFeaturesFree",
      "membershipFeaturesStandard",
      "membershipFeaturesPremium",
      "homeTestimonialsHeading",
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
    if (req.body.homeTestimonials !== undefined) {
      const raw = req.body.homeTestimonials;
      s.homeTestimonials = Array.isArray(raw)
        ? raw
            .map((x, i) => {
              const id = String(x?.id ?? "").trim() || `t-${i}`;
              const rating = Math.min(5, Math.max(1, parseInt(String(x?.rating), 10) || 5));
              return {
                id,
                name: String(x?.name ?? "").trim(),
                time: String(x?.time ?? "").trim(),
                text: String(x?.text ?? "").trim(),
                rating,
              };
            })
            .filter((x) => x.name && x.text)
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

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;

function normalizeMarketingEmails(arr) {
  const out = [];
  const seen = new Set();
  for (const x of arr || []) {
    const e = String(x ?? "").trim().toLowerCase();
    if (!EMAIL_RE.test(e) || seen.has(e)) continue;
    seen.add(e);
    out.push(e);
  }
  return out;
}

/*
------------------------------------------------
Marketing: recipient pools + send (SMTP via nodemailer)
------------------------------------------------
*/
router.get("/marketing/recipient-pools", requireAdmin, async (req, res) => {
  try {
    const users = await User.find({}, { email: 1, role: 1, name: 1 }).lean();
    const allUserEmails = [];
    const vendorAccountEmails = [];
    for (const u of users) {
      const em = String(u.email || "").trim().toLowerCase();
      if (!EMAIL_RE.test(em)) continue;
      allUserEmails.push(em);
      if (String(u.role || "").toLowerCase() === "vendor") {
        vendorAccountEmails.push(em);
      }
    }

    const vendors = await Vendor.find({}, { email: 1, name: 1 }).lean();
    const vendorBusinessEmails = [];
    for (const v of vendors) {
      const em = String(v.email || "").trim().toLowerCase();
      if (EMAIL_RE.test(em)) vendorBusinessEmails.push(em);
    }

    const uniq = (a) => [...new Set(a)].sort();

    res.json({
      allUsers: {
        key: "allUsers",
        label: "All registered users",
        description: "Every account email in Users.",
        emails: uniq(allUserEmails),
      },
      vendorBusinesses: {
        key: "vendorBusinesses",
        label: "All vendor business emails",
        description: "Contact emails saved on vendor profiles.",
        emails: uniq(vendorBusinessEmails),
      },
      vendorAccounts: {
        key: "vendorAccounts",
        label: "Vendor account logins",
        description: "Users with the vendor role.",
        emails: uniq(vendorAccountEmails),
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/marketing/send", requireAdmin, async (req, res) => {
  try {
    const subject = String(req.body?.subject ?? "").trim();
    const text = String(req.body?.body ?? req.body?.text ?? "").trim();
    let recipients = normalizeMarketingEmails(req.body?.recipients);

    if (!subject) {
      return res.status(400).json({ message: "Subject is required." });
    }
    if (!text) {
      return res.status(400).json({ message: "Message body is required." });
    }
    if (!recipients.length) {
      return res.status(400).json({ message: "Select at least one recipient email." });
    }
    if (recipients.length > 500) {
      return res.status(400).json({ message: "Maximum 500 recipients per send." });
    }

    const result = await sendMarketingBatch({ to: recipients, subject, text });
    res.json({
      message: `Sent ${result.sent} message(s).`,
      ...result,
    });
  } catch (error) {
    if (error.code === "MAIL_NOT_CONFIGURED") {
      return res.status(503).json({
        message:
          "Email is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, and MAIL_FROM on the server.",
      });
    }
    res.status(500).json({ message: error.message || "Failed to send email." });
  }
});

export default router;