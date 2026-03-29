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

/** Comma-separated exact origins (no trailing slash). If unset, the cors package reflects the request Origin (fine for local dev). */
const corsOrigin =
  process.env.CORS_ORIGINS?.trim()
    ? process.env.CORS_ORIGINS.split(",").map((s) => s.trim().replace(/\/$/, "")).filter(Boolean)
    : true;

const allowVercelPreview =
  process.env.CORS_ALLOW_VERCEL_PREVIEW === "1" || process.env.CORS_ALLOW_VERCEL_PREVIEW === "true";

const corsOptions =
  Array.isArray(corsOrigin) && allowVercelPreview
    ? {
        origin(origin, callback) {
          if (!origin) return callback(null, true);
          const normalized = origin.replace(/\/$/, "");
          if (corsOrigin.includes(normalized)) return callback(null, true);
          try {
            const host = new URL(origin).hostname;
            if (host === "vercel.app" || host.endsWith(".vercel.app")) {
              return callback(null, true);
            }
          } catch {
            /* ignore */
          }
          return callback(null, false);
        },
        credentials: true,
      }
    : { origin: corsOrigin, credentials: true };

app.use(cors(corsOptions));

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