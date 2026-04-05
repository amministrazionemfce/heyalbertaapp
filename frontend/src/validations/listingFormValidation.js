import {
  FREE_LISTING_DESCRIPTION_MAX_WORDS,
  listingPlanTierCapabilities,
  countWords,
  descriptionHasBlockedContactPatterns,
} from '../lib/listingTierRules';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * @param {object} data - trimmed listing form fields
 * @param {'free'|'standard'|'premium'} [planTier] - from `membershipPlanTierFromVendors`
 */
export function listingFormValidation(data, planTier = 'free') {
  const cap = listingPlanTierCapabilities(planTier);
  const errors = {};
  const title = (data.title || '').trim();
  if (!title) errors.title = 'Title is required';
  else if (title.length < 2) errors.title = 'Title must be at least 2 characters';

  const desc = (data.description || '').trim();
  if (!desc) errors.description = 'Description is required';
  else if (desc.length < 10) errors.description = 'Description must be at least 10 characters';
  if (cap.maxDescriptionWords != null && countWords(desc) > cap.maxDescriptionWords) {
    errors.description = `Description is limited to ${FREE_LISTING_DESCRIPTION_MAX_WORDS} words on the Free plan.`;
  }
  if (!cap.allowContactInListingDescription && desc && descriptionHasBlockedContactPatterns(desc)) {
    errors.description = 'URLs and email addresses are not allowed in your listing description on the Free plan.';
  }

  if (!(data.categoryId || '').trim()) errors.categoryId = 'Please select a category';

  if (!(data.city || '').trim()) errors.city = 'Please select a city';

  const email = (data.email || '').trim();
  if (email && !emailRegex.test(email)) errors.email = 'Enter a valid email address';

  const website = (data.website || '').trim();
  if (website && !/^https?:\/\/.+/.test(website)) {
    errors.website = 'Website must start with http:// or https://';
  }

  const googleMapUrl = (data.googleMapUrl || '').trim();
  if (googleMapUrl && !/^https?:\/\/.+/i.test(googleMapUrl)) {
    errors.googleMapUrl = 'Google map URL must start with http:// or https://';
  }

  if (data.latitude !== '' && data.latitude !== undefined && data.latitude !== null) {
    const lat = Number(data.latitude);
    if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
      errors.latitude = 'Latitude must be between -90 and 90';
    }
  }
  if (data.longitude !== '' && data.longitude !== undefined && data.longitude !== null) {
    const lng = Number(data.longitude);
    if (!Number.isFinite(lng) || lng < -180 || lng > 180) {
      errors.longitude = 'Longitude must be between -180 and 180';
    }
  }
  if (
    !googleMapUrl &&
    (data.latitude === '' || data.latitude == null) !== (data.longitude === '' || data.longitude == null)
  ) {
    errors.longitude = errors.longitude || 'Provide both latitude and longitude, or leave both empty';
  }

  const status = (data.status || '').trim();
  if (!status) errors.status = 'Please select a status';
  else if (status !== 'draft' && status !== 'published') {
    errors.status = 'Status must be Draft or Published';
  }

  const price = (data.price != null ? String(data.price) : '').trim();
  if (!price) errors.price = 'Price is required (e.g. $99, From $50/hr, or Contact for quote)';

  const images = Array.isArray(data.images) ? data.images : [];
  if (images.length === 0) errors.images = 'Add at least one image';
  if (cap.maxImages != null && images.length > cap.maxImages) {
    errors.images = 'Your plan allows only one image per listing.';
  }

  const coverIdx = Number(data.coverImageIndex);
  const idx = Number.isFinite(coverIdx) ? Math.floor(coverIdx) : 0;
  if (images.length > 0 && (idx < 0 || idx >= images.length)) {
    errors.coverImageIndex = 'Choose which image is the cover';
  }

  if (data.videoUrl && String(data.videoUrl).trim()) {
    if (!cap.allowListingVideo) {
      errors.videoUrl = 'Video is not available on the Free plan.';
    } else {
      const u = String(data.videoUrl).trim();
      if (!/^https?:\/\/.+/i.test(u) && !u.startsWith('/uploads')) {
        errors.videoUrl = 'Video must be a valid URL (https://…) or an uploaded file.';
      }
    }
  }

  return errors;
}

export function hasListingFormErrors(errors) {
  return Object.values(errors).some(Boolean);
}
