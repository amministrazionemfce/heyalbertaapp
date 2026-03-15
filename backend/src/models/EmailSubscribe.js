import mongoose from "mongoose";

const emailSubscribeSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now }
});

emailSubscribeSchema.virtual("id").get(function () {
  return this._id.toString();
});
emailSubscribeSchema.set("toJSON", { virtuals: true });
emailSubscribeSchema.set("toObject", { virtuals: true });

export default mongoose.model("EmailSubscribe", emailSubscribeSchema);
