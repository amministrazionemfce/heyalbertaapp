import express from "express";
import { requireAuth } from "../middleware/auth.js";
import Vendor from "../models/Vendor.js";
const router = express.Router();

router.get("/", async (req, res) => {
  const { featured, limit } = req.query;
  const query = { status: "approved" };
  if (featured === "true" || featured === true) query.featured = true;
  let q = Vendor.find(query).sort({ createdAt: -1 });
  if (limit) {
    const n = Math.min(Math.max(parseInt(limit, 10) || 0, 1), 50);
    if (n > 0) q = q.limit(n);
  }
  const vendors = await q;
  res.json(vendors);
});

function normalizeName(name) {
  return (name || "").trim().toLowerCase();
}

async function isDuplicateName(name, excludeVendorId = null) {
  const n = normalizeName(name);
  if (!n) return false;
  const query = { name: new RegExp(`^${n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") };
  if (excludeVendorId) query._id = { $ne: excludeVendorId };
  const existing = await Vendor.findOne(query);
  return !!existing;
}

router.post("/", requireAuth, async (req, res) => {
  const name = (req.body.name || "").trim();
  if (name && (await isDuplicateName(name))) {
    return res.status(400).json({ message: "The business name already exists, please rename it." });
  }
  const vendor = await Vendor.create({
    ...req.body,
    userId: req.user._id.toString(),
    status: "pending",
    createdAt: new Date().toISOString()
  });
  res.json(vendor);
});

router.put("/:id", requireAuth, async (req, res) => {
  const { id } = req.params;
  const vendor = await Vendor.findById(id);
  if (!vendor) return res.status(404).json({ message: "Vendor not found" });
  if (vendor.userId !== req.user._id.toString()) {
    return res.status(403).json({ message: "Not authorized to update this vendor" });
  }
  const name = (req.body.name || "").trim();
  if (name && (await isDuplicateName(name, id))) {
    return res.status(400).json({ message: "The business name already exists, please rename it." });
  }
  const allowed = ["name", "description", "category", "city", "neighborhood", "phone", "email", "website", "images", "tier", "videoUrl"];
  const payload = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) payload[key] = req.body[key];
  }
  const updated = await Vendor.findByIdAndUpdate(id, payload, { new: true, runValidators: false });
  res.json(updated);
});

router.delete("/:id", requireAuth, async (req, res) => {
  const vendor = await Vendor.findById(req.params.id);
  if (!vendor) return res.status(404).json({ message: "Vendor not found" });
  if (vendor.userId !== req.user._id.toString()) {
    return res.status(403).json({ message: "Forbidden" });
  }
  await Vendor.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

export default router;