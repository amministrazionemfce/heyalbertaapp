import { Link } from 'react-router-dom';
import { MapPin, Star, Heart } from 'lucide-react';
import { CATEGORIES } from '../data/categories';
import { listingPath } from '../constants';
import { getListingCoverImageUrl } from '../lib/listingCover';
import { resolveMediaUrl } from '../lib/mediaUrl';
import { useListingFavorite } from '../lib/listingFavorites';

/**
 * Featured listing tile — image, badges, location, reviews, feature tags.
 */
export default function FeaturedListingCard({ listing }) {
  const vendor = listing.vendor || {};
  const categoryName = CATEGORIES.find((c) => c.id === listing.categoryId)?.name || listing.categoryId;
  const reviewCount = listing.reviewCount ?? 0;
  const features = Array.isArray(listing.features) ? listing.features : [];
  const cover = getListingCoverImageUrl(listing);
  const img =
    resolveMediaUrl(cover) ||
    cover ||
    vendor.images?.[0] ||
    (typeof vendor.images === 'string' ? vendor.images : null) ||
    '/services/1.jpg';

  const { favorited, toggleFavorite } = useListingFavorite(listing.id);

  const locationLine = [vendor.city, 'Alberta'].filter(Boolean).join(', ');
  const tagsLine =
    features.length > 0
      ? features.slice(0, 4).join(' • ')
      : [categoryName, 'Alberta'].filter(Boolean).join(' • ');

  return (
    <div
      className="group relative flex h-full flex-col isolate overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-md transition-shadow duration-300 hover:shadow-xl hover:ring-black/10"
      data-testid={`featured-listing-card-${listing.id}`}
    >
      <Link
        to={listingPath(listing.id)}
        className="absolute inset-0 z-0 rounded-2xl"
        aria-label={`View listing: ${listing.title}`}
      />

      <div className="relative z-10 flex flex-1 flex-col pointer-events-none">
        <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
          <img
            src={img}
            alt=""
            className="h-full w-full object-cover transition-transform duration-500 [transform:translateZ(0)] will-change-transform group-hover:scale-[1.03]"
            loading="lazy"
          />
          <div className="absolute left-3 top-3 z-10 flex items-center gap-2">
            <span className="rounded-lg bg-yellow-600 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-white shadow-sm">
              Featured
            </span>
          </div>
          <button
            type="button"
            onClick={toggleFavorite}
            className={`absolute right-3 top-3 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-white/80 bg-white/95 shadow-md backdrop-blur transition-colors pointer-events-auto ${
              favorited ? 'text-red-500' : 'text-red-700'
            }`}
            aria-label={favorited ? 'Remove from favorites' : 'Save to favorites'}
          >
            <Heart className={`h-4 w-4 ${favorited ? 'fill-current' : ''}`} />
          </button>
        </div>

        <div className="flex flex-1 flex-col p-4">
          <h3 className="font-heading line-clamp-2 min-h-[2.75rem] text-base font-bold leading-snug text-slate-900 group-hover:text-spruce-800">
            {listing.title}
          </h3>

          <div className="mt-3 flex items-start justify-between gap-2 text-sm">
            <div className="flex min-w-0 flex-1 items-center gap-1.5 text-spruce-700">
              <MapPin className="h-4 w-4 shrink-0" aria-hidden />
              <span className="truncate font-medium">{locationLine}</span>
            </div>
            <div className="flex shrink-0 items-center gap-0.5 text-amber-500">
              <Star className="h-4 w-4 fill-amber-400 text-amber-500" aria-hidden />
              <span className="text-xs font-semibold text-slate-600">({reviewCount})</span>
            </div>
          </div>

          <p className="mt-3 line-clamp-1 text-xs text-slate-500">{tagsLine}</p>
        </div>
      </div>
    </div>
  );
}
