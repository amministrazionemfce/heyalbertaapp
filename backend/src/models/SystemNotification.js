import mongoose from "mongoose";

const systemNotificationSchema = new mongoose.Schema(
  {
    title: { type: String, default: "" },
    message: { type: String, required: true },
    /** info | warning | danger */
    variant: { type: String, enum: ["info", "warning", "danger"], default: "info" },
    /** When true, notification may show (subject to window below). */
    enabled: { type: Boolean, default: true },
    /** Optional window (UTC). If null, always eligible. */
    startsAt: { type: Date, default: null },
    endsAt: { type: Date, default: null },
  },
  { timestamps: true }
);

systemNotificationSchema.virtual("id").get(function () {
  return this._id.toString();
});

systemNotificationSchema.set("toJSON", { virtuals: true });
systemNotificationSchema.set("toObject", { virtuals: true });

export default mongoose.model("SystemNotification", systemNotificationSchema);

