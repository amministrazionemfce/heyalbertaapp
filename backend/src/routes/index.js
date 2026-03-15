import express from "express";
import authRoutes from "./auth.routes.js";
import vendorRoutes from "./vendor.routes.js";
import reviewRoutes from "./review.routes.js";
import resourceRoutes from "./resource.routes.js";
import adminRoutes from "./admin.routes.js";
import listingRoutes from "./listing.routes.js";
import { requireAuth } from "../middleware/auth.js";
import Vendor from "../models/Vendor.js";

const router = express.Router();

router.get("/my-vendors", requireAuth, async (req, res) => {
  try {
    const vendors = await Vendor.find({ userId: req.user._id.toString() }).sort({ createdAt: -1 });
    res.json(vendors);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch vendors" });
  }
});

router.use("/auth", authRoutes);
router.use("/vendors", vendorRoutes);
router.use("/reviews", reviewRoutes);
router.use("/resources", resourceRoutes);
router.use("/admin", adminRoutes);
router.use("/listings", listingRoutes);

export default router;