import { requireAuth } from "./auth.js";

export const requireAdmin = async (req, res, next) => {
  await requireAuth(req, res, () => {});
  if (!req.user) {
    return;
  }
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
};