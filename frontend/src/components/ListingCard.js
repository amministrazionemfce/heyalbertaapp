import { Link } from 'react-router-dom';
import { MapPin, Star, Heart, Sparkles } from 'lucide-react';
import { Button } from './ui/button';
import { CATEGORIES } from '../data/categories';
import { listingPath } from '../constants';
import { getListingCoverImageUrl } from '../lib/listingCover';
import { resolveMediaUrl } from '../lib/mediaUrl';
import { useListingFavorite } from '../lib/listingFavorites';

export default function ListingCard({ listing }) {
  const vendor = listing.vendor || {};
  const categoryName = CATEGORIES.find((c) => c.id === listing.categoryId)?.name || listing.categoryId;
  const thumb =
    resolveMediaUrl(getListingCoverImageUrl(listing)) || getListingCoverImageUrl(listing) || vendor.images?.[0];
  const reviewCount = listing.reviewCount ?? 0;
  const avgRating = listing.avgRating != null ? Number(listing.avgRating) : null;
  const priceStr = listing.price != null && String(listing.price).trim() ? String(listing.price).trim() : null;
  const featured = Boolean(listing.featured);

  const { favorited, toggleFavorite } = useListingFavorite(listing.id);

  return (
    <div
      className="group relative flex h-full flex-col isolate overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-md transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 hover:border-spruce-200/80"
      data-testid={`listing-card-${listing.id}`}
    >
      <Link
        to={listingPath(listing.id)}
        className="absolute inset-0 z-0 rounded-2xl"
        aria-label={`View listing: ${listing.title}`}
      />

      <div className="relative z-10 flex flex-1 flex-col pointer-events-none">
        <div className="relative h-44 overflow-hidden bg-slate-100">
          <img
            src={thumb || 'services/1.jpg'}
            alt=""
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/55 via-slate-900/10 to-transparent" />

          {featured && (
            <div className="absolute left-3 top-3 z-10 flex items-center gap-1.5 rounded-lg bg-amber-500/95 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-white shadow-md">
              <Sparkles className="w-3.5 h-3.5" aria-hidden />
              Featured
            </div>
          )}

          <button
            type="button"
            onClick={toggleFavorite}
            className={`absolute right-3 top-3 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-white/90 bg-white/95 shadow-md backdrop-blur transition-colors pointer-events-auto ${
              favorited ? 'text-red-500' : 'text-slate-600 hover:text-red-600'
            }`}
            aria-label={favorited ? 'Remove from favorites' : 'Save to favorites'}
          >
            <Heart className={`h-4 w-4 ${favorited ? 'fill-current' : ''}`} />
          </button>

          <div className="absolute bottom-2.5 left-3 right-3 z-10 flex items-end justify-between gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-white/95 bg-black/35 backdrop-blur-sm px-2 py-1 rounded-md max-w-[70%] truncate">
              {categoryName}
            </span>
            {priceStr && (
              <span className="text-xs font-bold text-white bg-spruce-700/95 px-2.5 py-1 rounded-md shadow-sm max-w-[45%] truncate text-right">
                {priceStr}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-1 flex-col p-4 pt-3.5">
          <h3 className="font-heading font-semibold text-slate-900 group-hover:text-spruce-800 transition-colors line-clamp-2 min-h-[2.5rem] text-base leading-snug">
            {listing.title}
          </h3>

          {vendor.name && (
            <p className="text-sm text-slate-600 font-medium mt-1 line-clamp-1">{vendor.name}</p>
          )}

          <div className="mt-2 flex items-center justify-between gap-2 text-sm">
            {(vendor.city || vendor.neighborhood) && (
              <div className="flex items-center gap-1 text-xs text-slate-500 min-w-0">
                <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-spruce-600" />
                <span className="truncate">{[vendor.city, vendor.neighborhood].filter(Boolean).join(', ')}</span>
              </div>
            )}
            <div className="flex shrink-0 items-center gap-1 text-amber-600">
              <Star className="w-4 h-4 fill-amber-400 text-amber-500" aria-hidden />
              {avgRating != null && !Number.isNaN(avgRating) ? (
                <span className="text-xs font-semibold text-slate-700 tabular-nums">
                  {avgRating.toFixed(1)} <span className="font-normal text-slate-500">({reviewCount})</span>
                </span>
              ) : (
                <span className="text-xs font-medium text-slate-500">{reviewCount} reviews</span>
              )}
            </div>
          </div>

          <p className="text-sm text-slate-500 line-clamp-2 mt-2 flex-1">{listing.description}</p>

          <Button
            asChild
            className="mt-4 w-full bg-spruce-700 hover:bg-spruce-800 text-white pointer-events-auto shadow-sm"
            size="sm"
          >
            <Link to={listingPath(listing.id)}>See Detail</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
