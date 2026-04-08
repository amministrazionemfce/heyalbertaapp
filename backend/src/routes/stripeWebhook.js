import Stripe from "stripe";
import {
  reconcileUserBillingFromStripeCustomer,
  cancelOtherSubscriptionsForCustomer,
  applyPaidPlanToUser,
} from "../utils/stripeUserBilling.js";
import User from "../models/User.js";

function getStripe() {
  const key = String(process.env.STRIPE_SECRET_KEY || "").trim();
  if (!key || key.startsWith("pk_")) return null;
  try {
    return new Stripe(key);
  } catch {
    return null;
  }
}

function sessionSubscriptionId(session) {
  const s = session?.subscription;
  if (typeof s === "string" && s.startsWith("sub_")) return s;
  if (s && typeof s === "object" && typeof s.id === "string") return s.id;
  return null;
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
        const customerId = session.customer;
        const newSubId = sessionSubscriptionId(session);
        if (userId && customerId && newSubId) {
          await cancelOtherSubscriptionsForCustomer(stripe, customerId, newSubId);
          await reconcileUserBillingFromStripeCustomer(stripe, customerId, userId);
        } else if (userId) {
          const planId = session.metadata?.planId;
          if (planId === "standard" || planId === "premium") {
            await applyPaidPlanToUser(userId, planId);
          }
        }
        break;
      }
      case "customer.subscription.updated": {
        const sub = event.data.object;
        const customerId = sub.customer;
        const userId = sub.metadata?.userId;
        if (userId && customerId) {
          await reconcileUserBillingFromStripeCustomer(stripe, customerId, userId);
          break;
        }
        if (customerId) {
          try {
            const customer = await stripe.customers.retrieve(String(customerId));
            const email = String(customer?.email || "").trim().toLowerCase();
            if (email) {
              const u = await User.findOne({ email }).select("_id").lean();
              if (u?._id) {
                await reconcileUserBillingFromStripeCustomer(stripe, customerId, String(u._id));
              }
            }
          } catch (e) {
            console.error("stripe webhook reconcile fallback (updated):", e?.message || e);
          }
        }
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object;
        const customerId = sub.customer;
        const userId = sub.metadata?.userId;
        if (userId && customerId) {
          await reconcileUserBillingFromStripeCustomer(stripe, customerId, userId);
          break;
        }
        if (customerId) {
          try {
            const customer = await stripe.customers.retrieve(String(customerId));
            const email = String(customer?.email || "").trim().toLowerCase();
            if (email) {
              const u = await User.findOne({ email }).select("_id").lean();
              if (u?._id) {
                await reconcileUserBillingFromStripeCustomer(stripe, customerId, String(u._id));
              }
            }
          } catch (e) {
            console.error("stripe webhook reconcile fallback (deleted):", e?.message || e);
          }
        }
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
