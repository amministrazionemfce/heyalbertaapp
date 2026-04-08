import mongoose from "mongoose";

const promotionRedemptionSchema = new mongoose.Schema({
  promotionId: { type: mongoose.Schema.Types.ObjectId, ref: "Promotion", required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  redeemedAt: { type: Date, default: Date.now },
  /** Copy of expiry at redemption (user.promoStandardExpiresAt matches while active) */
  expiresAt: { type: Date, required: true },
});

promotionRedemptionSchema.index({ promotionId: 1, userId: 1 }, { unique: true });

export default mongoose.model("PromotionRedemption", promotionRedemptionSchema);
