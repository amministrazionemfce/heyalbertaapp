import { Link } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import { CATEGORIES } from '../data/categories';

export default function ListingCard({ listing }) {
  const vendor = listing.vendor || {};
  const categoryName = CATEGORIES.find((c) => c.id === listing.categoryId)?.name || listing.categoryId;

  return (
    <Link
      to={`/listings/${listing.id}`}
      className="group relative overflow-hidden rounded-xl border bg-white shadow-sm transition-all hover:shadow-lg hover:-translate-y-1"
      data-testid={`listing-card-${listing.id}`}
    >
      <div className="relative h-40 overflow-hidden bg-slate-100">
        <img
          src={vendor.images?.[0] || 'services/1.jpg'}
          alt="Image of the listing is unavailable"
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 to-transparent" />
        <div className="absolute bottom-2 left-2 right-2">
          <span className="text-xs font-medium text-white/90 bg-white/20 backdrop-blur-sm px-2 py-0.5 rounded">
            {categoryName}
          </span>
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-heading font-semibold text-slate-900 group-hover:text-spruce-700 transition-colors mb-1 line-clamp-1">
          {listing.title}
        </h3>
        {vendor.name && (
          <p className="text-sm text-slate-600 font-medium mb-1">{vendor.name}</p>
        )}
        {(vendor.city || vendor.neighborhood) && (
          <div className="flex items-center gap-1 text-xs text-slate-500 mb-2">
            <MapPin className="w-3 h-3 flex-shrink-0" />
            <span>{[vendor.city, vendor.neighborhood].filter(Boolean).join(', ')}</span>
          </div>
        )}
        <p className="text-sm text-slate-500 line-clamp-2">{listing.description}</p>
      </div>
    </Link>
  );
}
