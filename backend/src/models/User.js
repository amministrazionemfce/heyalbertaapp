import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true
  },
  passwordHash: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  role: {
    type: String,
    default: "user"
  },
  /** Stripe subscription tier (free | standard | premium). Mirrors listings after sync; used when user has no listings yet. */
  billingTier: {
    type: String,
    enum: ["free", "standard", "premium"],
    default: "free",
  },
  avatar_url: { type: String },
  emailVerified: { type: Boolean, default: false },
  emailVerificationToken: { type: String },
  emailVerificationTokenExpires: { type: Date },
  passwordResetToken: { type: String },
  passwordResetExpires: { type: Date },
  createdAt: String,
  /** Updated on login and when the client loads /auth/me */
  lastActiveAt: { type: Date },
  /** Admin promotion: Standard-equivalent access until this instant (UTC). */
  promoStandardExpiresAt: { type: Date },
});

userSchema.virtual("id").get(function () {
  return this._id.toString();
});
userSchema.set("toJSON", {
  virtuals: true,
  transform: (doc, ret) => {
    delete ret.passwordHash;
    delete ret.emailVerificationToken;
    delete ret.emailVerificationTokenExpires;
    return ret;
  },
});
userSchema.set("toObject", { virtuals: true });

export default mongoose.model("User", userSchema);