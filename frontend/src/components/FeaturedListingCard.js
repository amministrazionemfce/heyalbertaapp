import { Link } from 'react-router-dom';
import { MapPin, Star, ThumbsUp } from 'lucide-react';
import ListingCategoryLabel from './ListingCategoryLabel';
import { listingPath } from '../constants';
import { getListingCoverImageUrl } from '../lib/listingCover';
import { resolveMediaUrl } from '../lib/mediaUrl';
import { useListingFavorite } from '../lib/listingFavorites';

/** Five stars with partial fills — matches directory ListingCard. */
function StarRatingRow({ rating, className = '' }) {
  const r =
    rating == null || Number.isNaN(Number(rating))
      ? 0
      : Math.min(5, Math.max(0, Number(rating)));

  return (
    <div
      className={`flex items-center gap-0.5 ${className}`}
      role="img"
      aria-label={`${r.toFixed(1)} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((i) => {
        const fill = Math.min(Math.max(r - (i - 1), 0), 1);
        return (
          <span key={i} className="relative h-3.5 w-3.5 shrink-0">
            <Star
              className="absolute left-0 top-0 h-3.5 w-3.5 text-slate-200"
              fill="currentColor"
              strokeWidth={0}
              aria-hidden
            />
            <span
              className="absolute left-0 top-0 h-3.5 overflow-hidden text-amber-500"
              style={{ width: `${fill * 100}%` }}
            >
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" strokeWidth={0} aria-hidden />
            </span>
          </span>
        );
      })}
    </div>
  );
}

function plainTextExcerpt(raw) {
  return String(raw || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Home “Featured listings” tile — image + FEATURED ribbon, category row with favorite,
 * title, snippet, location, rating, price.
 */
export default function FeaturedListingCard({ listing }) {
  const seller = listing.seller || {};
  const reviewCount = listing.reviewCount ?? 0;
  const avgRating = listing.avgRating ?? listing.avg_rating;
  const cover = getListingCoverImageUrl(listing);
  const img =
    resolveMediaUrl(cover) ||
    cover ||
    seller.images?.[0] ||
    (typeof seller.images === 'string' ? seller.images : null) ||
    '/services/1.jpg';

  const { favorited, toggleFavorite } = useListingFavorite(listing.id);

  const locationLine = [seller.city, seller.neighborhood].filter(Boolean).join(', ');
  const descriptionPlain = plainTextExcerpt(listing.description);
  const priceStr = listing.price != null && String(listing.price).trim() ? String(listing.price).trim() : null;
  const ratingForStars =
    avgRating != null && !Number.isNaN(Number(avgRating)) ? Number(avgRating) : 0;

  return (
    <div
      className="group relative flex h-full flex-col isolate overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-md transition-shadow duration-300 hover:shadow-xl hover:ring-1 hover:ring-slate-200/80"
      data-testid={`featured-listing-card-${listing.id}`}
    >
      <Link
        to={listingPath(listing.id)}
        className="absolute inset-0 z-0 rounded-2xl"
        aria-label={`View listing: ${listing.title}`}
      />

      <div className="relative z-10 flex flex-1 flex-col pointer-events-none">
        <div className="relative aspect-[4/3] overflow-hidden rounded-t-2xl bg-slate-100">
          <img
            src={img}
            alt=""
            className="h-full w-full object-cover transition-transform duration-500 [transform:translateZ(0)] will-change-transform group-hover:scale-[1.03]"
            loading="lazy"
          />
          <div className="pointer-events-none absolute left-3 top-3 z-10">
            <span className="rounded-md bg-spruce-700 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-white shadow-sm">
              Featured
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-4 py-2.5">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <ListingCategoryLabel categoryId={listing.categoryId} showTitle={false} />
            {priceStr ? (
              <span className="truncate text-base font-bold tabular-nums leading-tight">
                {priceStr}
              </span>
            ) : null}
          </div>
          <button
            type="button"
            onClick={toggleFavorite}
            className={`pointer-events-auto z-20 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm transition-colors ${
              favorited ? 'text-spruce-700' : 'text-slate-600 hover:border-slate-300 hover:text-spruce-800'
            }`}
            aria-label={favorited ? 'Remove thumbs up' : 'Thumbs up this listing'}
          >
            <ThumbsUp className={`h-4 w-4 ${favorited ? 'fill-current' : ''}`} />
          </button>
        </div>

        <div className="flex flex-1 flex-col p-4 pt-3.5">
          <h3 className="font-heading line-clamp-2 min-h-[2.5rem] text-base font-bold leading-snug text-slate-900 group-hover:text-spruce-800">
            {listing.title}
          </h3>

          {descriptionPlain ? (
            <p className="mt-2 line-clamp-1 text-sm leading-relaxed text-slate-600">{descriptionPlain}</p>
          ) : null}

          {locationLine ? (
            <div className="mt-2 flex min-w-0 items-center gap-1.5 text-sm text-slate-500">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden />
              <span className="truncate">{locationLine}</span>
            </div>
          ) : null}

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <StarRatingRow rating={ratingForStars} />
            <span className="text-xs tabular-nums text-slate-500">({reviewCount})</span>
          </div>
        </div>
      </div>
    </div>
  );
}
