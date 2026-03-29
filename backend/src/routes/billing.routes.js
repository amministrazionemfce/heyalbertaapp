import express from "express";
import Stripe from "stripe";
import { requireAuth } from "../middleware/auth.js";
import Vendor from "../models/Vendor.js";
import { planIdFromPriceId } from "../utils/stripePlan.js";
import { setFeaturedForPaidUser, clearFeaturedForFreeUser } from "../utils/membershipFeatured.js";

const router = express.Router();

function getFrontendBase() {
  let u = String(process.env.FRONTEND_URL || "http://localhost:3000").trim();
  if (!/^https?:\/\//i.test(u)) {
    u = `http://${u.replace(/^\/+/, "")}`;
  }
  return u.replace(/\/$/, "");
}

const FRONTEND = getFrontendBase();

function getStripeClient() {
  const key = String(process.env.STRIPE_SECRET_KEY || "").trim();
  if (!key) return { stripe: null, configError: "missing" };
  if (key.startsWith("pk_")) return { stripe: null, configError: "publishable" };
  try {
    return { stripe: new Stripe(key), configError: null };
  } catch {
    return { stripe: null, configError: "invalid" };
  }
}

function billingNotReadyResponse(res, configError) {
  if (configError === "publishable") {
    return res.status(503).json({
      message:
        "STRIPE_SECRET_KEY must be your Secret key (sk_test_... or sk_live_...), not the Publishable key (pk_...).",
    });
  }
  if (configError === "invalid") {
    return res.status(503).json({ message: "STRIPE_SECRET_KEY is invalid." });
  }
  return res.status(503).json({ message: "Stripe billing is not configured (missing STRIPE_SECRET_KEY)." });
}

function priceIdFor(planId, cadence) {
  const yearly = cadence === "yearly";
  if (planId === "standard") {
    return yearly
      ? String(process.env.STRIPE_STANDARD_YEARLY_PRICE_ID || "").trim()
      : String(process.env.STRIPE_STANDARD_MONTHLY_PRICE_ID || "").trim();
  }
  if (planId === "premium") {
    return yearly
      ? String(process.env.STRIPE_GOLD_YEARLY_PRICE_ID || "").trim()
      : String(process.env.STRIPE_GOLD_MONTHLY_PRICE_ID || "").trim();
  }
  return "";
}

async function setVendorsTier(userId, tier) {
  const uid = String(userId || "");
  if (!uid) return;
  if (tier === "standard" || tier === "premium") {
    await Vendor.updateMany({ userId: uid }, { $set: { tier } });
    await setFeaturedForPaidUser(uid);
  } else {
    await Vendor.updateMany({ userId: uid }, { $set: { tier: "free" } });
    await clearFeaturedForFreeUser(uid);
  }
}

/**
 * GET /api/billing/public-config
 * Returns Stripe publishable key (pk_...) for Embedded Checkout. Safe to expose publicly.
 * Use when the frontend build does not embed REACT_APP_STRIPE_PUBLISHABLE_KEY (e.g. production static hosting).
 */
router.get("/public-config", (_req, res) => {
  const pk = String(process.env.STRIPE_PUBLISHABLE_KEY || "").trim();
  res.json({ publishableKey: pk.startsWith("pk_") ? pk : null });
});

