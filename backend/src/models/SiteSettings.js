import mongoose from "mongoose";

const siteSettingsSchema = new mongoose.Schema(
  {
    _id: { type: String, default: "default" },
    newsHeroImage: { type: String, default: "news.png" },
    aboutHeroImage: { type: String, default: "/lake.png" },
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
    /** Review notification email templates (sent to vendors) */
    reviewNotificationEmailSubject: { type: String, default: "" },
    reviewNotificationEmailBody: { type: String, default: "" },
    /** Privacy Policy and Terms of Service documents */
    privacyPolicyContent: { 
      type: String, 
      default: "# Privacy Policy\n\nYour privacy is important to us. This Privacy Policy explains how Hey Alberta collects, uses, and protects your personal information.\n\n## Information We Collect\n\nWe collect information that you provide directly to us, such as when you create an account, post a listing, or contact us. This may include your name, email address, phone number, and business information.\n\n## How We Use Your Information\n\nWe use the information we collect to provide, maintain, and improve our services, process payments, and communicate with you.\n\n## Data Protection\n\nWe implement appropriate technical and organizational measures to protect your personal information from unauthorized access, alteration, disclosure, or destruction.\n\n## Third-Party Services\n\nWe use third-party service providers such as Stripe for payment processing. These providers are bound by confidentiality agreements and are not permitted to use your information for any purpose other than to provide services to us.\n\n## Your Rights\n\nYou have the right to access, update, or delete your personal information at any time by logging into your account or contacting us.\n\n## Contact Us\n\nIf you have any questions about this Privacy Policy, please contact us at hello@heyalberta.ca.\n"
    },
    termsOfServiceContent: {
      type: String,
      default: "# Terms of Service\n\nThese Terms of Service govern your use of the Hey Alberta website and services.\n\n## Acceptance of Terms\n\nBy accessing and using Hey Alberta, you accept and agree to be bound by these Terms of Service.\n\n## User Responsibilities\n\nYou are responsible for maintaining the confidentiality of your account and password. You agree to be responsible for all activity that occurs under your account.\n\n## Content Ownership\n\nYou retain ownership of all content you post on Hey Alberta. By posting content, you grant Hey Alberta a non-exclusive, royalty-free license to display your content.\n\n## Prohibited Content\n\nYou may not post content that is illegal, harassing, threatening, abusive, or defamatory. You may not post duplicate listings or engage in spam.\n\n## Payment Terms\n\nSome services on Hey Alberta require payment. Prices are subject to change with notice. All charges are processed through Stripe and are subject to their terms.\n\n## Limitation of Liability\n\nHey Alberta is provided \"as is\" without warranties. Hey Alberta shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the service.\n\n## Termination\n\nWe reserve the right to suspend or terminate your account if you violate these Terms of Service.\n\n## Changes to Terms\n\nWe may modify these Terms of Service at any time. Your continued use of Hey Alberta following the posting of revised Terms of Service means that you accept and agree to the changes.\n\n## Contact Us\n\nIf you have questions about these Terms of Service, please contact us at hello@heyalberta.ca.\n"
    },
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
    /** System theme colors */
    themeColors: {
      type: {
        primary: { type: String, default: "#16a34a" },
        primaryDark: { type: String, default: "#166534" },
        accent: { type: String, default: "#ea580c" },
        text: { type: String, default: "#1e293b" },
        border: { type: String, default: "#e2e8f0" },
      },
      default: {
        primary: "#16a34a",
        primaryDark: "#166534",
        accent: "#ea580c",
        text: "#1e293b",
        border: "#e2e8f0",
      }
    },
  },
  { versionKey: false, timestamps: { createdAt: false, updatedAt: true } }
);

siteSettingsSchema.set("toJSON", { virtuals: true });
siteSettingsSchema.set("toObject", { virtuals: true });

export default mongoose.model("SiteSettings", siteSettingsSchema);
