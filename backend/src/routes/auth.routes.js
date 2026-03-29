import express from "express";
import bcrypt from "bcryptjs";

import User from "../models/User.js";
import { createToken } from "../utils/jwt.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

router.post("/register", async (req, res) => {
  const { email, password, name, role = "user" } = req.body;

  const exists = await User.findOne({ email });

  if (exists)
    return res.status(400).json({ message: "Email already exists" });

  const user = await User.create({
    email,
    passwordHash: await bcrypt.hash(password, 10),
    name,
    role,
    createdAt: new Date().toISOString()
  });

  const token = createToken(user._id.toString(), user.role);

  res.json({
    token,
    user
  });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (!user)
    return res.status(401).json({ message: "Invalid credentials" });

  const valid = await bcrypt.compare(password, user.passwordHash);

  if (!valid)
    return res.status(401).json({ message: "Invalid credentials" });

  const token = createToken(user._id.toString(), user.role);

  res.json({ token, user });
});

router.get("/me", requireAuth, (req, res) => {
  res.json(req.user);
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
      const user = await User.findById(req.user._id);
      if (!user) return res.status(404).json({ message: "User not found" });
      return res.json(user);
    }

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true });
    if (!user) return res.status(404).json({ message: "User not found" });
    return res.json(user);
  } catch (err) {
    return res.status(500).json({ message: err.message || "Update failed" });
  }
});

export default router;