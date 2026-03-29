import mongoose from "mongoose";

const siteSettingsSchema = new mongoose.Schema(
  {
    _id: { type: String, default: "default" },
    newsHeroImage: { type: String, default: "" },
    aboutHeroImage: { type: String, default: "" },
    contactHeroImage: { type: String, default: "" },
    /** About page — images shown in the Mission section (between copy and checkmarks) */
    aboutMissionImages: {
      type: [String],
      default: [],
    },
    /** Home page hero carousel slides (image + copy per slide) */
    homeHeroSlides: {
      type: [
        {
          imageUrl: { type: String, default: "" },
          headline: { type: String, default: "" },
          headlineLine2: { type: String, default: "" },
          subhead: { type: String, default: "" },
        },
      ],
      default: [],
    },
    newsHeadline: {
      type: String,
      default: "Life, Business, and Community in Alberta.",
    },
    newsSubhead: {
      type: String,
      default:
        "Your trusted source for moving tips, local stories, business highlights, and events across Alberta.",
    },
    newsCtaPrimaryText: { type: String, default: "Subscribe for weekly updates" },
    newsCtaPrimaryLink: { type: String, default: "/register" },
    newsCtaSecondaryText: { type: String, default: "List your business" },
    newsCtaSecondaryLink: { type: String, default: "/register" },
    /** Admin-editable copy for public membership tiers section */
    membershipEyebrow: { type: String, default: "" },
    membershipTitle: { type: String, default: "" },
    membershipSubtitle: { type: String, default: "" },
    membershipDescFree: { type: String, default: "" },
    membershipDescStandard: { type: String, default: "" },
    membershipDescPremium: { type: String, default: "" },
    membershipFeaturesFree: { type: String, default: "" },
    membershipFeaturesStandard: { type: String, default: "" },
    membershipFeaturesPremium: { type: String, default: "" },
    /** Home page testimonials (“What People Say About Us”) */
    homeTestimonialsHeading: { type: String, default: "" },
    homeTestimonials: {
      type: [
        {
          id: { type: String, default: "" },
          name: { type: String, default: "" },
          time: { type: String, default: "" },
          text: { type: String, default: "" },
          rating: { type: Number, default: 5 },
        },
      ],
      default: [],
    },
  },
  { versionKey: false, timestamps: { createdAt: false, updatedAt: true } }
);

siteSettingsSchema.set("toJSON", { virtuals: true });
siteSettingsSchema.set("toObject", { virtuals: true });

export default mongoose.model("SiteSettings", siteSettingsSchema);
