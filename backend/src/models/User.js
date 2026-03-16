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
  avatar_url: { type: String },
  emailVerified: { type: Boolean, default: false },
  emailVerificationToken: { type: String },
  emailVerificationTokenExpires: { type: Date },
  createdAt: String
});

// Expose id for API responses (frontend expects user.id)
userSchema.virtual("id").get(function () {
  return this._id.toString();
});
userSchema.set("toJSON", {
  virtuals: true,
  transform: (doc, ret) => {
    delete ret.passwordHash;
    return ret;
  },
});
userSchema.set("toObject", { virtuals: true });

export default mongoose.model("User", userSchema);