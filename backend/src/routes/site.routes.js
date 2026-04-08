import express from "express";
import SiteSettings from "../models/SiteSettings.js";
import SystemNotification from "../models/SystemNotification.js";

const router = express.Router();

async function getOrCreateSiteSettings() {
  let doc = await SiteSettings.findById("default");
  if (!doc) {
    doc = await SiteSettings.create({ _id: "default" });
  }
  return doc;
}

/** Public read for News page hero, etc. */
router.get("/", async (req, res) => {
  try {
    const s = await getOrCreateSiteSettings();
    res.json(s.toJSON());
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/** Public: current system notification (navbar banner). */
router.get("/system-notification", async (_req, res) => {
  try {
    const now = new Date();
    const doc = await SystemNotification.findOne({
      enabled: true,
      $and: [
        { $or: [{ startsAt: null }, { startsAt: { $lte: now } }] },
        { $or: [{ endsAt: null }, { endsAt: { $gt: now } }] },
      ],
    })
      .sort({ updatedAt: -1 })
      .lean();

    if (!doc) return res.json({ ok: true, notification: null });
    res.json({
      ok: true,
      notification: {
        ...doc,
        id: String(doc._id),
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
