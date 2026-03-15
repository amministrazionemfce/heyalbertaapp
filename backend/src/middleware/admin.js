import { requireAuth } from "./auth.js";

export const requireAdmin = async (req, res, next) => {
  try {

    await requireAuth(req, res, () => {});

    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    next();

  } catch (error) {
    res.status(401).json({ message: "Unauthorized" });
  }
};