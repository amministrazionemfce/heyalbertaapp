export function listingFormValidation(data) {
  const errors = {};
  const title = (data.title || '').trim();
  if (!title) errors.title = 'Title is required';
  else if (title.length < 2) errors.title = 'Title must be at least 2 characters';

  const desc = (data.description || '').trim();
  if (!desc) errors.description = 'Description is required';
  else if (desc.length < 10) errors.description = 'Description must be at least 10 characters';

  if (!(data.categoryId || '').trim()) errors.categoryId = 'Please select a category';

  const status = (data.status || '').trim();
  if (!status) errors.status = 'Please select a status';

  const price = (data.price != null ? String(data.price) : '').trim();
  if (!price) errors.price = 'Price is required (e.g. $99, From $50/hr, or Contact for quote)';

  const images = Array.isArray(data.images) ? data.images : [];
  if (images.length === 0) errors.images = 'Add at least one image';

  const coverIdx = Number(data.coverImageIndex);
  const idx = Number.isFinite(coverIdx) ? Math.floor(coverIdx) : 0;
  if (images.length > 0 && (idx < 0 || idx >= images.length)) {
    errors.coverImageIndex = 'Choose which image is the cover';
  }

  if (data.videoUrl && String(data.videoUrl).trim()) {
    const u = String(data.videoUrl).trim();
    if (!/^https?:\/\/.+/i.test(u) && !u.startsWith('/uploads')) {
      errors.videoUrl = 'Video must be a valid URL (https://…) or an uploaded file.';
    }
  }

  return errors;
}

export function hasListingFormErrors(errors) {
  return Object.values(errors).some(Boolean);
}
