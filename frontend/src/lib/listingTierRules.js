/**
 * Listing + vendor-directory entitlements by billing plan.
 * Backend enforcement: `backend/src/utils/listingTierCaps.js` (keep limits aligned).
 */
import { membershipPlanTierFromVendors } from './membershipTier';

export const FREE_LISTING_DESCRIPTION_MAX_WORDS = 75;

export function listingPlanFromVendorTier(tierRaw) {
  return membershipPlanTierFromVendors([{ tier: tierRaw }]);
}

export function listingPlanTierCapabilities(plan) {
  const p = plan === 'standard' || plan === 'premium' ? plan : 'free';
  if (p === 'free') {
    return {
      plan: 'free',
      label: 'Free',
      /** Max listings per account; null = no cap */
      maxListings: 1,
      maxDescriptionWords: FREE_LISTING_DESCRIPTION_MAX_WORDS,
      maxImages: 1,
      allowListingVideo: false,
      allowContactInListingDescription: false,
      allowVendorProfileContactFields: false,
      allowReviewReplies: false,
      priorityInCategoryAndCitySearch: false,
    };
  }
  if (p === 'standard') {
    return {
      plan: 'standard',
      label: 'Standard',
      maxListings: null,
      maxDescriptionWords: null,
      maxImages: null,
      allowListingVideo: true,
      allowContactInListingDescription: true,
      allowVendorProfileContactFields: true,
      allowReviewReplies: true,
      priorityInCategoryAndCitySearch: false,
    };
  }
  return {
    plan: 'premium',
    label: 'Gold',
    maxListings: null,
    maxDescriptionWords: null,
    maxImages: null,
    allowListingVideo: true,
    allowContactInListingDescription: true,
    allowVendorProfileContactFields: true,
    allowReviewReplies: true,
    priorityInCategoryAndCitySearch: true,
  };
}

export function countWords(text) {
  return String(text || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

export function descriptionHasBlockedContactPatterns(text) {
  const t = String(text || '');
  if (/\bhttps?:\/\//i.test(t)) return true;
  if (/\bwww\./i.test(t)) return true;
  if (/\btel:\s*/i.test(t)) return true;
  if (/\S+@\S+\.\S+/.test(t)) return true;
  // Phone-like sequences: require 8+ digits to reduce false positives.
  const phoneCandidates = t.match(/(\+?\d[\d\s().-]{6,}\d)/g) || [];
  for (const c of phoneCandidates) {
    const digitCount = String(c).replace(/\D/g, '').length;
    if (digitCount >= 8) return true;
  }
  return false;
}

/** Bullet lists for the vendor dashboard sidebar. */
export function getMembershipEntitlementsCopy(plan) {
  const cap = listingPlanTierCapabilities(plan);
  if (cap.plan === 'free') {
    return {
      headline: 'Your plan: Free',
      included: [
        'One listing on your account',
        `Up to ${FREE_LISTING_DESCRIPTION_MAX_WORDS} words in each listing description`,
        'One image per listing',
        'Publish listings when your company is approved',
      ],
      notIncluded: [
        'More than one listing (upgrade to Standard or Gold)',
        'Listing video or video links',
        'URLs or email addresses inside listing descriptions',
        'Phone, email, and website on your public profile (upgrade to show them)',
        'Review display on your public listing',
      ],
    };
  }
  if (cap.plan === 'standard') {
    return {
      headline: 'Your plan: Standard',
      included: [
        'Multiple listings on your account',
        'Long-form listing copy (no word cap)',
        'Multiple images per listing',
        'Embedded video (YouTube links, uploads, and other supported players)',
        'Phone, email, and website on your public profile',
        'Ability to display reviews',
      ],
      notIncluded: ['Priority ordering in category and city search results (Gold)'],
    };
  }
  return {
    headline: 'Your plan: Gold',
    included: [
      'Everything in Standard',
      'Priority placement in category and city search results',
    ],
    notIncluded: [],
  };
}
