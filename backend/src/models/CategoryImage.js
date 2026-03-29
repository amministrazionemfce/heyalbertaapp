import mongoose from "mongoose";

const categoryImageSchema = new mongoose.Schema(
  {
    categoryId: { type: String, required: true, unique: true, trim: true },
    imageUrl: { type: String, required: true, default: "" },
  },
  { timestamps: true }
);

categoryImageSchema.virtual("id").get(function () {
  return this._id.toString();
});
categoryImageSchema.set("toJSON", { virtuals: true });
categoryImageSchema.set("toObject", { virtuals: true });

export default mongoose.model("CategoryImage", categoryImageSchema);

