import mongoose from "mongoose";

const emailCampaignSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  scheduled_at: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now }
});

emailCampaignSchema.virtual("id").get(function () {
  return this._id.toString();
});
emailCampaignSchema.set("toJSON", { virtuals: true });
emailCampaignSchema.set("toObject", { virtuals: true });

export default mongoose.model("EmailCampaign", emailCampaignSchema);
