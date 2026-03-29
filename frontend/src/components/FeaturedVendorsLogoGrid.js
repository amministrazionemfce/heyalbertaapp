import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { BadgeCheck, MapPin, Star } from 'lucide-react';
import { CATEGORIES, CATEGORY_IMAGES } from '../data/categories';
import { ROUTES, vendorPath } from '../constants';
import { vendorAPI } from '../lib/api';
import { resolveMediaUrl } from '../lib/mediaUrl';
const DEFAULT_BUSINESS_COVER =
  'https://images.unsplash.com/photo-1497366216548-37526070297c?w=900&q=80';

function resolveVendorCardImage(v) {
  const uploaded = Array.isArray(v.images) ? v.images[0] : typeof v.images === 'string' ? v.images : null;

  if (uploaded) return resolveMediaUrl(uploaded) || uploaded;

  const cat = v.category;
  if (cat && CATEGORY_IMAGES[cat]) {
    const src = CATEGORY_IMAGES[cat];
    if (src.startsWith('http')) return src;
    return `/${String(src).replace(/^\//, '')}`;
  }

  return DEFAULT_BUSINESS_COVER;
}

function VendorCard({ vendor }) {
  const img = resolveVendorCardImage(vendor);
  const categoryName = CATEGORIES.find((c) => c.id === vendor.category)?.name || vendor.category;
  const reviewCount = vendor.review_count ?? 0;
  const locationLine = [vendor.city, 'Alberta'].filter(Boolean).join(', ') || 'Alberta';
  const subtitle = vendor.description?.trim()
    ? String(vendor.description).trim()
    : [categoryName, 'Alberta'].filter(Boolean).join(' • ');

  return (
    <div
      className="group relative flex h-full flex-col isolate overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-md transition-shadow duration-300 hover:shadow-xl hover:ring-black/10"
      data-testid={`featured-vendor-card-${vendor.id}`}
    >
      <Link
        to={vendorPath(vendor.id)}
        className="absolute inset-0 z-0 rounded-2xl"
        aria-label={`View vendor: ${vendor.name}`}
      />

      <div className="relative z-10 flex flex-1 flex-col pointer-events-none min-h-0">
        <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
          <img
            src={img}
            alt=""
            className="h-full w-full object-cover transition-transform duration-500 [transform:translateZ(0)] will-change-transform group-hover:scale-[1.03]"
            loading="lazy"
          />
          <div className="absolute left-3 top-3 z-10 flex flex-wrap items-center gap-2">
            {vendor.featured && (
              <span className="rounded-lg bg-yellow-600 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-white shadow-sm">
                Featured
              </span>
            )}
            {vendor.verified && (
              <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-1 text-[10px] font-semibold text-spruce-800 shadow-sm backdrop-blur">
                <BadgeCheck className="h-3.5 w-3.5 text-spruce-700" />
                Verified
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-1 flex-col p-4">
          <h3 className="font-heading line-clamp-2 min-h-[2.75rem] text-base font-bold leading-snug text-slate-900 group-hover:text-spruce-800">
            {vendor.name}
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

          <p className="mt-3 line-clamp-1 text-xs text-slate-500">{subtitle}</p>
        </div>
      </div>
    </div>
  );
}

export default function FeaturedVendorsLogoGrid({ limit = 8 }) {
  const [vendorCount, setVendorCount] = useState(null);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    const run = async () => {
      setLoading(true);
      try {
        const [countRes, listRes] = await Promise.all([
          vendorAPI.count(),
          vendorAPI.list({ limit }),
        ]);

        if (!alive) return;
        setVendorCount(countRes.data?.count ?? 0);
        setVendors(Array.isArray(listRes.data) ? listRes.data : []);
      } catch (e) {
        if (!alive) return;
        setVendorCount(null);
        setVendors([]);
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    };

    run();
    return () => {
      alive = false;
    };
  }, [limit]);

  const displayVendors = useMemo(() => vendors.slice(0, limit), [vendors, limit]);

  return (
    <section
      className="border-t border-slate-200/80 bg-slate-50 py-16 md:py-24"
      data-testid="featured-vendors-section"
    >
      <div className="container mx-auto max-w-7xl px-4 md:px-8">
        <div className="mx-auto mb-10 max-w-4xl text-center md:mb-14">
          <h2 className="font-heading text-2xl font-bold leading-snug text-slate-900 sm:text-3xl md:text-4xl md:leading-tight">
            We are working with{' '}
            <span className="text-spruce-700">{vendorCount ?? '...'}</span> {vendorCount >1 ? 'companies' : 'company'}.
          </h2>
          <p className="mt-4 text-base text-slate-600 md:text-lg">
            A small snapshot of active Alberta businesses you can browse and book.
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 sm:gap-5">
            {Array.from({ length: limit }).map((_, idx) => (
              <div
                key={idx}
                className="animate-pulse overflow-hidden rounded-2xl border border-slate-100 bg-slate-100"
              >
                <div className="aspect-[4/3] bg-slate-200" />
                <div className="space-y-3 p-4">
                  <div className="h-4 rounded bg-slate-200" />
                  <div className="h-3 w-2/3 rounded bg-slate-200" />
                  <div className="h-3 w-full rounded bg-slate-200" />
                </div>
              </div>
            ))}
          </div>
        ) : displayVendors.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 py-14 text-center text-slate-600">
            No vendors found yet. Check back soon.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 sm:gap-5">
            {displayVendors.map((v) => (
              <VendorCard key={v.id} vendor={v} />
            ))}
          </div>
        )}

        <div className="mt-12 flex justify-center">
          <Link
            to={ROUTES.VENDORS}
            className="inline-flex min-w-[200px] items-center justify-center rounded-full border-2 border-spruce-800 bg-white px-10 py-3 text-sm font-semibold text-spruce-900 shadow-sm transition hover:bg-spruce-900 hover:text-white"
            data-testid="featured-vendors-view-more"
          >
            View more
          </Link>
        </div>
      </div>
    </section>
  );
}
