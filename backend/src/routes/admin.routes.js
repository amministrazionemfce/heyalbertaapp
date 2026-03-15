import express from "express";
import mongoose from "mongoose";
import { requireAdmin } from "../middleware/admin.js";

import Vendor from "../models/Vendor.js";
import Review from "../models/Review.js";
import User from "../models/User.js";
import Resource from "../models/Resource.js";

const router = express.Router();

function isValidObjectId(id) {
  return id && typeof id === "string" && id !== "undefined" && mongoose.Types.ObjectId.isValid(id);
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
      const reviews = await Review.find({ vendorId: vendorIdStr });

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

    res.json({
      totalUsers,
      totalVendors,
      pendingVendors,
      approvedVendors,
      totalReviews,
      totalResources
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


export default router;