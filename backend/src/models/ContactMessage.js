import mongoose from "mongoose";

const contactMessageSchema = new mongoose.Schema(
  {
    inquiryType: {
      type: String,
      enum: ["newcomer", "business"],
      required: true,
    },
    name: { type: String, required: true, trim: true, maxlength: 200 },
    email: { type: String, required: true, trim: true, maxlength: 320 },
    subject: { type: String, required: true, trim: true, maxlength: 300 },
    message: { type: String, required: true, trim: true, maxlength: 10000 },
    businessName: { type: String, trim: true, maxlength: 200, default: "" },
    businessAddress: { type: String, trim: true, maxlength: 500, default: "" },
    read: { type: Boolean, default: false },
    readAt: { type: Date, default: null },
  },
  { timestamps: true }
);

contactMessageSchema.index({ createdAt: -1 });
contactMessageSchema.index({ read: 1, createdAt: -1 });

contactMessageSchema.virtual("id").get(function () {
  return this._id.toString();
});
contactMessageSchema.set("toJSON", { virtuals: true });
contactMessageSchema.set("toObject", { virtuals: true });

export default mongoose.model("ContactMessage", contactMessageSchema);
