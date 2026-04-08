import express from "express";
import mongoose from "mongoose";
import Review from "../models/Review.js";
import Listing from "../models/Listing.js";
import User from "../models/User.js";
import SiteSettings from "../models/SiteSettings.js";
import { requireAuth } from "../middleware/auth.js";
import { sendTransactionalMail } from "../utils/mail.js";
import {
  findReviewsForListingSorted,
  serializeReviewForApi,
  matchExistingReviewForUser,
} from "../utils/reviewListingQuery.js";
import { vendorMayReplyToReviews } from "../utils/listingTierCaps.js";

const router = express.Router();

function isValidObjectId(id) {
  return id && typeof id === "string" && id !== "undefined" && mongoose.Types.ObjectId.isValid(id);
}

async function sendReviewNotificationEmail(vendorUser, listing, review, reviewerName) {
  try {
    if (!vendorUser?.email) return;

    const settings = await SiteSettings.findById("default").lean();
    const subject = String(settings?.reviewNotificationEmailSubject || "").trim();
    const bodyTemplate = String(settings?.reviewNotificationEmailBody || "").trim();

    if (!subject || !bodyTemplate) return;

    const listingUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/listing/${listing._id}`;
    const vendorName = vendorUser.name || "Vendor";
    const listingTitle = listing.title || "Listing";
    const reviewText = review.comment || "";
    const reviewRating = review.rating || 0;

    const body = bodyTemplate
      .replace(/{vendorName}/g, vendorName)
      .replace(/{listingTitle}/g, listingTitle)
      .replace(/{reviewerName}/g, reviewerName)
      .replace(/{reviewText}/g, reviewText)
      .replace(/{reviewRating}/g, String(reviewRating))
      .replace(/{listingUrl}/g, listingUrl);

    const emailSubject = subject
      .replace(/{vendorName}/g, vendorName)
      .replace(/{listingTitle}/g, listingTitle)
      .replace(/{reviewerName}/g, reviewerName);

    await sendTransactionalMail({
      to: vendorUser.email,
      subject: emailSubject,
      text: body,
    });
  } catch (err) {
    console.error("Failed to send review notification email:", err?.message || err);
  }
}

router.get("/listings/:listingId", async (req, res) => {
  const rows = await findReviewsForListingSorted(req.params.listingId);
  res.json(rows.map(serializeReviewForApi));
});

router.post("/listings/:listingId", requireAuth, async (req, res) => {
  const { listingId } = req.params;
  let listingDoc;
  try {
    if (!isValidObjectId(listingId)) return res.status(400).json({ message: "Invalid listing id" });

    listingDoc = await Listing.findById(listingId);
    if (!listingDoc) return res.status(404).json({ message: "Listing not found" });

    const ownerId = listingDoc.userId ? String(listingDoc.userId) : "";
    if (ownerId && ownerId === req.user._id.toString()) {
      return res.status(403).json({
        message: "You cannot review your own listing.",
      });
    }

    const canonicalListingId = listingDoc._id.toString();
    const uid = req.user._id.toString();

    const { rating, comment } = req.body;
    const commentTrim = String(comment ?? "").trim();
    if (!commentTrim) {
      return res.status(400).json({ message: "Please enter a review comment." });
    }
    const ratingN = Math.max(1, Math.min(5, Number(rating) || 5));

    const existing = await Review.findOne(matchExistingReviewForUser(canonicalListingId, uid));
    if (existing) {
      existing.rating = ratingN;
      existing.comment = commentTrim;
      existing.userName = req.user.name;
      await existing.save();
      return res.json(serializeReviewForApi(existing));
    }

    const review = await Review.create({
      listingId: canonicalListingId,
      userId: uid,
      userName: req.user.name,
      rating: ratingN,
      comment: commentTrim,
      createdAt: new Date().toISOString(),
    });

    if (ownerId) {
      const vendorUser = await User.findById(ownerId).lean();
      await sendReviewNotificationEmail(vendorUser, listingDoc, review, req.user.name);
    }

    res.json(serializeReviewForApi(review));
  } catch (err) {
    if (err && err.code === 11000) {
      const lid = listingDoc?._id?.toString?.() ?? String(listingId || "").trim();
      const dup = await Review.findOne(matchExistingReviewForUser(lid, req.user._id.toString()));
      if (dup) {
        const commentTrim = String(req.body?.comment ?? "").trim();
        if (!commentTrim) {
          return res.status(400).json({ message: "Please enter a review comment." });
        }
        const ratingN = Math.max(1, Math.min(5, Number(req.body?.rating) || 5));
        dup.rating = ratingN;
        dup.comment = commentTrim;
        dup.userName = req.user.name;
        await dup.save();
        return res.json(serializeReviewForApi(dup));
      }
    }
    res.status(500).json({ message: err.message || "Failed to save review" });
  }
});

router.put("/:reviewId/reply", requireAuth, async (req, res) => {
  const { reviewId } = req.params;
  if (!isValidObjectId(reviewId)) return res.status(400).json({ message: "Invalid review id" });

  const review = await Review.findById(reviewId);
  if (!review) return res.status(404).json({ message: "Review not found" });

  const listing = await Listing.findById(review.listingId);
  if (!listing) return res.status(404).json({ message: "Listing not found" });

  if (listing.userId !== req.user._id.toString() && req.user.role !== "admin") {
    return res.status(403).json({ message: "Not authorized" });
  }

  if (req.user.role !== "admin" && !vendorMayReplyToReviews(listing.tier)) {
    return res.status(403).json({ message: "Review replies require Standard or Gold membership." });
  }

  review.reply = req.body.reply;
  await review.save();
  res.json(review);
});

export default router;
