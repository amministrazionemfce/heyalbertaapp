import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { randomUUID } from "crypto";
import express from "express";
import multer from "multer";
import { requireAuth } from "../middleware/auth.js";
import { requireAdmin } from "../middleware/admin.js";
import { transcodeToWebCompatibleMp4 } from "../utils/transcodeVideo.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Must match app.js: uploads live in backend/uploads (not backend/src/uploads).
const videosDir = path.join(__dirname, "..", "..", "uploads", "videos");
const avatarsDir = path.join(__dirname, "..", "..", "uploads", "avatars");
fs.mkdirSync(videosDir, { recursive: true });
fs.mkdirSync(avatarsDir, { recursive: true });

const ALLOWED_MIME = new Set([
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/ogg",
  "video/x-msvideo",
]);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, videosDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || ".mp4";
    const safeExt = [".mp4", ".webm", ".mov", ".ogg", ".avi"].includes(ext) ? ext : ".mp4";
    cb(null, `${Date.now()}-${randomUUID()}${safeExt}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 80 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME.has(file.mimetype)) cb(null, true);
    else cb(new Error("Only MP4, WebM, MOV, OGG, or AVI video files are allowed."));
  },
});

const ALLOWED_IMAGE = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

const avatarStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, avatarsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || ".jpg";
    const safe = [".jpg", ".jpeg", ".png", ".webp", ".gif"].includes(ext) ? ext : ".jpg";
    cb(null, `${Date.now()}-${randomUUID()}${safe}`);
  },
});

const uploadAvatar = multer({
  storage: avatarStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_IMAGE.has(file.mimetype)) cb(null, true);
    else cb(new Error("Only JPEG, PNG, WebP, or GIF images are allowed."));
  },
});

const imagesDir = path.join(__dirname, "..", "..", "uploads", "images");
fs.mkdirSync(imagesDir, { recursive: true });

const imageStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, imagesDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || ".jpg";
    const safeExt = [".jpg", ".jpeg", ".png", ".webp", ".gif"].includes(ext) ? ext : ".jpg";
    cb(null, `${Date.now()}-${randomUUID()}${safeExt}`);
  },
});

const uploadImage = multer({
  storage: imageStorage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_IMAGE.has(file.mimetype)) cb(null, true);
    else cb(new Error("Only JPEG, PNG, WebP, or GIF images are allowed."));
  },
});

const router = express.Router();

router.post("/video", requireAuth, (req, res) => {
  upload.single("video")(req, res, async (err) => {
    if (err) {
      if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ message: "Video must be 80MB or smaller." });
      }
      return res.status(400).json({ message: err.message || "Upload failed" });
    }
    if (!req.file) {
      return res.status(400).json({ message: "No video file uploaded." });
    }

    const inputPath = path.join(videosDir, req.file.filename);
    const base = path.basename(req.file.filename, path.extname(req.file.filename));
    const tmpPath = path.join(videosDir, `${base}.tmp.mp4`);
    const finalPath = path.join(videosDir, `${base}.mp4`);

    try {
      await transcodeToWebCompatibleMp4(inputPath, tmpPath);
      fs.unlinkSync(inputPath);
      fs.renameSync(tmpPath, finalPath);
      return res.json({ url: `/uploads/videos/${base}.mp4`, transcoded: true });
    } catch (e) {
      if (fs.existsSync(tmpPath)) {
        try {
          fs.unlinkSync(tmpPath);
        } catch {
          /* ignore */
        }
      }
      const msg = e.message || String(e);
      if (msg.includes("ffmpeg not found")) {
        console.warn("[upload] ffmpeg not on PATH; serving original file (install ffmpeg for AV1/VP9/WebM compatibility)");
        return res.json({
          url: `/uploads/videos/${req.file.filename}`,
          transcoded: false,
        });
      }
      console.error("[upload] transcode failed", e);
      return res.status(500).json({
        message:
          "Could not process this video. Try another file or a shorter clip. On the server, install ffmpeg for reliable conversion.",
      });
    }
  });
});

router.post("/avatar", requireAuth, (req, res) => {
  uploadAvatar.single("avatar")(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ message: "Image must be 5MB or smaller." });
      }
      return res.status(400).json({ message: err.message || "Upload failed" });
    }
    if (!req.file) {
      return res.status(400).json({ message: "No image uploaded." });
    }
    return res.json({ url: `/uploads/avatars/${req.file.filename}` });
  });
});

// Admin-only image upload for city/category hero overrides.
// Returns: { url }
router.post("/image", requireAdmin, (req, res) => {
  uploadImage.single("image")(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ message: "Image must be 8MB or smaller." });
      }
      return res.status(400).json({ message: err.message || "Upload failed" });
    }
    if (!req.file) {
      return res.status(400).json({ message: "No image uploaded." });
    }
    return res.json({ url: `/uploads/images/${req.file.filename}` });
  });
});

export default router;
