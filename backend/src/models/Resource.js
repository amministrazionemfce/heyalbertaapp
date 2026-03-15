import mongoose from "mongoose";

const resourceSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true
    },

    type: {
      type: String,
      required: true,
      enum: ["checklist", "guide", "faq"]
    },

    content: {
      type: String,
      required: true
    },

    category: {
      type: String,
      default: "general"
    },

    createdAt: {
      type: String,
      default: () => new Date().toISOString()
    }
  },
  { versionKey: false }
);

resourceSchema.virtual("id").get(function () {
  return this._id.toString();
});
resourceSchema.set("toJSON", { virtuals: true });
resourceSchema.set("toObject", { virtuals: true });

export default mongoose.model("Resource", resourceSchema);