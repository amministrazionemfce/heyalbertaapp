import mongoose from "mongoose";

const promotionSchema = new mongoose.Schema({
  /** Uppercase unique code users enter (e.g. SUMMER2025) */
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  /** Admin-only label for the list */
  label: { type: String, default: "" },
  /** Standard-access length after a user redeems (from redemption moment) */
  durationDays: { type: Number, required: true, min: 1, max: 3650 },
  /** Optional: codes cannot be redeemed after this instant (UTC) */
  redeemBy: { type: Date },
  active: { type: Boolean, default: true },
  /** Optional system notification created/managed alongside this promotion. */
  systemNotificationId: { type: mongoose.Schema.Types.ObjectId, ref: "SystemNotification" },
  systemNotification: {
    enabled: { type: Boolean, default: false },
    title: { type: String, default: "" },
    message: { type: String, default: "" },
    variant: { type: String, enum: ["info", "warning", "danger"], default: "info" },
  },
  createdAt: { type: Date, default: Date.now },
});

promotionSchema.index({ code: 1 });

export default mongoose.model("Promotion", promotionSchema);
