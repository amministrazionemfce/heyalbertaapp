import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

import routes from "./routes/index.js";
import { stripeWebhookHandler } from "./routes/stripeWebhook.js";

const __dirnameForEnv = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.join(__dirnameForEnv, "..");

// Backend env only: backend/.env then backend/.local.env (Stripe, etc.)
dotenv.config({ path: path.join(backendRoot, ".env") });
dotenv.config({ path: path.join(backendRoot, ".local.env"), override: true });

const __dirname = __dirnameForEnv;
const uploadsRoot = path.join(__dirname, "..", "uploads");

const app = express();

/** Comma-separated exact origins (no trailing slash). If unset, the cors package reflects the request Origin (fine for local dev). */
const corsOrigin =
  process.env.CORS_ORIGINS?.trim()
    ? process.env.CORS_ORIGINS.split(",")
        .map((s) =>
          s
            .trim()
            // Railway / shells sometimes keep surrounding quotes: "https://example.com"
            .replace(/^['"]+|['"]+$/g, "")
            .replace(/\/$/, "")
            .replace(/\r/g, "")
        )
        .filter(Boolean)
    : true;

const allowVercelPreview =
  process.env.CORS_ALLOW_VERCEL_PREVIEW === "1" || process.env.CORS_ALLOW_VERCEL_PREVIEW === "true";

/**
 * CRA / Vite often use http://localhost:PORT or http://127.0.0.1:PORT — different Origin strings.
 * Use strings from CORS_ORIGINS plus RegExps here (cors supports both in one array). A dynamic
 * `origin(origin, cb)` callback + Express 5 has led to preflight responses missing
 * Access-Control-Allow-Origin while other CORS headers were still set.
 */
const loopbackHttpPatterns = [
  /^http:\/\/localhost(?::\d+)?$/,
  /^http:\/\/127\.0\.0\.1(?::\d+)?$/,
  /^http:\/\/\[::1\](?::\d+)?$/,
];

const corsOptions = (() => {
  if (!Array.isArray(corsOrigin)) {
    return { origin: corsOrigin, credentials: true };
  }
  const matchers = [...corsOrigin, ...loopbackHttpPatterns];
  if (allowVercelPreview) {
    matchers.push(/^https:\/\/[\w.-]+\.vercel\.app$/);
  }
  return { origin: matchers, credentials: true };
})();

app.use(cors(corsOptions));
// Express 5 / path-to-regexp v8 rejects app.options('*', ...). `cors()` already handles OPTIONS preflight.

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