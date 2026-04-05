import express from "express";
import crypto from "crypto";
import bcrypt from "bcryptjs";

import User from "../models/User.js";
import { createToken } from "../utils/jwt.js";
import { requireAuth } from "../middleware/auth.js";
import { verificationEmailEnabled, sendTransactionalMail } from "../utils/mail.js";
import { syncUserListingTiersFromBilling } from "../utils/membershipFeatured.js";

const router = express.Router();

function getFrontendBase() {
  let u = String(process.env.FRONTEND_URL || "http://localhost:3000").trim();
  if (!/^https?:\/\//i.test(u)) {
    u = `http://${u.replace(/^\/+/, "")}`;
  }
  return u.replace(/\/$/, "");
}

router.post("/register", async (req, res) => {
  try {
    const { email, password, name, role = "user" } = req.body;

    const exists = await User.findOne({ email: String(email || "").trim().toLowerCase() });
    if (exists) return res.status(400).json({ message: "Email already exists" });

    const needVerify = verificationEmailEnabled();
    const verifyToken = needVerify ? crypto.randomBytes(32).toString("hex") : null;
    const verifyExpires = needVerify ? new Date(Date.now() + 48 * 3600000) : null;

    const user = await User.create({
      email: String(email).trim().toLowerCase(),
      passwordHash: await bcrypt.hash(password, 10),
      name,
      role,
      createdAt: new Date().toISOString(),
      lastActiveAt: new Date(),
      emailVerified: !needVerify,
      emailVerificationToken: verifyToken,
      emailVerificationTokenExpires: verifyExpires,
    });

    if (needVerify) {
      const base = getFrontendBase();
      const verifyUrl = `${base}/verify-email?token=${encodeURIComponent(verifyToken)}`;
      const text = `Hi ${name},\n\nPlease verify your email for Hey Alberta:\n${verifyUrl}\n\nThis link expires in 48 hours.\n`;
      try {
        await sendTransactionalMail({
          to: user.email,
          subject: "Verify your Hey Alberta email",
          text,
        });
      } catch (e) {
        console.error("register verification email:", e?.message || e);
        return res.status(201).json({
          message:
            "Account created but we could not send email. Use “Resend verification” on the login page with your email.",
          user: user.toJSON(),
          token: null,
          requiresVerification: true,
          emailSendFailed: true,
        });
      }

      return res.status(201).json({
        message: "Account created. Check your email for a verification link.",
        user: user.toJSON(),
        token: null,
        requiresVerification: true,
      });
    }

    const token = createToken(user._id.toString(), user.role);
    return res.json({
      token,
      user: user.toJSON(),
      requiresVerification: false,
    });
  } catch (err) {
    console.error("register:", err?.message || err);
    return res.status(500).json({ message: err.message || "Registration failed" });
  }
});

router.get("/verify-email", async (req, res) => {
  try {
    const token = String(req.query.token || "").trim();
    if (!token || token.length < 20) {
      return res.status(400).json({ message: "Invalid or missing token." });
    }

    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationTokenExpires: { $gt: new Date() },
    });
    if (!user) {
      return res.status(400).json({ message: "This link is invalid or has expired. Request a new one from the login page." });
    }

    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationTokenExpires = undefined;
    await user.save();

    await syncUserListingTiersFromBilling(user._id);

    const jwt = createToken(user._id.toString(), user.role);
    return res.json({ token: jwt, user: user.toJSON(), message: "Email verified." });
  } catch (err) {
    console.error("verify-email:", err?.message || err);
    return res.status(500).json({ message: err.message || "Verification failed" });
  }
});

