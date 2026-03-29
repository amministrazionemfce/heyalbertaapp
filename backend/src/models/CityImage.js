import mongoose from "mongoose";

const cityImageSchema = new mongoose.Schema(
  {
    cityName: { type: String, required: true, unique: true, trim: true },
    imageUrl: { type: String, required: true, default: "" },
  },
  { timestamps: true }
);

cityImageSchema.virtual("id").get(function () {
  return this._id.toString();
});
cityImageSchema.set("toJSON", { virtuals: true });
cityImageSchema.set("toObject", { virtuals: true });

export default mongoose.model("CityImage", cityImageSchema);

