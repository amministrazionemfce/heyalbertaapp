import { Link } from 'react-router-dom';
import { MapPin, Star, ThumbsUp } from 'lucide-react';
import ListingCategoryLabel from './ListingCategoryLabel';
import { listingPath } from '../constants';
import { getListingCoverImageUrl } from '../lib/listingCover';
import { resolveMediaUrl } from '../lib/mediaUrl';
import { useListingFavorite } from '../lib/listingFavorites';

/** Five stars with partial fills (0–5), e.g. 4.4 → four full + ~40% of fifth */
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

export default function ListingCard({ listing, onAdminOpen }) {
  const adminMode = typeof onAdminOpen === 'function';
  const seller = listing.seller || {};
  const thumb =
    resolveMediaUrl(getListingCoverImageUrl(listing)) || getListingCoverImageUrl(listing) || seller.images?.[0];
  const reviewCount = listing.reviewCount ?? 0;
  const avgRating = listing.avgRating != null ? Number(listing.avgRating) : null;
  const priceStr = listing.price != null && String(listing.price).trim() ? String(listing.price).trim() : null;
  const featured = Boolean(listing.featured);

  const { favorited, toggleFavorite } = useListingFavorite(listing.id);

  const title = String(listing.title || '').trim();
  const sellerName = String(seller.name || '').trim();
  const showSellerLine =
    sellerName && sellerName.toLowerCase() !== title.toLowerCase();

  const ratingForStars =
    avgRating != null && !Number.isNaN(Number(avgRating)) ? Number(avgRating) : 0;
  const descriptionPlain = plainTextExcerpt(listing.description);

  return (
    <div
      className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-md [backface-visibility:hidden] transition-[box-shadow,border-color] duration-300 hover:border-spruce-200/80 hover:shadow-xl"
      data-testid={adminMode ? `admin-listing-${listing.id}` : `listing-card-${listing.id}`}
    >
      {adminMode ? (
        <button
          type="button"
          onClick={() => onAdminOpen(listing)}
          className="absolute inset-0 z-0 cursor-pointer rounded-2xl border-0 bg-transparent p-0 outline-none ring-0 ring-offset-0 focus-visible:ring-2 focus-visible:ring-admin-500/50"
          aria-label={`Open admin details: ${listing.title}`}
          data-testid={`view-listing-${listing.id}`}
        />
      ) : (
        <Link
          to={listingPath(listing.id)}
          className="absolute inset-0 z-0 rounded-2xl outline-none ring-0 ring-offset-0 focus-visible:ring-2 focus-visible:ring-spruce-500/50"
          aria-label={`View listing: ${listing.title}`}
        />
      )}

      <div className="relative z-10 flex flex-1 flex-col pointer-events-none">
        <div className="relative h-44 overflow-hidden rounded-t-2xl bg-slate-100">
          <img
            src={thumb || 'services/1.jpg'}
            alt=""
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            loading="lazy"
          />

          {featured && (
            <div className="pointer-events-auto absolute left-3 top-3 z-10 flex items-center gap-1.5 rounded-lg bg-cyan-500/95 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white shadow-md">
              Featured
            </div>
          )}
        </div>

        <div
          className={`flex items-center gap-2 border-b border-slate-100 px-4 py-2.5 ${
            adminMode ? '' : 'justify-between'
          }`}
        >
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
            <ListingCategoryLabel
              categoryId={listing.categoryId}
              showTitle={adminMode}
            />
            {!adminMode && priceStr ? (
              <span className="truncate text-base font-bold tabular-nums leading-tight">
                {priceStr}
              </span>
            ) : null}
          </div>
          {!adminMode ? (
            <button
              type="button"
              onClick={toggleFavorite}
              className={`pointer-events-auto flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm transition-colors ${
                favorited ? 'text-spruce-700' : 'text-slate-600 hover:border-spruce-300 hover:text-spruce-800'
              }`}
              aria-label={favorited ? 'Remove thumbs up' : 'Thumbs up this listing'}
              data-testid={`listing-favorite-${listing.id}`}
            >
              <ThumbsUp className={`h-4 w-4 ${favorited ? 'fill-current' : ''}`} />
            </button>
          ) : null}
        </div>

        <div className="flex flex-1 flex-col p-4 pt-3.5">
          <h3 className="min-h-0 font-heading text-base font-semibold leading-snug text-slate-900 line-clamp-2 transition-colors group-hover:text-spruce-800">
            {listing.title}
          </h3>

          {showSellerLine ? (
            <p className="mt-1 line-clamp-1 text-sm font-medium text-slate-600">{seller.name}</p>
          ) : null}

          {descriptionPlain ? (
            <p className="mt-2 line-clamp-1 text-sm leading-relaxed text-slate-600">{descriptionPlain}</p>
          ) : null}

          {(seller.city || seller.neighborhood) ? (
            <div className="mt-2 flex min-w-0 items-center gap-1 text-xs text-slate-500">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-spruce-600" aria-hidden />
              <span className="truncate">
                {[seller.city, seller.neighborhood].filter(Boolean).join(', ')}
              </span>
            </div>
          ) : null}

          <div
            className="mt-2 flex flex-wrap items-center gap-2"
            title={
              avgRating != null && !Number.isNaN(Number(avgRating))
                ? `${Number(avgRating).toFixed(1)} avg · ${reviewCount} reviews`
                : `${reviewCount} reviews`
            }
          >
            <StarRatingRow rating={ratingForStars} />
            <span className="text-xs tabular-nums text-slate-600">({reviewCount})</span>
          </div>

          {adminMode && priceStr ? (
            <p className="mt-2 text-lg font-bold leading-tight">{priceStr}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
