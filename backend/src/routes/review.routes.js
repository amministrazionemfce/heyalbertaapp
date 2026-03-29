import express from "express";
import mongoose from "mongoose";
import Review from "../models/Review.js";
import Vendor from "../models/Vendor.js";
import { requireAuth } from "../middleware/auth.js";
import {
  findReviewsForVendorSorted,
  serializeReviewForApi,
  matchExistingReviewForUser,
} from "../utils/reviewVendorQuery.js";
import { vendorMayReplyToReviews } from "../utils/listingTierCaps.js";

const router = express.Router();

function isValidObjectId(id) {
  return id && typeof id === "string" && id !== "undefined" && mongoose.Types.ObjectId.isValid(id);
}

router.get("/vendors/:vendorId", async (req, res) => {
  const rows = await findReviewsForVendorSorted(req.params.vendorId);
  res.json(rows.map(serializeReviewForApi));
});

router.post("/vendors/:vendorId", requireAuth, async (req, res) => {
  const { vendorId } = req.params;
  let vendor;
  try {
    if (!isValidObjectId(vendorId))
      return res.status(400).json({ message: "Invalid vendor id" });

    vendor = await Vendor.findById(vendorId);
    if (!vendor)
      return res.status(404).json({ message: "Vendor not found" });

    const ownerId = vendor.userId ? String(vendor.userId) : "";
    if (ownerId && ownerId === req.user._id.toString()) {
      return res.status(403).json({
        message: "You cannot review your own business.",
      });
    }

    const canonicalVendorId = vendor._id.toString();
    const uid = req.user._id.toString();

    const { rating, comment } = req.body;
    const commentTrim = String(comment ?? "").trim();
    if (!commentTrim) {
      return res.status(400).json({ message: "Please enter a review comment." });
    }
    const ratingN = Math.max(1, Math.min(5, Number(rating) || 5));

    /** One review per user per vendor: update in place instead of 409 (better UX). */
    const existing = await Review.findOne(matchExistingReviewForUser(canonicalVendorId, uid));
    if (existing) {
      existing.rating = ratingN;
      existing.comment = commentTrim;
      existing.userName = req.user.name;
      await existing.save();
      return res.json(serializeReviewForApi(existing));
    }

    const review = await Review.create({
      vendorId: canonicalVendorId,
      userId: uid,
      userName: req.user.name,
      rating: ratingN,
      comment: commentTrim,
      createdAt: new Date().toISOString(),
    });
    res.json(serializeReviewForApi(review));
  } catch (err) {
    if (err && err.code === 11000) {
      const vid = vendor?._id?.toString?.() ?? String(vendorId || "").trim();
      const dup = await Review.findOne(matchExistingReviewForUser(vid, req.user._id.toString()));
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
  if (!isValidObjectId(reviewId))
    return res.status(400).json({ message: "Invalid review id" });

  const review = await Review.findById(reviewId);
  if (!review)
    return res.status(404).json({ message: "Review not found" });

  const vendor = await Vendor.findById(review.vendorId);
  if (!vendor)
    return res.status(404).json({ message: "Vendor not found" });

  if (vendor.userId !== req.user._id.toString() && req.user.role !== "admin")
    return res.status(403).json({ message: "Not authorized" });

  if (req.user.role !== "admin" && !vendorMayReplyToReviews(vendor.tier)) {
    return res.status(403).json({ message: "Review replies require Standard or Gold membership." });
  }

  review.reply = req.body.reply;
  await review.save();
  res.json(review);
});

export default router;