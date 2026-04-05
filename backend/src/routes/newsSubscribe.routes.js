import express from "express";
import NewsSubscriber from "../models/NewsSubscriber.js";

const router = express.Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

router.post("/", async (req, res) => {
  try {
    const email = String(req.body?.email || "")
      .trim()
      .toLowerCase();
    if (!email || !EMAIL_RE.test(email)) {
      return res.status(400).json({ message: "Please enter a valid email address." });
    }

    const existing = await NewsSubscriber.findOne({ email }).lean();
    if (existing) {
      return res.json({
        ok: true,
        alreadySubscribed: true,
        message:
          "This email is already subscribed — you’ll keep getting alerts when we publish new articles.",
      });
    }

    try {
      await NewsSubscriber.create({
        email,
        createdAt: new Date().toISOString(),
      });
    } catch (e) {
      if (e?.code === 11000) {
        return res.json({
          ok: true,
          alreadySubscribed: true,
          message:
            "This email is already subscribed — you’ll keep getting alerts when we publish new articles.",
        });
      }
      throw e;
    }

    res.json({
      ok: true,
      alreadySubscribed: false,
      message: "You’re subscribed — we’ll email you when new articles go live.",
    });
  } catch (err) {
    console.error("POST /news-subscribe", err);
    res.status(500).json({ message: err.message || "Could not save subscription" });
  }
});

export default router;
