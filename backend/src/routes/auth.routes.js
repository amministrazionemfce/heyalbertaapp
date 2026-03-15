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
  const { role } = req.body;
  if (role !== "vendor")
    return res.status(400).json({ message: "Only upgrade to vendor is allowed" });
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { role: "vendor" },
    { new: true }
  );
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json(user);
});

export default router;