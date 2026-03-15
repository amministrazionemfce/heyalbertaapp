import express from "express";
import mongoose from "mongoose";
import Resource from "../models/Resource.js";
import { requireAdmin } from "../middleware/admin.js";

const router = express.Router();

function isValidObjectId(id) {
  return id && typeof id === "string" && id !== "undefined" && mongoose.Types.ObjectId.isValid(id);
}

router.get("/", async (req, res) => {
  const { type, category } = req.query;
  const query = {};
  if (type) query.type = type;
  if (category) query.category = category;
  const resources = await Resource.find(query).sort({ createdAt: -1 });
  res.json(resources);
});

router.post("/", requireAdmin, async (req, res) => {
  const resource = await Resource.create({
    ...req.body,
    createdAt: new Date().toISOString()
  });
  res.json(resource);
});

router.delete("/:id", requireAdmin, async (req, res) => {
  const id = req.params.id;
  if (!isValidObjectId(id))
    return res.status(400).json({ message: "Invalid resource id" });

  const resource = await Resource.findByIdAndDelete(id);
  if (!resource)
    return res.status(404).json({ message: "Resource not found" });
  res.json({ message: "Resource deleted" });
});

export default router;