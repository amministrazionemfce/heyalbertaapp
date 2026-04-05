/**
 * Cover image for cards and detail hero: listing images + coverImageIndex, else seller snapshot fallback.
 */
export function getListingCoverImageUrl(listing) {
  const imgs = Array.isArray(listing?.images) ? listing.images : [];
  if (imgs.length > 0) {
    const raw = Number(listing?.coverImageIndex);
    const idx = Number.isFinite(raw)
      ? Math.min(Math.max(0, Math.floor(raw)), imgs.length - 1)
      : 0;
    return imgs[idx] || imgs[0];
  }
  const s = listing?.seller || {};
  return s.images?.[0] || '';
}

/** Gallery order: cover image first, then remaining images (no duplicate). */
export function getListingGalleryImageUrls(listing) {
  const imgs = Array.isArray(listing?.images) ? listing.images : [];
  if (imgs.length === 0) {
    const fb = getListingCoverImageUrl(listing);
    return fb ? [fb] : [];
  }
  const raw = Number(listing?.coverImageIndex);
  const coverIdx = Number.isFinite(raw)
    ? Math.min(Math.max(0, Math.floor(raw)), imgs.length - 1)
    : 0;
  const cover = imgs[coverIdx];
  const rest = imgs.filter((_, i) => i !== coverIdx);
  return [cover, ...rest];
}
