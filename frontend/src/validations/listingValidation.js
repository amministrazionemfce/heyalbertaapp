const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function listingValidation(data) {
  const errors = {};
  if (!data.name || (data.name && data.name.trim().length < 2))
    errors.name = 'Business name must be at least 2 characters';
  if (!data.description || (data.description && data.description.trim().length < 10))
    errors.description = 'Description must be at least 10 characters';
  if (!data.category)
    errors.category = 'Please select a category';
  if (!data.city)
    errors.city = 'Please select a city';
  if (data.email && data.email.trim() && !emailRegex.test(data.email.trim()))
    errors.email = 'Enter a valid email address';
  if (data.website && data.website.trim() && !/^https?:\/\/.+/.test(data.website.trim()))
    errors.website = 'Website must start with http:// or https://';
  return errors;
}

export function hasListingErrors(errors) {
  return Object.values(errors).some(Boolean);
}
