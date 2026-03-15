import mongoose from "mongoose";

const vendorSchema = new mongoose.Schema({
  userId: String,
  name: String,
  description: String,
  category: String,
  city: String,
  neighborhood: String,
  phone: String,
  email: String,
  website: String,
  images: [String],
  tier: String,
  videoUrl: String,
  verified: { type: Boolean, default: false },
  featured: { type: Boolean, default: false },
  status: String,
  createdAt: String
});

vendorSchema.virtual("id").get(function () {
  return this._id.toString();
});
vendorSchema.set("toJSON", { virtuals: true });
vendorSchema.set("toObject", { virtuals: true });

export default mongoose.model("Vendor", vendorSchema);