import mongoose from "mongoose";

const listingSchema = new mongoose.Schema({
  vendorId: { type: String, required: true },
  categoryId: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  status: { type: String, required: true, default: "draft" },
  featured: { type: Boolean, required: true, default: false },
  features: { type: [String], default: [] },
  createdAt: { type: Date, default: Date.now }
});

listingSchema.virtual("id").get(function () {
  return this._id.toString();
});
listingSchema.set("toJSON", { virtuals: true });
listingSchema.set("toObject", { virtuals: true });

export default mongoose.model("Listing", listingSchema);
