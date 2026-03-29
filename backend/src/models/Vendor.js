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
  coverImageIndex: { type: Number, default: 0 },
  tier: String,
  videoUrl: String,
  googleMapUrl: String,
  latitude: Number,
  longitude: Number,
  verified: { type: Boolean, default: false },
  featured: { type: Boolean, default: false },
  status: String,
  createdAt: String,
  tags: { type: [String], default: [] },
  openingHours: {
    monday: String,
    tuesday: String,
    wednesday: String,
    thursday: String,
    friday: String,
    saturday: String,
    sunday: String,
  },
});

vendorSchema.virtual("id").get(function () {
  return this._id.toString();
});
vendorSchema.set("toJSON", { virtuals: true });
vendorSchema.set("toObject", { virtuals: true });

export default mongoose.model("Vendor", vendorSchema);