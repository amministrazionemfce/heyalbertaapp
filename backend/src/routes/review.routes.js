import express from "express";
import mongoose from "mongoose";
import Review from "../models/Review.js";
import Vendor from "../models/Vendor.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

function isValidObjectId(id) {
  return id && typeof id === "string" && id !== "undefined" && mongoose.Types.ObjectId.isValid(id);
}

router.get("/vendors/:vendorId", async (req, res) => {
  const reviews = await Review.find({ vendorId: req.params.vendorId })
    .sort({ createdAt: -1 });
  res.json(reviews);
});

router.post("/vendors/:vendorId", requireAuth, async (req, res) => {
  const { vendorId } = req.params;
  if (!isValidObjectId(vendorId))
    return res.status(400).json({ message: "Invalid vendor id" });

  const vendor = await Vendor.findById(vendorId);
  if (!vendor)
    return res.status(404).json({ message: "Vendor not found" });

  const { rating, comment } = req.body;
  const review = await Review.create({
    vendorId,
    userId: req.user._id.toString(),
    userName: req.user.name,
    rating: Math.max(1, Math.min(5, Number(rating) || 5)),
    comment: comment || "",
    createdAt: new Date().toISOString()
  });
  res.json(review);
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

  review.reply = req.body.reply;
  await review.save();
  res.json(review);
});

export default router;