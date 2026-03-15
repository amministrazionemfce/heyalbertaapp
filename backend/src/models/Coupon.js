import mongoose from "mongoose";

const couponSchema = new mongoose.Schema({
  vendorId: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String },
  discountPercent: { type: Number, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now }
});

couponSchema.virtual("id").get(function () {
  return this._id.toString();
});
couponSchema.set("toJSON", { virtuals: true });
couponSchema.set("toObject", { virtuals: true });

export default mongoose.model("Coupon", couponSchema);
