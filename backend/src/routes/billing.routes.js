import express from "express";
import mongoose from "mongoose";
import Stripe from "stripe";
import { requireAuth } from "../middleware/auth.js";
import Listing from "../models/Listing.js";
import User from "../models/User.js";
import { bestPaidPlanFromSubscriptions } from "../utils/stripePlan.js";
import {
  listActiveAndTrialingSubscriptions,
  pruneCustomerDuplicateSubscriptions,
  reconcileUserBillingFromStripeCustomer,
} from "../utils/stripeUserBilling.js";
import { setFeaturedForPaidUser, applyFreeStripeTierToUser } from "../utils/membershipFeatured.js";
import { effectiveMembershipTier } from "../utils/promotionTier.js";

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
  const oid = mongoose.Types.ObjectId.isValid(uid) ? new mongoose.Types.ObjectId(uid) : uid;
  if (tier === "standard" || tier === "premium") {
    await Listing.updateMany({ userId: uid }, { $set: { tier } });
    await User.updateOne({ _id: oid }, { $set: { billingTier: tier } });
    await setFeaturedForPaidUser(uid);
  } else {
    await applyFreeStripeTierToUser(uid);
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

    const email = String(req.user.email || "").trim();
    let customerPayload = {};
    if (email) {
      const existing = await stripe.customers.list({ email, limit: 1 });
      const cid = existing.data[0]?.id;
      if (cid) customerPayload = { customer: cid };
      else customerPayload = { customer_email: email };
    }

    const session = await stripe.checkout.sessions.create({
      ui_mode: "embedded",
      mode: "subscription",
      ...customerPayload,
      line_items: [{ price: priceId, quantity: 1 }],
      return_url: `${FRONTEND}/checkout/return?session_id={CHECKOUT_SESSION_ID}`,
      client_reference_id: req.user._id.toString(),
      /** Restrict to cards (Link is a separate method in Dashboard; card-only reduces Link prompts). */
      payment_method_types: ["card"],
      consent_collection: {
        payment_method_reuse_agreement: {
          position: "hidden",
        },
      },
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

/**
 * Swap Standard ↔ Gold (or billing period) on the existing subscription — no new Checkout session.
 */
router.post("/change-subscription-plan", requireAuth, async (req, res) => {
  try {
    const planId = String(req.body?.planId || "").trim();
    const cadence = String(req.body?.cadence || "monthly").trim() === "yearly" ? "yearly" : "monthly";

    if (planId !== "standard" && planId !== "premium") {
      return res.status(400).json({ message: "Invalid plan.", code: "INVALID_PLAN" });
    }

    const targetPriceId = priceIdFor(planId, cadence);
    if (!targetPriceId) {
      return res.status(503).json({
        message: `Missing Stripe price ID for ${planId} (${cadence}). Set STRIPE_* env vars.`,
      });
    }

    const { stripe, configError } = getStripeClient();
    if (!stripe) return billingNotReadyResponse(res, configError);

    const uid = req.user._id.toString();
    const email = String(req.user.email || "").trim().toLowerCase();
    const customers = await stripe.customers.list({ email, limit: 1 });
    const customer = customers.data[0];
    if (!customer) {
      return res.status(400).json({
        message: "No Stripe customer for this account. Complete checkout once to start a subscription.",
        code: "NO_ACTIVE_SUBSCRIPTION",
      });
    }

    let subs = await listActiveAndTrialingSubscriptions(stripe, customer.id);
    if (subs.length === 0) {
      return res.status(400).json({
        message: "No active subscription to change. Use checkout to subscribe.",
        code: "NO_ACTIVE_SUBSCRIPTION",
      });
    }

    subs.sort((a, b) => (b.created || 0) - (a.created || 0));
    const primaryId = subs[0].id;
    for (let i = 1; i < subs.length; i++) {
      try {
        await stripe.subscriptions.cancel(subs[i].id);
      } catch (e) {
        console.error("change-plan cancel extra sub:", e?.message || e);
      }
    }

    const sub = await stripe.subscriptions.retrieve(primaryId, { expand: ["items.data.price"] });
    const item0 = sub.items?.data?.[0];
    const itemId = item0?.id;
    if (!itemId) {
      return res.status(500).json({ message: "Subscription has no updatable line item." });
    }

    let currentPriceId = item0.price;
    if (currentPriceId && typeof currentPriceId === "object") {
      currentPriceId = currentPriceId.id;
    }

    if (String(currentPriceId || "") === String(targetPriceId)) {
      await reconcileUserBillingFromStripeCustomer(stripe, customer.id, uid);
      const uSame = await User.findById(uid).select("promoStandardExpiresAt billingTier").lean();
      const effSame = effectiveMembershipTier(uSame?.billingTier || "free", uSame?.promoStandardExpiresAt);
      return res.json({
        ok: true,
        unchanged: true,
        tier: uSame?.billingTier || "free",
        effectiveTier: effSame,
        promoStandardExpiresAt: uSame?.promoStandardExpiresAt || null,
      });
    }

    await stripe.subscriptions.update(primaryId, {
      items: [{ id: itemId, price: targetPriceId }],
      proration_behavior: "create_prorations",
      metadata: {
        userId: uid,
        planId,
        cadence,
      },
    });

    await reconcileUserBillingFromStripeCustomer(stripe, customer.id, uid);
    const uAfter = await User.findById(uid).select("promoStandardExpiresAt billingTier").lean();
    const effectiveTier = effectiveMembershipTier(uAfter?.billingTier || "free", uAfter?.promoStandardExpiresAt);
    res.json({
      ok: true,
      tier: uAfter?.billingTier || "free",
      effectiveTier,
      promoStandardExpiresAt: uAfter?.promoStandardExpiresAt || null,
      subscriptionId: primaryId,
    });
  } catch (err) {
    console.error("change-subscription-plan:", err?.message || err);
    res.status(500).json({ message: err.message || "Could not update subscription." });
  }
});

/**
 * Cancel the active subscription immediately (downgrade to Free) — avoids portal “cancel at period end” confusion.
 */
router.post("/cancel-subscription", requireAuth, async (req, res) => {
  try {
    const { stripe, configError } = getStripeClient();
    if (!stripe) return billingNotReadyResponse(res, configError);

    const uid = req.user._id.toString();
    const email = String(req.user.email || "").trim().toLowerCase();
    const customers = await stripe.customers.list({ email, limit: 1 });
    const customer = customers.data[0];

    if (!customer) {
      await setVendorsTier(uid, "free");
      const uNo = await User.findById(uid).select("promoStandardExpiresAt").lean();
      const effNo = effectiveMembershipTier("free", uNo?.promoStandardExpiresAt);
      return res.json({
        ok: true,
        tier: "free",
        effectiveTier: effNo,
        promoStandardExpiresAt: uNo?.promoStandardExpiresAt || null,
      });
    }

    const subs = await listActiveAndTrialingSubscriptions(stripe, customer.id);
    for (const sub of subs) {
      try {
        await stripe.subscriptions.cancel(sub.id);
      } catch (e) {
        console.error("cancel-subscription cancel:", e?.message || e);
      }
    }

    await reconcileUserBillingFromStripeCustomer(stripe, customer.id, uid);
    const uAfter = await User.findById(uid).select("promoStandardExpiresAt billingTier").lean();
    const effectiveTier = effectiveMembershipTier(uAfter?.billingTier || "free", uAfter?.promoStandardExpiresAt);
    res.json({
      ok: true,
      tier: uAfter?.billingTier || "free",
      effectiveTier,
      promoStandardExpiresAt: uAfter?.promoStandardExpiresAt || null,
    });
  } catch (err) {
    console.error("cancel-subscription:", err?.message || err);
    res.status(500).json({ message: err.message || "Could not cancel subscription." });
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
      const uNo = await User.findById(uid).select("promoStandardExpiresAt").lean();
      const effNo = effectiveMembershipTier("free", uNo?.promoStandardExpiresAt);
      return res.json({
        ok: true,
        tier: "free",
        effectiveTier: effNo,
        promoStandardExpiresAt: uNo?.promoStandardExpiresAt || null,
      });
    }

    const allSubs = await listActiveAndTrialingSubscriptions(stripe, customer.id);
    let best = bestPaidPlanFromSubscriptions(allSubs);
    if (best !== "free") {
      await pruneCustomerDuplicateSubscriptions(stripe, customer.id);
    }
    const finalSubs = await listActiveAndTrialingSubscriptions(stripe, customer.id);
    best = bestPaidPlanFromSubscriptions(finalSubs);

    await setVendorsTier(uid, best);
    const uAfter = await User.findById(uid).select("promoStandardExpiresAt").lean();
    const effectiveTier = effectiveMembershipTier(best, uAfter?.promoStandardExpiresAt);
    res.json({
      ok: true,
      tier: best,
      effectiveTier,
      promoStandardExpiresAt: uAfter?.promoStandardExpiresAt || null,
    });
  } catch (err) {
    console.error("sync-subscription:", err?.message || err);
    res.status(500).json({ message: err.message || "Failed to sync subscription." });
  }
});

export default router;
