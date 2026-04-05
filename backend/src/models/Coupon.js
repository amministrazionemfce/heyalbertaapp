import mongoose from "mongoose";

/** Optional seller-scoped coupon (owner is listing seller userId). */
const couponSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  listingId: { type: String, default: "" },
  title: { type: String, required: true },
  description: { type: String },
  discountPercent: { type: Number, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now },
});

couponSchema.virtual("id").get(function () {
  return this._id.toString();
});
couponSchema.set("toJSON", { virtuals: true });
couponSchema.set("toObject", { virtuals: true });
couponSchema.set("strict", true);

export default mongoose.model("Coupon", couponSchema);
