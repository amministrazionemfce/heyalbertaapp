const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function listingValidation(data) {
  const errors = {};
  const ls = String(data.listingStatus || 'published').trim();
  if (ls !== 'draft' && ls !== 'published') {
    errors.listingStatus = 'Choose Draft or Published';
  }
  if (!data.name || (data.name && data.name.trim().length < 2))
    errors.name = 'Listing title must be at least 2 characters';
  if (!data.description || (data.description && data.description.trim().length < 10))
    errors.description = 'Description must be at least 10 characters';
  if (!data.category)
    errors.category = 'Please select a category';
  if (!data.city)
    errors.city = 'Please select a city';
  const price = (data.price != null ? String(data.price) : '').trim();
  if (!price) {
    errors.price = 'Price is required (e.g. $99, From $50/hr, or Contact for quote)';
  }
  if (data.email && data.email.trim() && !emailRegex.test(data.email.trim()))
    errors.email = 'Enter a valid email address';
  if (data.website && data.website.trim() && !/^https?:\/\/.+/.test(data.website.trim()))
    errors.website = 'Website must start with http:// or https://';
  if (data.videoUrl && data.videoUrl.trim()) {
    const u = data.videoUrl.trim();
    if (!/^https?:\/\/.+/i.test(u) && !u.startsWith('/uploads')) {
      errors.videoUrl = 'Video must be a valid URL (https://...) or an uploaded file.';
    }
  }
  if (data.googleMapUrl && data.googleMapUrl.trim()) {
    const m = data.googleMapUrl.trim();
    if (!/^https?:\/\/.+/i.test(m)) {
      errors.googleMapUrl = 'Google map URL must start with http:// or https://';
    }
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
  if (!data.googleMapUrl && (data.latitude === '' || data.latitude == null) !== (data.longitude === '' || data.longitude == null)) {
    errors.longitude = errors.longitude || 'Provide both latitude and longitude';
  }
  return errors;
}

export function hasListingErrors(errors) {
  return Object.values(errors).some(Boolean);
}
