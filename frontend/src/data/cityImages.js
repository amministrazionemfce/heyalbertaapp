import { resolveMediaUrl } from '../lib/mediaUrl';

/**
 * Hero-style images for Alberta city cards (Unsplash).
 */
const FALLBACK =
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1200&q=80';

export const CITY_IMAGES = {
  Calgary:
    'https://images.unsplash.com/photo-1580741823496-8d4f5e7d0e8c?auto=format&fit=crop&w=1200&q=80',
  Edmonton:
    'https://images.unsplash.com/photo-1572949645841-094daf0a714c?auto=format&fit=crop&w=1200&q=80',
  'Red Deer':
    'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1200&q=80',
  Lethbridge:
    'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&w=1200&q=80',
  'Medicine Hat':
    'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=1200&q=80',
  'Grande Prairie':
    'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1200&q=80',
  Airdrie:
    'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?auto=format&fit=crop&w=1200&q=80',
  'Spruce Grove':
    'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80',
  'St. Albert':
    'https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=1200&q=80',
  Okotoks:
    'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?auto=format&fit=crop&w=1200&q=80',
  Leduc:
    'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1200&q=80',
  Cochrane:
    'https://images.unsplash.com/photo-1501785883141-73c86c1bdc43?auto=format&fit=crop&w=1200&q=80',
  'Fort McMurray':
    'https://images.unsplash.com/photo-1519904981063-b0cf448d479e?auto=format&fit=crop&w=1200&q=80',
  Camrose:
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=1200&q=80',
  Banff:
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1200&q=80',
};

export function getCityImageUrl(cityName, overrides) {
  const key = String(cityName || '').trim();
  const lower = key.toLowerCase();
  const o = overrides || {};
  const slugKey = lower.replace(/\s+/g, '-');
  const pick = (v) => {
    const s = typeof v === 'string' ? v.trim() : '';
    return s || undefined;
  };
  // Overrides from API are lower-cased in ExploreAlbertaCitiesSection; also accept slug keys.
  const raw =
    pick(o[key]) ||
    pick(o[lower]) ||
    pick(o[slugKey]) ||
    CITY_IMAGES[key] ||
    FALLBACK;
  return resolveMediaUrl(raw) || raw;
}
