import express from "express";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import Stripe from "stripe";
import { requireAdmin } from "../middleware/admin.js";

import Listing from "../models/Listing.js";
import Review from "../models/Review.js";
import User from "../models/User.js";
import Resource from "../models/Resource.js";
import CityImage from "../models/CityImage.js";
import CategoryImage from "../models/CategoryImage.js";
import SiteSettings from "../models/SiteSettings.js";
import ContactMessage from "../models/ContactMessage.js";
import NewsSubscriber from "../models/NewsSubscriber.js";
import { matchReviewsByListingId } from "../utils/reviewListingQuery.js";
import { sendMarketingBatch, sendTransactionalMail, isMailConfigured } from "../utils/mail.js";
import { createImpersonationToken } from "../utils/jwt.js";

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

function escapeRegex(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const ASSIGNABLE_ROLES = new Set(["user", "vendor", "admin"]);

async function assertAdminPassword(adminUser, adminPassword) {
  const pw = String(adminPassword ?? "").trim();
  if (!pw) {
    return { ok: false, status: 400, message: "Admin password is required." };
  }
  const valid = await bcrypt.compare(pw, adminUser.passwordHash);
  if (!valid) {
    return { ok: false, status: 401, message: "Incorrect admin password." };
  }
  return { ok: true };
}

async function deleteUserListingData(userId) {
  const uid = String(userId ?? "").trim();
  if (!uid) return;
  const listings = await Listing.find({ userId: uid }).select("_id");
  for (const l of listings) {
    await Review.deleteMany(matchReviewsByListingId(l._id.toString()));
  }
  await Listing.deleteMany({ userId: uid });
}

/*
------------------------------------------------
GET ALL LISTINGS (Admin panel)
------------------------------------------------
*/
router.get("/listings", requireAdmin, async (req, res) => {
  try {
    const { status, sellerStatus } = req.query;
    const query = {};
    if (status) query.status = status;
    if (sellerStatus) query.sellerStatus = sellerStatus;

    const listings = await Listing.find(query).sort({ createdAt: -1 });
    const result = listings.map((list) => {
      const obj = list.toObject();
      const business = String(list.businessName || "").trim();
      const displaySellerName = business || list.title || null;
      return {
        ...obj,
        id: list._id.toString(),
        userId: list.userId ?? null,
        businessName: business || "",
        sellerTitle: displaySellerName,
        sellerCity: list.city ?? null,
        seller: {
          userId: list.userId ?? null,
          title: list.title ?? null,
          businessName: business,
          name: displaySellerName,
          city: list.city ?? null,
          neighborhood: list.neighborhood ?? null,
          images: Array.isArray(list.images) ? list.images : [],
        },
      };
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/*
------------------------------------------------
LISTING REVIEWS (Admin panel)
------------------------------------------------
*/
router.get("/reviews", requireAdmin, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;
    const q = String(req.query.q || "").trim();
    const listingId = String(req.query.listingId || "").trim();

    const baseMatch = {};
    if (listingId && isValidObjectId(listingId)) {
      baseMatch.listingId = listingId;
    }

    const listingsColl = Listing.collection?.collectionName || "listings";
    const rx = q ? new RegExp(escapeRegex(q), "i") : null;

    const withListingLookup = [
      { $match: baseMatch },
      { $sort: { createdAt: -1 } },
      {
        $lookup: {
          from: listingsColl,
          let: { lid: "$listingId" },
          pipeline: [
            { $match: { $expr: { $eq: [{ $toString: "$_id" }, "$$lid"] } } },
            { $project: { title: 1, businessName: 1, userId: 1, categoryId: 1 } },
          ],
          as: "_listing",
        },
      },
      { $addFields: { _listing: { $arrayElemAt: ["$_listing", 0] } } },
      ...(rx
        ? [
            {
              $match: {
                $or: [
                  { userName: rx },
                  { comment: rx },
                  { reply: rx },
                  { listingId: rx },
                  { "_listing.title": rx },
                  { "_listing.businessName": rx },
                ],
              },
            },
          ]
        : []),
    ];

    const [rows, total] = await Promise.all([
      Review.aggregate([
        ...withListingLookup,
        { $skip: skip },
        { $limit: limit },
        {
          $project: {
            id: { $toString: "$_id" },
            listingId: 1,
            userId: 1,
            userName: 1,
            rating: 1,
            comment: 1,
            reply: 1,
            createdAt: 1,
            listingTitle: { $ifNull: ["$_listing.title", null] },
            listingBusinessName: { $ifNull: ["$_listing.businessName", ""] },
            listingOwnerId: { $ifNull: ["$_listing.userId", null] },
            listingCategoryId: { $ifNull: ["$_listing.categoryId", null] },
          },
        },
      ]),
      Review.aggregate([...withListingLookup, { $count: "n" }]).then((r) => r?.[0]?.n ?? 0),
    ]);

    res.json({
      reviews: rows,
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.patch("/reviews/:reviewId", requireAdmin, async (req, res) => {
  try {
    const { reviewId } = req.params;
    if (!isValidObjectId(reviewId)) {
      return res.status(400).json({ message: "Invalid review id" });
    }
    const patch = {};
    if (req.body?.rating !== undefined) {
      patch.rating = Math.max(1, Math.min(5, Number(req.body.rating) || 5));
    }
    if (req.body?.comment !== undefined) {
      const c = String(req.body.comment ?? "").trim();
      if (!c) return res.status(400).json({ message: "Comment cannot be empty." });
      patch.comment = c;
    }
    if (req.body?.reply !== undefined) {
      const rep = String(req.body.reply ?? "").trim();
      patch.reply = rep ? rep : null;
    }
    const updated = await Review.findByIdAndUpdate(reviewId, patch, { new: true });
    if (!updated) return res.status(404).json({ message: "Review not found" });
    res.json(updated.toJSON());
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete("/reviews/:reviewId", requireAdmin, async (req, res) => {
  try {
    const { reviewId } = req.params;
    if (!isValidObjectId(reviewId)) {
      return res.status(400).json({ message: "Invalid review id" });
    }
    const deleted = await Review.findByIdAndDelete(reviewId);
    if (!deleted) return res.status(404).json({ message: "Review not found" });
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/*
------------------------------------------------
Moderate listing (seller approval)
------------------------------------------------
*/
router.put("/listings/:listingId/moderation", requireAdmin, async (req, res) => {
  try {
    const { listingId } = req.params;
    if (!isValidObjectId(listingId)) {
      return res.status(400).json({ message: "Invalid listing id" });
    }
    const sellerStatus = String(req.body?.sellerStatus || "").trim();
    if (!["pending", "approved", "rejected"].includes(sellerStatus)) {
      return res.status(400).json({ message: "sellerStatus must be pending, approved, or rejected" });
    }
    const listing = await Listing.findByIdAndUpdate(listingId, { sellerStatus }, { new: true });
    if (!listing) return res.status(404).json({ message: "Listing not found" });
    res.json({ message: "Listing updated", listing });
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
    const ownerAgg = await Listing.aggregate([{ $group: { _id: "$userId" } }, { $count: "n" }]);
    const totalVendors = ownerAgg[0]?.n ?? 0;
    const pendingVendors = await Listing.countDocuments({ sellerStatus: "pending" });
    const approvedVendors = await Listing.countDocuments({ sellerStatus: "approved" });
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

    const listingsFeatured = await Listing.countDocuments({ featured: true });
    // Back-compat: older frontend expects `vendorsFeatured` even though this is really featured listings.
    const vendorsFeatured = listingsFeatured;
    const vendorsTierStandard = await Listing.countDocuments({ tier: "standard" });
    const vendorsTierPremium = await Listing.countDocuments({ tier: "premium" });
    const totalListings = await Listing.countDocuments();
    const vendorsTierFree = Math.max(0, totalListings - vendorsTierStandard - vendorsTierPremium);

    const listingsPublished = await Listing.countDocuments({ status: "published" });
    const listingsDraft = await Listing.countDocuments({ status: "draft" });

    const stripeKey = String(process.env.STRIPE_SECRET_KEY || "").trim();
    const stripeConnected = Boolean(stripeKey && !stripeKey.startsWith("pk_"));
    const stripe = stripeConnected ? new Stripe(stripeKey) : null;

    // Finance: real Stripe balance + revenue (when configured).
    let finance = {
      stripeConnected,
      currency: null,
      availableBalance: null,
      pendingBalance: null,
      revenueLast30Days: null,
      revenueLast6MonthsByMonth: [],
    };

    const monthKeys = adminMonthKeys(6);
    const userDocs = await User.find({}, { createdAt: 1 }).lean();
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
      newVendors: monthKeys.map((k) => countInMonth(listingDocs, k)),
      newListings: monthKeys.map((k) => countInMonth(listingDocs, k)),
    };

    if (stripe) {
      try {
        const bal = await stripe.balance.retrieve();
        const available = Array.isArray(bal?.available) ? bal.available : [];
        const pending = Array.isArray(bal?.pending) ? bal.pending : [];
        const pickCurrency = (arr) => String(arr?.[0]?.currency || "").toUpperCase() || null;
        const cur = pickCurrency(available) || pickCurrency(pending);
        const sum = (arr) =>
          (Array.isArray(arr) ? arr : []).reduce((acc, x) => acc + (Number(x?.amount) || 0), 0);
        finance.currency = cur;
        finance.availableBalance = sum(available) / 100;
        finance.pendingBalance = sum(pending) / 100;

        const now = Math.floor(Date.now() / 1000);
        const gte6m = Math.floor(
          new Date(new Date().getFullYear(), new Date().getMonth() - 5, 1).getTime() / 1000
        );
        const revenueCentsByKey = new Map(monthKeys.map((k) => [k, 0]));

        let startingAfter = undefined;
        while (true) {
          const page = await stripe.charges.list({
            limit: 100,
            ...(startingAfter ? { starting_after: startingAfter } : {}),
            created: { gte: gte6m, lte: now },
          });
          const charges = Array.isArray(page?.data) ? page.data : [];
          for (const c of charges) {
            if (!c || c.paid !== true) continue;
            if (c.status && c.status !== "succeeded") continue;
            const key = docMonthKey(new Date((c.created || 0) * 1000));
            if (!key || !revenueCentsByKey.has(key)) continue;
            revenueCentsByKey.set(key, (revenueCentsByKey.get(key) || 0) + (Number(c.amount) || 0));
            if (!finance.currency && c.currency) finance.currency = String(c.currency).toUpperCase();
          }
          if (!page?.has_more || charges.length === 0) break;
          startingAfter = charges[charges.length - 1].id;
        }
        finance.revenueLast6MonthsByMonth = monthKeys.map((k) => (revenueCentsByKey.get(k) || 0) / 100);

        const gte30d = Math.floor((Date.now() - 30 * 24 * 3600 * 1000) / 1000);
        let last30 = 0;
        startingAfter = undefined;
        while (true) {
          const page = await stripe.charges.list({
            limit: 100,
            ...(startingAfter ? { starting_after: startingAfter } : {}),
            created: { gte: gte30d, lte: now },
          });
          const charges = Array.isArray(page?.data) ? page.data : [];
          for (const c of charges) {
            if (!c || c.paid !== true) continue;
            if (c.status && c.status !== "succeeded") continue;
            last30 += Number(c.amount) || 0;
          }
          if (!page?.has_more || charges.length === 0) break;
          startingAfter = charges[charges.length - 1].id;
        }
        finance.revenueLast30Days = last30 / 100;
      } catch (e) {
        finance = { ...finance, error: e?.message || "finance_unavailable" };
      }
    }

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
      finance,
      trends,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


/*
------------------------------------------------
USERS (paginated, sortable, filterable) + bulk email + bulk delete
------------------------------------------------
*/
const USER_SORT_FIELDS = new Set(["name", "role", "email", "createdAt", "lastActiveAt"]);

/*
------------------------------------------------
NOTIFICATIONS: new users since last seen (admin)
------------------------------------------------
*/
router.get("/notifications/users", requireAdmin, async (req, res) => {
  try {
    const sinceIdRaw = String(req.query.sinceId || "").trim();
    const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit || "10"), 10) || 10));
    const q = String(req.query.q ?? "").trim();

    const filter = {};
    if (sinceIdRaw && isValidObjectId(sinceIdRaw)) {
      filter._id = { $gt: new mongoose.Types.ObjectId(sinceIdRaw) };
    }
    if (q) {
      const rx = new RegExp(escapeRegex(q), "i");
      filter.$or = [{ name: rx }, { email: rx }];
    }

    const users = await User.find(filter, { passwordHash: 0 })
      .sort({ _id: -1 })
      .limit(limit)
      .lean();

    res.json({
      users,
      newestId: users.length ? String(users[0]._id) : null,
      count: users.length,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

function membershipRankFromTierString(t) {
  const s = String(t || "").toLowerCase();
  if (s === "premium" || s === "gold") return 2;
  if (s === "standard") return 1;
  return 0;
}

function membershipStatusFromRank(rank) {
  if (rank >= 2) return "premium";
  if (rank >= 1) return "standard";
  return "free";
}

router.get("/users", requireAdmin, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(String(req.query.page || "1"), 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit || "20"), 10) || 20));
    const q = String(req.query.q ?? "").trim();
    const roleFilter = String(req.query.roleFilter ?? "all").toLowerCase();
    const membershipFilter = String(req.query.membershipFilter ?? "all").toLowerCase();
    const sortFieldRaw = String(req.query.sort ?? "name").toLowerCase();
    const orderRaw = String(req.query.order ?? "asc").toLowerCase();
    const sortDir = orderRaw === "desc" ? -1 : 1;
    const sortField = USER_SORT_FIELDS.has(sortFieldRaw) ? sortFieldRaw : "name";

    const andParts = [];
    if (q) {
      const rx = new RegExp(escapeRegex(q), "i");
      andParts.push({ $or: [{ name: rx }, { email: rx }] });
    }
    if (roleFilter === "user") andParts.push({ role: "user" });
    else if (roleFilter === "vendor") andParts.push({ role: "vendor" });

    if (membershipFilter === "featured") {
      const paidListingUserIds = await Listing.distinct("userId", {
        tier: { $in: ["standard", "premium", "gold"] },
      });
      const oids = paidListingUserIds
        .map((id) => String(id).trim())
        .filter(isValidObjectId)
        .map((id) => new mongoose.Types.ObjectId(id));
      const paidOr = [{ billingTier: { $in: ["standard", "premium"] } }];
      if (oids.length) paidOr.push({ _id: { $in: oids } });
      andParts.push({ $or: paidOr });
    }

    let filter = {};
    if (andParts.length === 1) {
      filter = andParts[0];
    } else if (andParts.length > 1) {
      filter = { $and: andParts };
    }

    const sort = { [sortField]: sortDir };
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find(filter, { passwordHash: 0 }).sort(sort).skip(skip).limit(limit).lean(),
      User.countDocuments(filter),
    ]);

    const userIds = users.map((u) => String(u._id));
    const countByUserId = new Map();
    const listingTierRankByUser = new Map();
    if (userIds.length) {
      const rows = await Listing.aggregate([
        { $match: { userId: { $in: userIds } } },
        { $group: { _id: "$userId", count: { $sum: 1 }, tiers: { $push: "$tier" } } },
      ]);
      for (const row of rows) {
        countByUserId.set(String(row._id), row.count);
        let maxR = 0;
        for (const t of row.tiers || []) {
          maxR = Math.max(maxR, membershipRankFromTierString(t));
        }
        listingTierRankByUser.set(String(row._id), maxR);
      }
    }
    const usersWithListingCounts = users.map((u) => {
      const uid = String(u._id);
      const billingR = membershipRankFromTierString(u.billingTier);
      const listingR = listingTierRankByUser.get(uid) || 0;
      const effectiveR = Math.max(billingR, listingR);
      return {
        ...u,
        listingsCount: countByUserId.get(uid) || 0,
        membershipStatus: membershipStatusFromRank(effectiveR),
      };
    });

    res.json({
      users: usersWithListingCounts,
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.patch("/users/:userId/role", requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    if (!isValidObjectId(userId)) {
      return res.status(400).json({ message: "Invalid user id." });
    }
    const newRole = String(req.body?.role ?? "").trim();
    if (!ASSIGNABLE_ROLES.has(newRole)) {
      return res.status(400).json({ message: "Invalid role." });
    }
    const adminCheck = await assertAdminPassword(req.user, req.body?.adminPassword);
    if (!adminCheck.ok) {
      return res.status(adminCheck.status).json({ message: adminCheck.message });
    }

    if (String(req.user._id) === String(userId)) {
      return res.status(400).json({ message: "You cannot change your own role from this panel." });
    }

    const target = await User.findById(userId);
    if (!target) {
      return res.status(404).json({ message: "User not found." });
    }

    if (String(target.role) === "admin" && newRole !== "admin") {
      const adminCount = await User.countDocuments({ role: "admin" });
      if (adminCount <= 1) {
        return res.status(400).json({ message: "Cannot remove the last admin role." });
      }
    }

    target.role = newRole;
    await target.save();

    const updated = await User.findById(userId, { passwordHash: 0 }).lean();
    res.json({ user: updated, message: "Role updated." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/users/:userId/impersonate", requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    if (!isValidObjectId(userId)) {
      return res.status(400).json({ message: "Invalid user id." });
    }
    const adminCheck = await assertAdminPassword(req.user, req.body?.adminPassword);
    if (!adminCheck.ok) {
      return res.status(adminCheck.status).json({ message: adminCheck.message });
    }

    const targetDoc = await User.findById(userId);
    if (!targetDoc) {
      return res.status(404).json({ message: "User not found." });
    }
    if (String(targetDoc.role) === "admin") {
      return res.status(400).json({ message: "Impersonating admin accounts is not allowed." });
    }

    const token = createImpersonationToken(
      String(targetDoc._id),
      String(targetDoc.role),
      String(req.user._id)
    );

    res.json({
      token,
      user: targetDoc.toJSON(),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/users/email", requireAdmin, async (req, res) => {
  try {
    const rawIds = Array.isArray(req.body?.userIds) ? req.body.userIds : [];
    const subject = String(req.body?.subject ?? "").trim();
    const text = String(req.body?.body ?? req.body?.text ?? "").trim();

    if (!subject) {
      return res.status(400).json({ message: "Subject is required." });
    }
    if (!text) {
      return res.status(400).json({ message: "Message body is required." });
    }

    const ids = [...new Set(rawIds.map((x) => String(x ?? "").trim()).filter(isValidObjectId))];
    if (!ids.length) {
      return res.status(400).json({ message: "Select at least one user." });
    }
    if (ids.length > 500) {
      return res.status(400).json({ message: "Maximum 500 users per send." });
    }

    const found = await User.find({ _id: { $in: ids } }, { email: 1 }).lean();
    const recipients = normalizeMarketingEmails(found.map((u) => u.email));
    if (!recipients.length) {
      return res.status(400).json({ message: "No valid recipient emails for the selected users." });
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

router.post("/users/bulk-delete", requireAdmin, async (req, res) => {
  try {
    const rawIds = Array.isArray(req.body?.userIds) ? req.body.userIds : [];
    const adminId = req.user._id.toString();
    const results = { deleted: 0, skipped: [], errors: [] };

    const seen = new Set();
    for (const raw of rawIds) {
      const id = String(raw ?? "").trim();
      if (!id || seen.has(id)) continue;
      seen.add(id);

      if (!isValidObjectId(id)) {
        results.skipped.push({ id, reason: "invalid_id" });
        continue;
      }
      if (id === adminId) {
        results.skipped.push({ id, reason: "cannot_delete_self" });
        continue;
      }

      try {
        const user = await User.findById(id);
        if (!user) {
          results.skipped.push({ id, reason: "not_found" });
          continue;
        }
        if (user.role === "admin") {
          results.skipped.push({ id, reason: "cannot_delete_admin" });
          continue;
        }

        await deleteUserListingData(id);
        await User.findByIdAndDelete(id);
        results.deleted += 1;
      } catch (e) {
        results.errors.push({ id, message: e?.message || String(e) });
      }
    }

    res.json(results);
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
      if (d?.cityName) {
        out[String(d.cityName).toLowerCase()] = String(d.imageUrl || "").trim();
      }
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
      "membershipPriceStandardMonthlyUsd",
      "membershipPriceStandardYearlyUsd",
      "membershipPricePremiumMonthlyUsd",
      "membershipPricePremiumYearlyUsd",
      "homeTestimonialsHeading",
      "emailVerificationEmailSubject",
      "emailVerificationEmailBody",
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

router.post("/contact-messages/:id/reply", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid id" });
    }
    if (!isMailConfigured()) {
      return res.status(503).json({ message: "Email is not configured on this server." });
    }

    const doc = await ContactMessage.findById(id).lean();
    if (!doc) return res.status(404).json({ message: "Message not found" });

    const to = String(doc.email || "").trim();
    if (!EMAIL_RE.test(to)) {
      return res.status(400).json({ message: "Message has no valid recipient email." });
    }

    const subject = String(req.body?.subject || "").trim();
    const text = String(req.body?.text || "").trim();
    if (!subject) return res.status(400).json({ message: "Subject is required." });
    if (!text) return res.status(400).json({ message: "Message is required." });

    await sendTransactionalMail({ to, subject, text });
    res.json({ ok: true });
  } catch (error) {
    const msg = error?.code === "MAIL_NOT_CONFIGURED" ? "Email is not configured on this server." : error.message;
    res.status(500).json({ message: msg });
  }
});

/*
------------------------------------------------
News page — email subscribers
------------------------------------------------
*/
router.get("/news-subscribers", requireAdmin, async (req, res) => {
  try {
    const rows = await NewsSubscriber.find({})
      .sort({ createdAt: -1 })
      .lean();
    res.json(
      rows.map((r) => ({
        email: r.email,
        createdAt: r.createdAt,
      }))
    );
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
    for (const u of users) {
      const em = String(u.email || "").trim().toLowerCase();
      if (!EMAIL_RE.test(em)) continue;
      allUserEmails.push(em);
    }

    const listingEmails = await Listing.find(
      { email: { $exists: true, $nin: [null, ""] } },
      { email: 1 }
    ).lean();
    const vendorBusinessEmails = [];
    for (const row of listingEmails) {
      const em = String(row.email || "").trim().toLowerCase();
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