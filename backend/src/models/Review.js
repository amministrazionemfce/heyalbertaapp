import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    listingId: { type: String },
    vendorId: {
      type: String,
      required: true
    },
    userId: {
      type: String,
      required: true
    },

    userName: {
      type: String,
      required: true
    },

    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true
    },

    comment: {
      type: String,
      required: true
    },

    reply: {
      type: String,
      default: null
    },

    createdAt: {
      type: String,
      default: () => new Date().toISOString()
    }
  },
  { versionKey: false }
);

reviewSchema.virtual("id").get(function () {
  return this._id.toString();
});
reviewSchema.set("toJSON", { virtuals: true });
reviewSchema.set("toObject", { virtuals: true });

export default mongoose.model("Review", reviewSchema);