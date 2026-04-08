import mongoose from "mongoose";

const promotionSendSchema = new mongoose.Schema({
  promotionId: { type: mongoose.Schema.Types.ObjectId, ref: "Promotion", required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  sentAt: { type: Date, default: Date.now },
});

promotionSendSchema.index({ promotionId: 1, userId: 1 }, { unique: true });
promotionSendSchema.index({ promotionId: 1 });

export default mongoose.model("PromotionSend", promotionSendSchema);
