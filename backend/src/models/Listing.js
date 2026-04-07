import mongoose from "mongoose";

/**
 * Directory listing owned by `userId`. No vendor document — do not store vendorId.
 */
const openingHoursShape = {
  monday: String,
  tuesday: String,
  wednesday: String,
  thursday: String,
  friday: String,
  saturday: String,
  sunday: String,
};

const listingSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  categoryId: { type: String, required: true },
  title: { type: String, required: true },
  /** Public-facing business / brand name (optional); shown on cards when set. */
  businessName: { type: String, default: "" },
  description: { type: String, required: true },
  /** draft | published — visibility when seller is approved */
  status: { type: String, required: true, default: "draft" },
  /** pending | approved | rejected — admin moderation */
  sellerStatus: { type: String, default: "pending" },
  featured: { type: Boolean, required: true, default: false },
  tier: { type: String, default: "free" },
  features: { type: [String], default: [] },
  images: { type: [String], default: [] },
  coverImageIndex: { type: Number, default: 0 },
  videoUrl: { type: String, default: "" },
  price: { type: String, default: "" },
  city: { type: String, default: "" },
  neighborhood: { type: String, default: "" },
  phone: { type: String, default: "" },
  email: { type: String, default: "" },
  website: { type: String, default: "" },
  googleMapUrl: { type: String, default: "" },
  latitude: { type: Number },
  longitude: { type: Number },
  openingHours: { type: openingHoursShape, default: {} },
  /** When true, opening hours are shown on the public listing page */
  showOpeningHours: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

listingSchema.set("strict", true);

listingSchema.virtual("id").get(function () {
  return this._id.toString();
});
listingSchema.set("toJSON", { virtuals: true });
listingSchema.set("toObject", { virtuals: true });

export default mongoose.model("Listing", listingSchema);
