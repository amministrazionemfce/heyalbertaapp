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
  if (/\S+@\S+\.\S+/.test(t)) return true;
  return false;
}

/** Bullet lists for the vendor dashboard sidebar. */
export function getMembershipEntitlementsCopy(plan) {
  const cap = listingPlanTierCapabilities(plan);
  if (cap.plan === 'free') {
    return {
      headline: 'Your plan: Free',
      included: [
        `Up to ${FREE_LISTING_DESCRIPTION_MAX_WORDS} words in each listing description`,
        'One image per listing',
        'Publish listings when your company is approved',
      ],
      notIncluded: [
        'Listing video or video links',
        'URLs or email addresses inside listing descriptions',
        'Phone, email, and website on your public profile (upgrade to show them)',
        'Replying to customer reviews',
      ],
    };
  }
  if (cap.plan === 'standard') {
    return {
      headline: 'Your plan: Standard',
      included: [
        'Long-form listing copy (no word cap)',
        'Multiple images per listing',
        'Embedded video (YouTube links, uploads, and other supported players)',
        'Phone, email, and website on your public profile',
        'Reply to reviews from your dashboard',
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
