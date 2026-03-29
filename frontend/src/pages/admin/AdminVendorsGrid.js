import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import {
  BadgeCheck,
  Ban,
  CheckCircle,
  Clock,
  Eye,
  Layers,
  MapPin,
  Star,
  XCircle,
} from 'lucide-react';
import { CATEGORY_IMAGES } from '../../data/categories';
import { getVendorStatusBadgeClass } from './vendorStatus';
import { resolveMediaUrl } from '../../lib/mediaUrl';

const DEFAULT_BUSINESS_COVER =
  'https://images.unsplash.com/photo-1497366216548-37526070297c?w=900&q=80';

function resolveVendorCoverImage(v) {
  const uploaded = Array.isArray(v.images) && v.images[0];
  if (uploaded) return resolveMediaUrl(uploaded) || uploaded;
  const cat = v.category;
  if (cat && CATEGORY_IMAGES[cat]) {
    const src = CATEGORY_IMAGES[cat];
    const path = src.startsWith('http') ? src : `/${String(src).replace(/^\//, '')}`;
    return resolveMediaUrl(path) || path;
  }
  return DEFAULT_BUSINESS_COVER;
}

export function AdminVendorsGrid({
  vendors,
  getCategoryName,
  getTierInfo,
  onSeeDetails,
  onApprove,
  onReject,
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
      {vendors.map((v) => {
        const tierInfo = getTierInfo(v.tier);
        const categoryName = getCategoryName(v.category);
        const cover = resolveVendorCoverImage(v);
        const avg = v.avgRating ?? 0;
        const count = v.reviewCount ?? 0;
        const statusKey = (v.status || '').toLowerCase();
        const locationLine = [v.city, categoryName].filter(Boolean).join(' · ') || '—';

        return (
          <article
            key={v.id}
            className="group flex flex-col isolate overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-md transition-all duration-300 hover:shadow-xl hover:ring-1 hover:ring-slate-900/5"
            data-testid={`admin-vendor-${v.id}`}
          >
            <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
              <img
                src={cover}
                alt=""
                className="h-full w-full object-cover transition-transform duration-500 [transform:translateZ(0)] will-change-transform group-hover:scale-[1.03]"
                loading="lazy"
              />
              {v.featured && (
                <span className="absolute left-3 top-3 z-10 rounded-lg bg-yellow-600 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-white shadow-sm">
                  Featured
                </span>
              )}
            </div>

            <div className="flex flex-1 flex-col gap-3 p-4">
              <div className="min-w-0">
                <h3 className="font-heading line-clamp-2 min-h-[2.5rem] text-base font-bold leading-snug text-slate-900">
                  {v.name}
                </h3>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  {statusKey === 'approved' && (
                    <Badge
                      className={`border-0 gap-1 text-xs font-semibold px-2 py-0.5 ${getVendorStatusBadgeClass('approved')}`}
                      title="This business is live in the directory"
                    >
                      <CheckCircle className="w-3.5 h-3.5 shrink-0" aria-hidden />
                      Approved
                    </Badge>
                  )}
                  {statusKey === 'pending' && (
                    <Badge
                      className={`${getVendorStatusBadgeClass('pending')} gap-1 text-xs font-semibold px-2 py-0.5`}
                      title="Waiting for admin approval"
                    >
                      <Clock className="w-3.5 h-3.5 shrink-0" aria-hidden />
                      Pending review
                    </Badge>
                  )}
                  {statusKey === 'rejected' && (
                    <Badge
                      className={`${getVendorStatusBadgeClass('rejected')} gap-1 text-xs font-semibold px-2 py-0.5`}
                      title="Application was declined"
                    >
                      <Ban className="w-3.5 h-3.5 shrink-0" aria-hidden />
                      Rejected
                    </Badge>
                  )}
                  {!['approved', 'pending', 'rejected'].includes(statusKey) && (
                    <Badge
                      className={`${getVendorStatusBadgeClass(v.status)} text-xs font-semibold capitalize px-2 py-0.5`}
                    >
                      {v.status || 'Unknown'}
                    </Badge>
                  )}

                  <Badge
                    variant="secondary"
                    className="gap-1 text-xs font-medium border border-slate-200/80 bg-slate-50 text-slate-700 px-2 py-0.5"
                    title={tierInfo.description || `Membership tier: ${tierInfo.name}`}
                  >
                    <Layers className="w-3.5 h-3.5 shrink-0 text-slate-500" aria-hidden />
                    <span className="text-slate-600">Tier:</span>
                    <span className="font-semibold text-slate-800">{tierInfo.name}</span>
                  </Badge>

                  {v.verified && (
                    <span
                      className="inline-flex items-center gap-1 rounded-full bg-spruce-50 px-2 py-0.5 text-xs font-semibold text-spruce-800 border border-spruce-200/80"
                      title="Verified business"
                    >
                      <BadgeCheck className="w-3.5 h-3.5 text-spruce-700" aria-hidden />
                      Verified
                    </span>
                  )}
                </div>
              </div>

              <div className="flex min-w-0 items-start gap-1.5 text-sm text-spruce-700">
                <MapPin className="h-4 w-4 shrink-0 mt-0.5" aria-hidden />
                <span className="font-medium leading-snug">{locationLine}</span>
              </div>

              {(count > 0 || avg > 0) && (
                <div className="flex items-center gap-1 text-sm text-slate-600">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-500 shrink-0" aria-hidden />
                  <span className="font-semibold tabular-nums text-slate-800">{avg}</span>
                  <span className="text-slate-500">({count} review{count !== 1 ? 's' : ''})</span>
                </div>
              )}

              <div className="mt-auto flex flex-col gap-2.5 border-t border-slate-100 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 w-full gap-2 border-slate-200 text-slate-800 font-medium hover:border-spruce-300 hover:bg-spruce-50 hover:text-spruce-900"
                  onClick={() => onSeeDetails(v)}
                  data-testid={`see-details-vendor-${v.id}`}
                >
                  <Eye className="h-4 w-4 shrink-0" aria-hidden />
                  See details
                </Button>

                {v.status === 'pending' && (
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      className="h-10 gap-1.5 text-sm font-semibold bg-spruce-700 hover:bg-spruce-800 text-white shadow-sm"
                      onClick={() => onApprove(v.id)}
                      aria-label={`Approve ${v.name}`}
                      title="Approve and publish this business"
                      data-testid={`approve-${v.id}`}
                    >
                      <CheckCircle className="h-4 w-4 shrink-0" aria-hidden />
                      Approve
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-10 gap-1.5 text-sm font-semibold border-red-300 text-red-700 hover:bg-red-50 hover:text-red-800"
                      onClick={() => onReject(v.id)}
                      aria-label={`Reject ${v.name}`}
                      title="Decline this application"
                      data-testid={`reject-${v.id}`}
                    >
                      <XCircle className="h-4 w-4 shrink-0" aria-hidden />
                      Reject
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
