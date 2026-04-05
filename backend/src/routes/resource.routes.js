import express from "express";
import mongoose from "mongoose";
import Resource from "../models/Resource.js";
import { requireAdmin } from "../middleware/admin.js";
import { notifyNewsSubscribersForArticle } from "../utils/notifyNewsSubscribers.js";

const router = express.Router();

function isValidObjectId(id) {
  return id && typeof id === "string" && id !== "undefined" && mongoose.Types.ObjectId.isValid(id);
}

router.get("/", async (req, res) => {
  try {
    const { type, category, featured } = req.query;
    const query = {};
    if (type) query.type = type;
    if (category) query.category = category;
    if (featured === "true" || featured === true) query.featured = true;

    let resources = await Resource.find(query).sort({ createdAt: -1 }).lean({ virtuals: true });

    if (type === "news_category") {
      resources = [...resources].sort((a, b) => {
        const ao = Number(a.sortOrder) || 0;
        const bo = Number(b.sortOrder) || 0;
        if (ao !== bo) return ao - bo;
        return String(b.createdAt || "").localeCompare(String(a.createdAt || ""));
      });
    } else if (type === "article") {
      resources = [...resources].sort((a, b) => {
        const af = !!a.featured;
        const bf = !!b.featured;
        if (af !== bf) return af ? -1 : 1;
        const da = new Date(a.publishedAt || a.createdAt || 0).getTime();
        const db = new Date(b.publishedAt || b.createdAt || 0).getTime();
        return db - da;
      });
    }

    res.json(resources);
  } catch (err) {
    console.error("GET /resources", err);
    res.status(500).json({ message: err.message || "Failed to fetch resources" });
  }
});

router.post("/", requireAdmin, async (req, res) => {
  try {
    const allowedTypes = ["checklist", "guide", "faq", "article", "news_category"];
    const body = req.body && typeof req.body === "object" ? req.body : {};

    const payload = {
      title: String(body.title ?? "").trim(),
      type: body.type,
      content: String(body.content ?? ""),
      category: String(body.category ?? "general").trim(),
      imageUrl: body.imageUrl != null ? String(body.imageUrl) : "",
      excerpt: body.excerpt != null ? String(body.excerpt) : "",
      featured: Boolean(body.featured),
      sortOrder: Number.isFinite(Number(body.sortOrder)) ? Number(body.sortOrder) : 0,
      linkUrl: body.linkUrl != null ? String(body.linkUrl) : "",
      publishedAt:
        body.publishedAt != null && String(body.publishedAt).trim() !== ""
          ? String(body.publishedAt).trim()
          : "",
      authorLabel: body.authorLabel != null ? String(body.authorLabel).trim() : "",
      hideCardText: Boolean(body.hideCardText),
      createdAt: new Date().toISOString()
    };

    if (!payload.title) {
      return res.status(400).json({ message: "Title is required" });
    }
    if (!allowedTypes.includes(payload.type)) {
      return res.status(400).json({ message: "Invalid resource type" });
    }
    if (!String(payload.content).trim()) {
      return res.status(400).json({ message: "Content is required" });
    }

    const resource = await Resource.create(payload);
    if (payload.type === "article") {
      const plain = resource.toObject ? resource.toObject({ virtuals: true }) : resource;
      notifyNewsSubscribersForArticle(plain).catch(() => {});
    }
    res.json(resource);
  } catch (err) {
    console.error("POST /resources", err);
    if (err.name === "ValidationError") {
      const msg =
        err.errors != null
          ? Object.values(err.errors)
              .map((e) => e.message)
              .join(" ")
          : err.message || "Validation failed";
      return res.status(400).json({ message: msg });
    }
    res.status(500).json({ message: err.message || "Failed to create resource" });
  }
});

router.put("/:id", requireAdmin, async (req, res) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) {
    return res.status(400).json({ message: "Invalid resource id" });
  }
  const allowed = [
    "title",
    "type",
    "content",
    "category",
    "imageUrl",
    "excerpt",
    "featured",
    "sortOrder",
    "linkUrl",
    "publishedAt",
    "authorLabel",
    "hideCardText",
  ];
  const payload = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) payload[key] = req.body[key];
  }
  const updated = await Resource.findByIdAndUpdate(id, payload, { new: true, runValidators: false });
  if (!updated) return res.status(404).json({ message: "Resource not found" });
  res.json(updated);
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