router.post("/resend-verification", async (req, res) => {
  try {
    if (!verificationEmailEnabled()) {
      return res.status(503).json({ message: "Email verification is not enabled on this server." });
    }
    const email = String(req.body?.email || "").trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: "Valid email required." });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.json({ message: "If an account exists for that email, we sent a verification link." });
    }
    if (user.emailVerified) {
      return res.json({ message: "This email is already verified. You can log in." });
    }

    const verifyToken = crypto.randomBytes(32).toString("hex");
    user.emailVerificationToken = verifyToken;
    user.emailVerificationTokenExpires = new Date(Date.now() + 48 * 3600000);
    await user.save();

    const base = getFrontendBase();
    const verifyUrl = `${base}/verify-email?token=${encodeURIComponent(verifyToken)}`;
    const text = `Hi ${user.name},\n\nVerify your Hey Alberta email:\n${verifyUrl}\n\nExpires in 48 hours.\n`;

    await sendTransactionalMail({
      to: user.email,
      subject: "Verify your Hey Alberta email",
      text,
    });

    return res.json({ message: "If an account exists for that email, we sent a verification link." });
  } catch (err) {
    console.error("resend-verification:", err?.message || err);
    return res.status(500).json({ message: err.message || "Could not send email." });
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email: String(email || "").trim().toLowerCase() });

  if (!user) return res.status(401).json({ message: "Invalid credentials" });

  const valid = await bcrypt.compare(password, user.passwordHash);

  if (!valid) return res.status(401).json({ message: "Invalid credentials" });

  if (verificationEmailEnabled() && !user.emailVerified) {
    return res.status(403).json({
      message: "Please verify your email before signing in. Check your inbox or request a new link below.",
      code: "EMAIL_NOT_VERIFIED",
    });
  }

  const token = createToken(user._id.toString(), user.role);

  await User.findByIdAndUpdate(user._id, { lastActiveAt: new Date() });
  await syncUserListingTiersFromBilling(user._id);

  res.json({ token, user: user.toJSON() });
});

router.get("/me", requireAuth, async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { lastActiveAt: new Date() },
    { new: true }
  );
  if (!user) return res.status(401).json({ message: "User not found" });
  await syncUserListingTiersFromBilling(user._id);
  res.json(user);
});

router.patch("/me", requireAuth, async (req, res) => {
  try {
    const body = req.body || {};
    const updates = {};

    if (body.name !== undefined) {
      const n = String(body.name).trim();
      if (!n) return res.status(400).json({ message: "Name cannot be empty" });
      updates.name = n;
    }
    if (body.email !== undefined) {
      const e = String(body.email).trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) {
        return res.status(400).json({ message: "Invalid email" });
      }
      const taken = await User.findOne({ email: e, _id: { $ne: req.user._id } });
      if (taken) return res.status(400).json({ message: "Email already in use" });
      updates.email = e;
      if (verificationEmailEnabled()) {
        updates.emailVerified = false;
        const verifyToken = crypto.randomBytes(32).toString("hex");
        updates.emailVerificationToken = verifyToken;
        updates.emailVerificationTokenExpires = new Date(Date.now() + 48 * 3600000);
      }
    }
    if (body.avatar_url !== undefined) {
      const v = typeof body.avatar_url === "string" ? body.avatar_url.trim() : "";
      updates.avatar_url = v.length > 2_000_000 ? v.slice(0, 2_000_000) : v;
    }
    if (body.role !== undefined) {
      if (body.role !== "vendor") {
        return res.status(400).json({ message: "Only upgrade to vendor is allowed" });
      }
      if (req.user.role === "user") {
        updates.role = "vendor";
      }
    }

    if (Object.keys(updates).length === 0) {
      const u = await User.findById(req.user._id);
      if (!u) return res.status(404).json({ message: "User not found" });
      return res.json(u);
    }

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (updates.email && verificationEmailEnabled() && user.emailVerificationToken) {
      const base = getFrontendBase();
      const verifyUrl = `${base}/verify-email?token=${encodeURIComponent(user.emailVerificationToken)}`;
      try {
        await sendTransactionalMail({
          to: user.email,
          subject: "Confirm your new Hey Alberta email",
          text: `Hi ${user.name},\n\nConfirm this address:\n${verifyUrl}\n`,
        });
      } catch (e) {
        console.error("email change verification:", e?.message || e);
      }
    }

    return res.json(user);
  } catch (err) {
    return res.status(500).json({ message: err.message || "Update failed" });
  }
});

export default router;
