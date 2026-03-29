import Stripe from "stripe";
import Vendor from "../models/Vendor.js";
import { planIdFromPriceId } from "../utils/stripePlan.js";
import { setFeaturedForPaidUser, clearFeaturedForFreeUser } from "../utils/membershipFeatured.js";

function getStripe() {
  const key = String(process.env.STRIPE_SECRET_KEY || "").trim();
  if (!key || key.startsWith("pk_")) return null;
  try {
    return new Stripe(key);
  } catch {
    return null;
  }
}

async function applyPaidTier(userId, planId) {
  if (!userId || (planId !== "standard" && planId !== "premium")) return;
  const uid = String(userId);
  await Vendor.updateMany({ userId: uid }, { $set: { tier: planId } });
  await setFeaturedForPaidUser(uid);
}

async function applyFreeTier(userId) {
  if (!userId) return;
  const uid = String(userId);
  await Vendor.updateMany({ userId: uid }, { $set: { tier: "free" } });
  await clearFeaturedForFreeUser(uid);
}

/**
 * Express handler — mount with express.raw({ type: "application/json" }).
 */
export async function stripeWebhookHandler(req, res) {
  const stripe = getStripe();
  const secret = String(process.env.STRIPE_WEBHOOK_SECRET || "").trim();
  if (!stripe || !secret) {
    return res.status(503).send("Stripe webhook not configured");
  }

  const sig = req.headers["stripe-signature"];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, secret);
  } catch (err) {
    console.error("stripe webhook signature:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        if (session.mode !== "subscription") break;
        const userId = session.metadata?.userId || session.client_reference_id;
        const planId = session.metadata?.planId;
        if (planId === "standard" || planId === "premium") {
          await applyPaidTier(userId, planId);
        }
        break;
      }
      case "customer.subscription.updated": {
        const sub = event.data.object;
        const userId = sub.metadata?.userId;
        const status = sub.status;
        if (!userId) break;
        if (status === "active" || status === "trialing") {
          let planId = sub.metadata?.planId;
          if (planId !== "standard" && planId !== "premium") {
            const priceId = sub.items?.data?.[0]?.price?.id;
            planId = planIdFromPriceId(priceId);
          }
          if (planId === "standard" || planId === "premium") {
            await applyPaidTier(userId, planId);
          }
        } else if (
          status === "canceled" ||
          status === "unpaid" ||
          status === "incomplete_expired" ||
          status === "paused"
        ) {
          await applyFreeTier(userId);
        }
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object;
        const userId = sub.metadata?.userId;
        await applyFreeTier(userId);
        break;
      }
      default:
        break;
    }
  } catch (err) {
    console.error("stripe webhook handler:", err?.message || err);
    return res.status(500).json({ received: false });
  }

  res.json({ received: true });
}
