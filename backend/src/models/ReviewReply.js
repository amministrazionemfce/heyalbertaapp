import mongoose from "mongoose";

const reviewReplySchema = new mongoose.Schema({
  reviewId: { type: String, required: true },
  vendorId: { type: String, required: true },
  reply: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

reviewReplySchema.virtual("id").get(function () {
  return this._id.toString();
});
reviewReplySchema.set("toJSON", { virtuals: true });
reviewReplySchema.set("toObject", { virtuals: true });

export default mongoose.model("ReviewReply", reviewReplySchema);
