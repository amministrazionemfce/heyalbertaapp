import mongoose from "mongoose";

const newsSubscriberSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 320,
    },
    createdAt: { type: String, default: () => new Date().toISOString() },
  },
  { versionKey: false }
);

export default mongoose.model("NewsSubscriber", newsSubscriberSchema);
