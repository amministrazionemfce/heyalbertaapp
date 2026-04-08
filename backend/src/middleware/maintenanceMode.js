import SiteSettings from "../models/SiteSettings.js";
import { verifyToken } from "../utils/jwt.js";

function jwtPayload(req) {
  const auth = req.headers.authorization;
  if (!auth || !String(auth).startsWith("Bearer ")) return null;
  try {
    return verifyToken(String(auth).replace(/^Bearer\s+/i, ""));
  } catch {
    return null;
  }
}

async function getMaintenanceFromDb() {
  const doc = await SiteSettings.findById("default").select("maintenanceMode maintenanceMessage").lean();
  return {
    on: Boolean(doc?.maintenanceMode),
    message: String(doc?.maintenanceMessage || "").trim(),
  };
}

/**
 * When maintenance is on, block API for non-admins except allowlisted public/auth routes.
 * Admins bypass using JWT `role: "admin"` (no extra DB round-trip).
 */
export async function maintenanceModeGuard(req, res, next) {
  try {
    if (req.method === "OPTIONS") return next();

    const { on, message } = await getMaintenanceFromDb();
    if (!on) return next();

    const payload = jwtPayload(req);
    if (payload?.role === "admin") return next();

    const p = req.path || "";
    const allow =
      (req.method === "GET" && (p === "/site-settings" || p === "/site-settings/")) ||
      (req.method === "POST" && (p === "/auth/login" || p === "/auth/login/")) ||
      (req.method === "GET" && (p === "/auth/me" || p === "/auth/me/"));

    if (allow) return next();

    return res.status(503).json({
      code: "MAINTENANCE",
      message:
        message ||
        "The site is temporarily undergoing maintenance. Please try again later.",
    });
  } catch (err) {
    return next(err);
  }
}
