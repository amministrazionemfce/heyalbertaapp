import { useState, useEffect, useCallback } from 'react';

export const FAV_KEY = 'hey_alberta_favorite_listings';

export function readFavoriteIds() {
  try {
    const raw = localStorage.getItem(FAV_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function toggleFavoriteId(listingId) {
  const next = [...readFavoriteIds()];
  const idx = next.indexOf(listingId);
  if (idx >= 0) next.splice(idx, 1);
  else next.push(listingId);
  localStorage.setItem(FAV_KEY, JSON.stringify(next));
  return idx < 0;
}

export function useListingFavorite(listingId) {
  const [favorited, setFavorited] = useState(false);

  useEffect(() => {
    setFavorited(readFavoriteIds().includes(listingId));
  }, [listingId]);

  const toggleFavorite = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      setFavorited(toggleFavoriteId(listingId));
    },
    [listingId]
  );

  return { favorited, toggleFavorite };
}
