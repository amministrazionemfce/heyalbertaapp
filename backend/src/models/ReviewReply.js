import mongoose from "mongoose";

/** Reply to a review (review is scoped to a listing). */
const reviewReplySchema = new mongoose.Schema({
  reviewId: { type: String, required: true },
  listingId: { type: String, required: true },
  reply: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

reviewReplySchema.virtual("id").get(function () {
  return this._id.toString();
});
reviewReplySchema.set("toJSON", { virtuals: true });
reviewReplySchema.set("toObject", { virtuals: true });
reviewReplySchema.set("strict", true);

export default mongoose.model("ReviewReply", reviewReplySchema);
