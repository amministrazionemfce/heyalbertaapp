import { Link } from 'react-router-dom';
import { Badge } from '../components/ui/badge';
import { StarRating } from '../components/StarRating';
import { MapPin, BadgeCheck, Phone } from 'lucide-react';
import { getCategoryIcon, getTierInfo } from '../data/categories';
import { vendorPath } from '../constants';

export default function VendorCard({ vendor }) {
  const tierInfo = getTierInfo(vendor.tier);
  const CategoryIcon = getCategoryIcon(vendor.icon);

  return (
    <Link
      to={vendorPath(vendor.id)}
      className="group relative overflow-hidden rounded-xl border bg-white shadow-sm transition-all hover:shadow-lg hover:-translate-y-1"
      data-testid={`vendor-card-${vendor.id}`}
    >
      {/* Image */}
      <div className="relative h-48 overflow-hidden bg-slate-100">
        <img
          src={vendor.images?.[0] || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800'}
          alt={vendor.name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute top-3 left-3 flex gap-2">
          <Badge className={`${tierInfo.color} text-xs font-medium`} data-testid={`vendor-tier-${vendor.id}`}>
            {tierInfo.name}
          </Badge>
          {vendor.verified && (
            <Badge className="bg-spruce-700 text-white text-xs flex items-center gap-1">
              <BadgeCheck className="w-3 h-3" /> Verified
            </Badge>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="font-heading font-semibold text-lg text-slate-900 group-hover:text-spruce-700 transition-colors mb-1">
          {vendor.name}
        </h3>

        <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
          <MapPin className="w-3.5 h-3.5" />
          <span>{vendor.city}{vendor.neighborhood ? `, ${vendor.neighborhood}` : ''}</span>
        </div>

        <StarRating rating={vendor.avg_rating || 0} size={14} showCount count={vendor.review_count || 0} />

        <p className="text-sm text-slate-500 mt-3 line-clamp-2">{vendor.description}</p>

        {vendor.phone && vendor.tier !== 'free' && (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-3 pt-3 border-t">
            <Phone className="w-3.5 h-3.5" />
            <span>{vendor.phone}</span>
          </div>
        )}
      </div>
    </Link>
  );
}