router.post("/checkout-session", requireAuth, async (req, res) => {
  try {
    const { stripe, configError } = getStripeClient();
    if (!stripe) return billingNotReadyResponse(res, configError);

    const planId = String(req.body?.planId || "").trim();
    const cadence = String(req.body?.cadence || "monthly").trim() === "yearly" ? "yearly" : "monthly";

    if (planId !== "standard" && planId !== "premium") {
      return res.status(400).json({ message: "Invalid plan. Use standard or premium (Gold)." });
    }

    const priceId = priceIdFor(planId, cadence);
    if (!priceId) {
      return res.status(503).json({
        message: `Missing Stripe price ID for ${planId} (${cadence}). Set STRIPE_* env vars.`,
      });
    }

    const session = await stripe.checkout.sessions.create({
      ui_mode: "embedded",
      mode: "subscription",
      customer_email: req.user.email,
      line_items: [{ price: priceId, quantity: 1 }],
      return_url: `${FRONTEND}/checkout/return?session_id={CHECKOUT_SESSION_ID}`,
      client_reference_id: req.user._id.toString(),
      metadata: {
        userId: req.user._id.toString(),
        planId,
        cadence,
      },
      subscription_data: {
        metadata: {
          userId: req.user._id.toString(),
          planId,
          cadence,
        },
      },
    });

    if (!session.client_secret) {
      return res.status(500).json({ message: "Stripe did not return an embedded checkout client secret." });
    }

    res.json({ clientSecret: session.client_secret });
  } catch (err) {
    console.error("checkout-session:", err?.message || err);
    res.status(500).json({ message: err.message || "Failed to create checkout session." });
  }
});

router.get("/checkout-session-status", requireAuth, async (req, res) => {
  try {
    const sessionId = String(req.query.session_id || "").trim();
    if (!sessionId.startsWith("cs_")) {
      return res.status(400).json({ message: "Invalid session id." });
    }

    const { stripe, configError } = getStripeClient();
    if (!stripe) return billingNotReadyResponse(res, configError);

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const uid = req.user._id.toString();
    const refOk = session.client_reference_id === uid;
    const metaOk = session.metadata?.userId === uid;
    if (!refOk && !metaOk) {
      return res.status(403).json({ message: "This checkout session does not belong to your account." });
    }

    res.json({
      status: session.status,
      customer_email: session.customer_details?.email || null,
    });
  } catch (err) {
    console.error("checkout-session-status:", err?.message || err);
    res.status(500).json({ message: err.message || "Failed to load session." });
  }
});

router.post("/portal-session", requireAuth, async (req, res) => {
  try {
    const { stripe, configError } = getStripeClient();
    if (!stripe) return billingNotReadyResponse(res, configError);

    const customers = await stripe.customers.list({ email: req.user.email, limit: 1 });
    const customer = customers.data[0];
    if (!customer) {
      return res.status(404).json({
        message: "No Stripe customer found for this email. Subscribe to a paid plan first.",
      });
    }

    const returnUrl = String(process.env.STRIPE_PORTAL_RETURN_URL || `${FRONTEND}/dashboard`).trim();
    const session = await stripe.billingPortal.sessions.create({
      customer: customer.id,
      return_url: returnUrl,
    });

    if (!session.url) {
      return res.status(500).json({ message: "Stripe did not return a portal URL." });
    }

    res.json({ url: session.url });
  } catch (err) {
    console.error("portal-session:", err?.message || err);
    res.status(500).json({ message: err.message || "Failed to open billing portal." });
  }
});

router.post("/sync-subscription", requireAuth, async (req, res) => {
  try {
    const { stripe, configError } = getStripeClient();
    if (!stripe) return billingNotReadyResponse(res, configError);

    const uid = req.user._id.toString();
    const customers = await stripe.customers.list({ email: req.user.email, limit: 1 });
    const customer = customers.data[0];

    if (!customer) {
      await setVendorsTier(uid, "free");
      return res.json({ ok: true, tier: "free" });
    }

    const subs = await stripe.subscriptions.list({ customer: customer.id, limit: 20 });
    let best = "free";

    for (const sub of subs.data) {
      const st = sub.status;
      if (st !== "active" && st !== "trialing") continue;
      let planId = sub.metadata?.planId;
      if (planId !== "standard" && planId !== "premium") {
        const priceId = sub.items?.data?.[0]?.price?.id;
        planId = planIdFromPriceId(priceId);
      }
      if (planId === "premium") best = "premium";
      else if (planId === "standard" && best !== "premium") best = "standard";
    }

    await setVendorsTier(uid, best);
    res.json({ ok: true, tier: best });
  } catch (err) {
    console.error("sync-subscription:", err?.message || err);
    res.status(500).json({ message: err.message || "Failed to sync subscription." });
  }
});

export default router;
