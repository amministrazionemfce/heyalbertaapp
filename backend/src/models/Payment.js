import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  amount: { type: Number, required: true },
  currency: { type: String, required: true, default: "CAD" },
  stripePaymentId: { type: String },
  status: { type: String, required: true, default: "pending" },
  createdAt: { type: Date, default: Date.now },
});

paymentSchema.virtual("id").get(function () {
  return this._id.toString();
});
paymentSchema.set("toJSON", { virtuals: true });
paymentSchema.set("toObject", { virtuals: true });
paymentSchema.set("strict", true);

export default mongoose.model("Payment", paymentSchema);
