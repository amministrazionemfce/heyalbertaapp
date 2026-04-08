import mongoose from "mongoose";

const siteSettingsSchema = new mongoose.Schema(
  {
    _id: { type: String, default: "default" },
    newsHeroImage: { type: String, default: "" },
    aboutHeroImage: { type: String, default: "/about.jpeg" },
    contactHeroImage: { type: String, default: "/support.jpeg" },
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
    newsCtaPrimaryText: { type: String, default: "Subscribe for news" },
    /** Use "__subscribe__" to open the email subscribe modal on the News page (recommended). */
    newsCtaPrimaryLink: { type: String, default: "__subscribe__" },
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
    /** Admin-editable display prices for public membership cards (does not change Stripe billing). */
    membershipPriceStandardMonthlyUsd: { type: Number },
    membershipPriceStandardYearlyUsd: { type: Number },
    membershipPricePremiumMonthlyUsd: { type: Number },
    membershipPricePremiumYearlyUsd: { type: Number },
    /** Home page testimonials (“What People Say About Us”) */
    homeTestimonialsHeading: { type: String, default: "" },
    /** Email verification templates (transactional) */
    emailVerificationEmailSubject: { type: String, default: "" },
    emailVerificationEmailBody: { type: String, default: "" },
    /** Public site maintenance (non-admins see maintenance UI; admins bypass). */
    maintenanceMode: { type: Boolean, default: false },
    maintenanceMessage: { type: String, default: "" },
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
