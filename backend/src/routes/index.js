import express from "express";
import { maintenanceModeGuard } from "../middleware/maintenanceMode.js";
import authRoutes from "./auth.routes.js";
import reviewRoutes from "./review.routes.js";
import resourceRoutes from "./resource.routes.js";
import siteRoutes from "./site.routes.js";
import adminRoutes from "./admin.routes.js";
import listingRoutes from "./listing.routes.js";
import uploadRoutes from "./upload.routes.js";
import contactRoutes from "./contact.routes.js";
import billingRoutes from "./billing.routes.js";
import newsSubscribeRoutes from "./newsSubscribe.routes.js";

const router = express.Router();

router.use(maintenanceModeGuard);

router.use("/auth", authRoutes);
router.use("/uploads", uploadRoutes);
router.use("/reviews", reviewRoutes);
router.use("/resources", resourceRoutes);
router.use("/site-settings", siteRoutes);
router.use("/admin", adminRoutes);
router.use("/listings", listingRoutes);
router.use("/contact", contactRoutes);
router.use("/news-subscribe", newsSubscribeRoutes);
router.use("/billing", billingRoutes);

export default router;
