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
      enum: ["checklist", "guide", "faq", "article", "news_category"]
    },

    content: {
      type: String,
      required: true
    },

    category: {
      type: String,
      default: "general"
    },

    imageUrl: { type: String, default: "" },
    excerpt: { type: String, default: "" },
    featured: { type: Boolean, default: false },
    sortOrder: { type: Number, default: 0 },
    linkUrl: { type: String, default: "" },
    publishedAt: { type: String, default: "" },
    authorLabel: { type: String, default: "" },
    /** When true, public news card shows only image, date, and Learn more (no title/excerpt). */
    hideCardText: { type: Boolean, default: false },

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