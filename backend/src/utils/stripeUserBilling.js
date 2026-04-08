import mongoose from "mongoose";
import Listing from "../models/Listing.js";
import User from "../models/User.js";
import {
  bestPaidPlanFromSubscriptions,
  planIdFromStripeSubscription,
} from "./stripePlan.js";
import { setFeaturedForPaidUser, applyFreeStripeTierToUser } from "./membershipFeatured.js";

export async function applyPaidPlanToUser(userId, planId) {
  if (!userId || (planId !== "standard" && planId !== "premium")) return;
  const uid = String(userId);
  const oid = mongoose.Types.ObjectId.isValid(uid) ? new mongoose.Types.ObjectId(uid) : uid;
  await Listing.updateMany({ userId: uid }, { $set: { tier: planId } });
  await User.updateOne({ _id: oid }, { $set: { billingTier: planId } });
  await setFeaturedForPaidUser(uid);
}

export async function applyFreePlanToUser(userId) {
  await applyFreeStripeTierToUser(String(userId || ""));
}

export async function listActiveAndTrialingSubscriptions(stripe, customerId) {
  const cid = String(customerId || "").trim();
  if (!cid) return [];
  const [active, trialing] = await Promise.all([
    stripe.subscriptions.list({ customer: cid, status: "active", limit: 100 }),
    stripe.subscriptions.list({ customer: cid, status: "trialing", limit: 100 }),
  ]);
  return [...active.data, ...trialing.data];
}

/**
 * Set DB billing tier from Stripe truth for this customer (handles multiple subs, cancel, downgrade).
 */
export async function reconcileUserBillingFromStripeCustomer(stripe, customerId, userId) {
  const subs = await listActiveAndTrialingSubscriptions(stripe, customerId);
  const best = bestPaidPlanFromSubscriptions(subs);
  if (best === "standard" || best === "premium") {
    await applyPaidPlanToUser(userId, best);
  } else {
    await applyFreePlanToUser(userId);
  }
}

/**
 * After a new subscription checkout, cancel every other active/trialing subscription for the same customer
 * so only one paid plan applies (fixes duplicate Standard+Gold both active).
 */
/**
 * Keep a single “winning” subscription: drop lower tiers, then dedupe same tier (newest wins).
 * Call when Stripe has multiple active subs so the site matches one plan.
 */
export async function pruneCustomerDuplicateSubscriptions(stripe, customerId) {
  const cid = String(customerId || "").trim();
  if (!cid) return;

  let all = await listActiveAndTrialingSubscriptions(stripe, cid);
  let best = bestPaidPlanFromSubscriptions(all);
  if (best === "free") return;

  const bestR = best === "premium" ? 2 : 1;

  function rankOfSub(sub) {
    const p = planIdFromStripeSubscription(sub);
    if (p === "premium") return 2;
    if (p === "standard") return 1;
    return 0;
  }

  for (const sub of all) {
    if (rankOfSub(sub) < bestR) {
      try {
        await stripe.subscriptions.cancel(sub.id);
      } catch (err) {
        console.error(`prune cancel lower-tier sub ${sub.id}:`, err?.message || err);
      }
    }
  }

  all = await listActiveAndTrialingSubscriptions(stripe, cid);
  const topTierSubs = all.filter((s) => rankOfSub(s) === bestR);
  if (topTierSubs.length <= 1) return;
  topTierSubs.sort((a, b) => (b.created || 0) - (a.created || 0));
  for (let i = 1; i < topTierSubs.length; i++) {
    try {
      await stripe.subscriptions.cancel(topTierSubs[i].id);
    } catch (err) {
      console.error(`prune cancel duplicate sub ${topTierSubs[i].id}:`, err?.message || err);
    }
  }
}

export async function cancelOtherSubscriptionsForCustomer(stripe, customerId, keepSubscriptionId) {
  const keep = String(keepSubscriptionId || "").trim();
  const cid = String(customerId || "").trim();
  if (!keep || !cid) return;

  for (const status of ["active", "trialing"]) {
    const subs = await stripe.subscriptions.list({ customer: cid, status, limit: 100 });
    for (const sub of subs.data) {
      if (sub.id === keep) continue;
      try {
        await stripe.subscriptions.cancel(sub.id);
      } catch (err) {
        console.error(`stripe cancel subscription ${sub.id}:`, err?.message || err);
      }
    }
  }
}
