import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

import routes from "./routes/index.js";
import { stripeWebhookHandler } from "./routes/stripeWebhook.js";

const __dirnameForEnv = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.join(__dirnameForEnv, "..");
const repoRoot = path.join(__dirnameForEnv, "..", "..");

// Root .env (e.g. MONGO_URL), then optional backend/.env and backend/.local.env (Stripe, etc.)
dotenv.config({ path: path.join(repoRoot, ".env") });
dotenv.config({ path: path.join(backendRoot, ".env") });
dotenv.config({ path: path.join(backendRoot, ".local.env"), override: true });

const __dirname = __dirnameForEnv;
const uploadsRoot = path.join(__dirname, "..", "uploads");

const app = express();

const corsOrigin =
  process.env.CORS_ORIGINS?.trim()
    ? process.env.CORS_ORIGINS.split(",").map((s) => s.trim())
    : true;

app.use(
  cors({
    origin: corsOrigin,
    credentials: true,
  })
);

app.use(
  "/uploads",
  express.static(uploadsRoot, {
    setHeaders(res, filePath) {
      res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
      res.setHeader("Access-Control-Allow-Origin", "*");
      const lower = filePath.toLowerCase();
      if (lower.endsWith(".mp4")) res.setHeader("Content-Type", "video/mp4");
      else if (lower.endsWith(".webm")) res.setHeader("Content-Type", "video/webm");
      else if (lower.endsWith(".mov")) res.setHeader("Content-Type", "video/quicktime");
      else if (lower.endsWith(".ogg")) res.setHeader("Content-Type", "video/ogg");
      else if (lower.endsWith(".avi")) res.setHeader("Content-Type", "video/x-msvideo");
    },
  })
);

/** Stripe webhooks need the raw body for signature verification */
app.post("/api/billing/webhook", express.raw({ type: "application/json" }), stripeWebhookHandler);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.get("/", (req, res) => {
  res.json({ message: "Hey Alberta API running" });
});

app.use("/api", routes);

export default app;