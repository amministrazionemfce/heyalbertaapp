import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';

import { StarRating, StarInput } from '../components/StarRating';
import { listingAPI, reviewAPI } from '../lib/api';
import { useAuth } from '../lib/auth';
import { CATEGORIES } from '../data/categories';
import { toast } from 'sonner';
import { getApiErrorLines } from '../lib/formatApiError';
import { ROUTES, vendorPath, listingPath, directoryCategoryQuery } from '../constants';
import { getListingCoverImageUrl, getListingGalleryImageUrls } from '../lib/listingCover';
import { resolveMediaUrl } from '../lib/mediaUrl';
import { getVendorVideoKind } from '../lib/vendorVideoEmbed';
import { listingPlanFromVendorTier } from '../lib/listingTierRules';
import { OPENING_DAY_ORDER, OPENING_DAY_LABELS } from '../lib/vendorOpeningHours';
import { ListingDetailPageSkeleton } from '../components/ListingPageSkeletons';
import {
  ArrowLeft,
  MapPin,
  Phone,
  Mail,
  Globe,
  ExternalLink,
  Send,
  Loader2,
  Clock,
  ChevronLeft,
  ChevronRight,
  ThumbsUp,
  Share2,
  Shield,
  Star,
  Sparkles,
  Calendar,
  Copy,
  Play,
} from 'lucide-react';

const FAV_KEY = 'hey_alberta_favorite_listings';

function readFavoriteIds() {
  try {
    const raw = localStorage.getItem(FAV_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function toggleFavoriteId(listingId) {
  const next = readFavoriteIds();
  const i = next.indexOf(listingId);
  if (i >= 0) next.splice(i, 1);
  else next.push(listingId);
  localStorage.setItem(FAV_KEY, JSON.stringify(next));
  return i < 0;
}

/**
 * @param {{ url: string, className?: string, variant?: 'default' | 'fill' }} props
 * `fill` — absolutely fills a parent with fixed aspect (e.g. gallery stage); same footprint as cover images.
 */
function ListingVideoInline({ url, className = '', variant = 'default' }) {
  const k = getVendorVideoKind(url);
  if (k.kind === 'empty') return null;

  if (k.kind === 'embed') {
    if (variant === 'fill') {
      return (
        <div className={`absolute inset-0 bg-black ${className}`.trim()}>
          <iframe
            title="Listing video"
            src={k.embedSrc}
            className="h-full w-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            loading="lazy"
          />
        </div>
      );
    }
    return (
      <div
        className={`aspect-video w-full overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-inner ${className}`.trim()}
      >
        <iframe
          title="Listing video"
          src={k.embedSrc}
          className="h-full w-full min-h-[200px]"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          loading="lazy"
        />
      </div>
    );
  }

  if (k.kind === 'file') {
    const src = resolveMediaUrl(url) || url;
    if (variant === 'fill') {
      return (
        <video
          src={src}
          controls
          playsInline
          preload="metadata"
          className={`absolute inset-0 h-full w-full bg-black object-cover ${className}`.trim()}
        />
      );
    }
    return (
      <video
        src={src}
        controls
        playsInline
        preload="metadata"
        className={`aspect-video w-full rounded-xl border border-slate-200/80 bg-black object-cover shadow-sm ${className}`.trim()}
      />
    );
  }

  if (variant === 'fill') {
    return (
      <div className={`absolute inset-0 flex items-center justify-center bg-white p-4 ${className}`.trim()}>
        <a
          href={k.href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-center text-sm font-medium text-spruce-700 underline"
        >
          Open video link
        </a>
      </div>
    );
  }

  return (
    <a
      href={k.href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-spruce-600 hover:underline font-medium break-all"
    >
      {k.href}
    </a>
  );
}

const FEATURE_ICONS = [Sparkles, Star, MapPin, Globe];

const PLACEHOLDER_IMG =
  'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200&q=80';

/**
 * Product-style gallery: vertical thumbnail rail (left on md+), main stage on the right.
 * Optional listing video appears as the first thumbnail when `videoUrl` is set.
 */
function ListingImageGallery({ images, alt, videoUrl }) {
  const galleryRootRef = useRef(null);
  const resolved = useMemo(
    () => images.map((src) => resolveMediaUrl(src) || src).filter(Boolean),
    [images]
  );
  const vid = videoUrl != null ? String(videoUrl).trim() : '';
  const hasVideo = Boolean(vid);
  const total = hasVideo ? resolved.length + 1 : resolved.length;

  const [idx, setIdx] = useState(0);
  const safeIdx = total > 0 ? Math.min(idx, total - 1) : 0;
  const isVideoSlide = hasVideo && safeIdx === 0;
  const currentImageSrc =
    hasVideo && safeIdx > 0 ? resolved[safeIdx - 1] : !hasVideo ? resolved[safeIdx] : null;

  useEffect(() => {
    setIdx(0);
  }, [images, videoUrl]);

  useEffect(() => {
    const root = galleryRootRef.current;
    if (!root) return;
    const el = root.querySelector(`[data-gallery-thumb="${safeIdx}"]`);
    el?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
  }, [safeIdx]);

  const go = (d) => {
    if (total <= 1) return;
    setIdx((i) => (i + d + total) % total);
  };

  if (total === 0) {
    return (
      <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-slate-200/80 bg-white">
        <img src={PLACEHOLDER_IMG} alt="" className="absolute inset-0 h-full w-full object-cover opacity-90" />
      </div>
    );
  }

  return (
    <div
      ref={galleryRootRef}
      className="group relative flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-2 shadow-sm ring-1 ring-slate-100 md:flex-row md:gap-4 md:p-3"
      data-testid="listing-image-gallery"
    >
      {/* Thumbnails: horizontal strip on mobile, vertical rail on md+ */}
      <div
        className="order-2 flex max-h-none flex-row gap-2 overflow-x-auto overflow-y-hidden pb-1 [-ms-overflow-style:none] [scrollbar-width:thin] md:order-1 md:w-[4.75rem] md:max-h-[min(70vh,560px)] md:flex-col md:overflow-y-auto md:overflow-x-hidden md:pb-0 md:pr-0.5 [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-300"
        role="tablist"
        aria-label="Gallery thumbnails"
      >
        {hasVideo ? (
          <button
            type="button"
            data-gallery-thumb="0"
            role="tab"
            aria-selected={safeIdx === 0}
            aria-label="Video"
            onClick={() => setIdx(0)}
            className={`relative aspect-square w-16 shrink-0 overflow-hidden rounded-xl border-2 transition-colors md:w-full ${
              safeIdx === 0
                ? 'border-spruce-600 ring-2 ring-spruce-500/25'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <span className="flex h-full w-full flex-col items-center justify-center gap-0.5 bg-gradient-to-br from-slate-700 to-slate-900 text-white">
              <Play className="h-6 w-6 fill-white text-white" aria-hidden />
              <span className="text-[9px] font-semibold uppercase tracking-wide">Video</span>
            </span>
          </button>
        ) : null}
        {resolved.map((src, i) => {
          const thumbIndex = hasVideo ? i + 1 : i;
          return (
            <button
              key={`${thumbIndex}-${src.slice(0, 32)}`}
              type="button"
              data-gallery-thumb={thumbIndex}
              role="tab"
              aria-selected={safeIdx === thumbIndex}
              aria-label={`Photo ${i + 1}`}
              onClick={() => setIdx(thumbIndex)}
              className={`aspect-square w-16 shrink-0 overflow-hidden rounded-xl border-2 transition-colors md:w-full ${
                safeIdx === thumbIndex
                  ? 'border-spruce-600 ring-2 ring-spruce-500/25'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <img src={src} alt="" className="h-full w-full object-cover" loading="lazy" />
            </button>
          );
        })}
      </div>

      {/* Main stage: fixed 16:9 box — same size for image and video; white backdrop */}
      <div className="relative order-1 min-w-0 flex-1 md:order-2">
        <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-white ring-1 ring-slate-200/60">
          {isVideoSlide ? (
            <ListingVideoInline url={vid} variant="fill" />
          ) : currentImageSrc ? (
            <img
              src={currentImageSrc}
              alt={alt}
              className="absolute inset-0 h-full w-full object-cover object-center"
            />
          ) : null}

          {total > 1 ? (
            <>
              <button
                type="button"
                onClick={() => go(-1)}
                className="absolute left-2 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200/80 bg-white/95 text-slate-800 shadow-md transition-colors hover:bg-white md:left-3 md:opacity-90 md:transition-opacity md:group-hover:opacity-100"
                aria-label="Previous"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => go(1)}
                className="absolute right-2 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200/80 bg-white/95 text-slate-800 shadow-md transition-colors hover:bg-white md:right-3 md:opacity-90 md:transition-opacity md:group-hover:opacity-100"
                aria-label="Next"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function ListingDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [listing, setListing] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [favorited, setFavorited] = useState(false);
  const [similar, setSimilar] = useState([]);

  const fetchListing = async () => {
    try {
      const res = await listingAPI.get(id);
      setListing(res.data);
    } catch {
      toast.error('Listing not found');
      navigate(ROUTES.LISTINGS);
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async (listingId) => {
    if (!listingId) return;
    try {
      const res = await reviewAPI.list(listingId);
      setReviews(Array.isArray(res.data) ? res.data : []);
    } catch {
      setReviews([]);
    }
  };

  useEffect(() => {
    fetchListing();
  }, [id]);

  useEffect(() => {
    if (listing?.id) fetchReviews(listing.id);
  }, [listing?.id]);

  useEffect(() => {
    if (!listing?.id) return;
    setFavorited(readFavoriteIds().includes(listing.id));
  }, [listing?.id]);

  useEffect(() => {
    if (!listing?.categoryId) return;
    let cancelled = false;
    listingAPI
      .directory({ categoryId: listing.categoryId, limit: 8, page: 1 })
      .then((res) => {
        if (cancelled) return;
        const rows = (res.data?.listings || []).filter((l) => l.id !== listing.id).slice(0, 2);
        setSimilar(rows);
      })
      .catch(() => {
        if (!cancelled) setSimilar([]);
      });
    return () => {
      cancelled = true;
    };
  }, [listing?.id, listing?.categoryId]);

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate(ROUTES.LOGIN);
      return;
    }
    if (!listing?.id) return;
    setSubmitting(true);
    try {
      await reviewAPI.create(listing.id, { rating: reviewRating, comment: reviewComment });
      toast.success('Review submitted!');
      setReviewComment('');
      setReviewRating(5);
      fetchReviews(listing.id);
    } catch (err) {
      const lines = getApiErrorLines(err);
      toast.error(lines[0] || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const handleShare = useCallback(async () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    try {
      if (navigator.share) {
        await navigator.share({ title: listing?.title, url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success('Link copied to clipboard');
      }
    } catch {
      try {
        await navigator.clipboard.writeText(url);
        toast.success('Link copied to clipboard');
      } catch {
        toast.error('Could not share or copy link');
      }
    }
  }, [listing?.title]);

  const handleFavorite = () => {
    if (!listing?.id) return;
    const now = toggleFavoriteId(listing.id);
    setFavorited(now);
    toast.success(now ? 'Saved to My likings' : 'Removed from My likings');
  };

  const handleCopyContact = useCallback(async (text, successLabel) => {
    const t = String(text || '').trim();
    if (!t) return;
    try {
      await navigator.clipboard.writeText(t);
      toast.success(`${successLabel} copied to clipboard`);
    } catch {
      toast.error('Could not copy');
    }
  }, []);

  const gallerySources = useMemo(() => {
    if (!listing) return [];
    return getListingGalleryImageUrls(listing);
  }, [listing]);

  if (loading) {
    return <ListingDetailPageSkeleton />;
  }

  if (!listing) return null;

  const seller = listing.seller || {};
  const uid = user ? String(user.id ?? user._id ?? '') : '';
  const isVendorOwner = Boolean(uid && seller.userId && String(seller.userId) === uid);
  const hasUserReviewed = Boolean(
    uid && reviews.some((r) => String(r.userId ?? r.user_id ?? '') === uid)
  );

  const categoryName = CATEGORIES.find((c) => c.id === listing.categoryId)?.name || listing.categoryId;
  const mapQuery = [seller.name, seller.city, seller.neighborhood, 'Alberta'].filter(Boolean).join(', ');
  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`;
  // Prefer Maps Embed API when the env key looks valid (Google keys start with "AIzaSy"; "AlzaSy" is a common typo).
  // Invalid keys would show Google's error iframe — fall back to legacy no-key embed instead.
  const rawMapsKey = (process.env.REACT_APP_GOOGLE_MAPS_API_KEY || '').trim();
  const googleMapsKey =
    rawMapsKey.startsWith('AIzaSy') && rawMapsKey.length >= 35 ? rawMapsKey : '';
  const mapEmbedUrl =
    mapQuery && googleMapsKey
      ? `https://www.google.com/maps/embed/v1/search?key=${encodeURIComponent(googleMapsKey)}&q=${encodeURIComponent(
          mapQuery
        )}`
      : mapQuery
        ? `https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}&output=embed`
        : null;

  const sellerWebsiteRaw = seller.website != null ? String(seller.website).trim() : '';
  const sellerWebsiteHref = sellerWebsiteRaw
    ? sellerWebsiteRaw.startsWith('http')
      ? sellerWebsiteRaw
      : `https://${sellerWebsiteRaw}`
    : '';

  const avgRating =
    reviews.length > 0
      ? reviews.reduce((s, r) => s + (Number(r.rating) || 0), 0) / reviews.length
      : null;

  const published =
    listing.createdAt != null
      ? new Date(listing.createdAt).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
      : null;

  const features = Array.isArray(listing.features) ? listing.features : [];
  const openingHours = listing.openingHours || {};
  const showHoursPublic = listing.showOpeningHours !== false;
  const hasAnyOpeningHour = OPENING_DAY_ORDER.some((d) => String(openingHours[d] || '').trim());

  return (
    <div className="min-h-screen" data-testid="listing-detail-page">
      <div className="container mx-auto px-4 md:px-8 max-w-6xl py-6 md:py-10">
        {/* Breadcrumbs */}
        <nav className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-500 mb-4">
          <Link to={ROUTES.HOME} className="hover:text-spruce-700 transition-colors">
            Home
          </Link>
          <span className="text-slate-300">/</span>
          <Link
            to={directoryCategoryQuery(listing.categoryId)}
            className="hover:text-spruce-700 transition-colors max-w-[200px] truncate"
          >
            {categoryName}
          </Link>
          <span className="text-slate-300">/</span>
          <span className="text-slate-800 font-medium truncate max-w-[240px]">Listing details</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-10">
          {/* Main */}
          <div className="lg:col-span-2 space-y-8">
            {/* One row above image: category title | price | 3 actions */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Category</p>
                <p className="text-xl md:text-2xl font-semibold text-spruce-900 font-heading truncate">{categoryName}</p>
              </div>
              <div className="flex flex-row flex-nowrap items-center gap-4 sm:gap-6 sm:shrink-0 sm:ml-auto">
                <div className="text-left sm:text-right" data-testid="listing-price-tag">
                  {listing.price != null && String(listing.price).trim() ? (
                    <>
                      <p className="text-sm font-semibold uppercase tracking-wider text-slate-500"> Price</p>
                      <p className="text-xl md:text-2xl font-bold text-spruce-900 tabular-nums leading-tight">
                        {String(listing.price).trim()}
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-slate-600">Contact vendor for pricing</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleFavorite}
                    className={`inline-flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors ${favorited
                        ? 'border-spruce-200 bg-spruce-50 text-spruce-700'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-spruce-300 hover:text-spruce-700'
                      }`}
                    aria-label={favorited ? 'Remove thumbs up' : 'Thumbs up this listing'}
                  >
                    <ThumbsUp className={`w-4 h-4 ${favorited ? 'fill-current' : ''}`} />
                  </button>
                  <button
                    type="button"
                    onClick={handleShare}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border-2 border-slate-200 bg-white text-slate-600 hover:border-spruce-300 hover:text-spruce-700 transition-colors"
                    aria-label="Share listing"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                  <Button
                    variant="outline"
                    className="border-slate-200 h-10 rounded-full px-4"
                    asChild
                    data-testid="back-btn"
                  >
                    <Link to={ROUTES.LISTINGS} className="inline-flex items-center gap-2">
                      <ArrowLeft className="w-4 h-4" /> Back to listings
                    </Link>
                  </Button>
                </div>
              </div>
            </div>

            <ListingImageGallery
              images={gallerySources}
              alt={listing.title}
              videoUrl={listing.videoUrl?.trim() || ''}
            />

            <div className="rounded-2xl border border-slate-100 bg-white p-6 md:p-8 shadow-sm">
              <div className="flex flex-wrap items-start gap-3 mb-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-spruce-800">
                  <Shield className="w-6 h-6" aria-hidden />
                </div>
                <div className="min-w-0 flex-1">
                  <h1
                    className="font-heading text-2xl md:text-3xl font-bold text-slate-900 leading-tight"
                    data-testid="listing-title"
                  >
                    {listing.title}
                  </h1>
                  {seller.name && (
                    <Link
                      to={vendorPath(seller.userId || seller.id)}
                      className="mt-1 inline-block text-spruce-700 hover:underline font-medium text-sm md:text-base"
                    >
                      {seller.name}
                    </Link>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-600 pb-6 border-b border-slate-100">
                {(seller.city || seller.neighborhood) && (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-spruce-600 shrink-0" />
                    {[seller.city, seller.neighborhood].filter(Boolean).join(', ')}
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-400 shrink-0" />
                  {avgRating != null ? (
                    <>
                      <span className="font-semibold text-slate-800">{avgRating.toFixed(1)}</span>
                      <span className="text-slate-500">({reviews.length})</span>
                    </>
                  ) : (
                    <span className="text-slate-500">No reviews yet</span>
                  )}
                </span>
                {published && (
                  <span className="inline-flex items-center gap-1.5 text-slate-500">
                    <Clock className="w-4 h-4 shrink-0" />
                    Published: {published}
                  </span>
                )}
              </div>

              {features.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 py-5 border-b border-slate-100">
                  {features.map((f, i) => {
                    const Icon = FEATURE_ICONS[i % FEATURE_ICONS.length];
                    return (
                      <span
                        key={i}
                        className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1.5 text-sm text-slate-700 border border-slate-100"
                      >
                        <Icon className="w-4 h-4 text-spruce-600 shrink-0" />
                        {f}
                      </span>
                    );
                  })}
                </div>
              )}

              {showHoursPublic && hasAnyOpeningHour && (
                <div className="py-5 border-b border-slate-100">
                  <h2 className="font-heading text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-spruce-600 shrink-0" aria-hidden />
                    Hours of operation
                  </h2>
                  <div className="rounded-xl border border-slate-200 overflow-hidden max-w-lg">
                    {OPENING_DAY_ORDER.map((day, i) => {
                      const line = openingHours[day];
                      const text = String(line || '').trim() || '—';
                      return (
                        <div
                          key={day}
                          className={`flex justify-between gap-4 px-4 py-2.5 text-sm ${i > 0 ? 'border-t border-slate-100' : ''}`}
                        >
                          <span className="text-slate-600 font-medium">{OPENING_DAY_LABELS[day]}</span>
                          <span className="text-slate-900 text-right tabular-nums">{text}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="pt-6">
                <h2 className="font-heading text-lg font-semibold text-slate-900 mb-3">Description</h2>
                <p className="text-base leading-relaxed text-slate-600 whitespace-pre-wrap">{listing.description}</p>
              </div>

            </div>

            {/* Reviews */}
            <div
              className="rounded-2xl border border-slate-100 bg-white p-6 md:p-8 shadow-sm"
              data-testid="reviews-section"
            >
              <h2 className="font-heading text-xl font-semibold text-slate-900 mb-6">
                Feedback &amp; Reviews ({reviews.length})
              </h2>

              {user && isVendorOwner && (
                <p className="text-sm text-slate-600 mb-6 p-4 bg-slate-50 rounded-xl border border-slate-100" data-testid="listing-review-own-vendor-notice">
                  You can&apos;t review your own business.
                </p>
              )}

              {user && !isVendorOwner && hasUserReviewed && (
                <p className="text-sm text-slate-600 mb-6 p-4 bg-slate-50 rounded-xl border border-slate-100" data-testid="listing-review-already-notice">
                  You&apos;ve already submitted a review for this business.
                </p>
              )}

              {user && !isVendorOwner && !hasUserReviewed && (
                <form onSubmit={handleSubmitReview} className="mb-8 p-4 bg-slate-50 rounded-xl border border-slate-100" data-testid="review-form">
                  <h3 className="font-medium mb-3 text-slate-800">Leave your feedback</h3>
                  <p className="text-xs text-slate-500 mb-3">
                    Reviews apply to the business — one review per account per company.
                  </p>
                  <div className="mb-3">
                    <StarInput value={reviewRating} onChange={setReviewRating} />
                  </div>
                  <Textarea
                    placeholder="Share your experience..."
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    className="mb-3"
                    rows={3}
                    required
                    data-testid="review-comment-input"
                  />
                  <Button type="submit" disabled={submitting} className="bg-spruce-700 hover:bg-spruce-800 text-white" data-testid="submit-review-btn">
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                    Submit Review
                  </Button>
                </form>
              )}

              {!user && (
                <p className="text-sm text-slate-500 mb-6">
                  <Link to={ROUTES.LOGIN} className="text-spruce-700 hover:underline font-medium">
                    Log in
                  </Link>{' '}
                  to leave feedback.
                </p>
              )}

              <div className="space-y-6">
                {reviews.length === 0 && (
                  <p className="text-sm text-slate-500 py-4">No reviews yet. Be the first!</p>
                )}
                {reviews.map((review) => (
                  <div key={review.id} className="border-b border-slate-100 pb-5 last:border-0" data-testid={`review-${review.id}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-spruce-100 flex items-center justify-center text-sm font-medium text-spruce-700">
                          {(review.userName || review.user_name || 'U')[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-sm text-slate-900">{review.userName || review.user_name || 'User'}</p>
                          <StarRating rating={review.rating} size={12} />
                        </div>
                      </div>
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(review.createdAt || review.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 ml-12">{review.comment}</p>
                    {review.reply && (
                      <div className="ml-12 mt-3 p-3 bg-spruce-50 rounded-lg border border-spruce-100/80">
                        <p className="text-xs font-medium text-spruce-800 mb-1">Vendor response</p>
                        <p className="text-sm text-slate-600">{review.reply}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6 lg:pt-0">
            {similar.length > 0 && (
              <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                <h3 className="font-heading font-semibold text-slate-900 mb-4">More in this category</h3>
                <div className="space-y-4">
                  {similar.map((s) => {
                    const v = s.seller || {};
                    const thumb = resolveMediaUrl(getListingCoverImageUrl(s)) || getListingCoverImageUrl(s) || v.images?.[0];
                    return (
                      <Link
                        key={s.id}
                        to={listingPath(s.id)}
                        className="flex gap-3 rounded-xl border border-slate-100 p-3 hover:bg-slate-50/80 hover:border-spruce-200/60 transition-colors group"
                      >
                        <div className="h-16 w-20 shrink-0 rounded-lg overflow-hidden bg-slate-100">
                          {thumb ? (
                            <img src={thumb} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-slate-200" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-sm text-slate-900 group-hover:text-spruce-800 line-clamp-2 leading-snug">
                            {s.title}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                            {s.description?.slice(0, 80)}
                            {s.description?.length > 80 ? '…' : ''}
                          </p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm" data-testid="listing-contact-card">
              <h3 className="font-heading font-semibold text-lg mb-4 text-slate-900">Contact &amp; location</h3>

              {listingPlanFromVendorTier(seller.tier) === 'free' ? (
                <p className="text-sm text-slate-500 mb-4">
                  Contact info available for upgraded listings.
                  <Link to={ROUTES.ABOUT} className="text-spruce-700 hover:underline ml-1 font-medium">
                    Learn more
                  </Link>
                </p>
              ) : (
                <div className="space-y-3">
                  {seller.phone && (
                    <div className="flex items-stretch gap-1">
                      <a
                        href={`tel:${seller.phone}`}
                        className="flex min-w-0 flex-1 items-center gap-3 rounded-xl py-0.5 pr-1 text-sm text-slate-700 transition-colors hover:text-spruce-800"
                      >
                        <div className="w-10 h-10 shrink-0 rounded-xl flex items-center justify-center">
                          <Phone className="w-4 h-4 text-spruce-700" />
                        </div>
                        <span className="min-w-0 truncate font-medium">{seller.phone}</span>
                      </a>
                      <button
                        type="button"
                        onClick={() => handleCopyContact(seller.phone, 'Phone number')}
                        className="shrink-0 self-center rounded-lg p-2.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-spruce-800"
                        aria-label="Copy phone number"
                      >
                        <Copy className="h-4 w-4" aria-hidden />
                      </button>
                    </div>
                  )}
                  {seller.email && (
                    <div className="flex items-stretch gap-1">
                      <a
                        href={`mailto:${seller.email}`}
                        className="flex min-w-0 flex-1 items-center gap-3 rounded-xl py-0.5 pr-1 text-sm text-slate-700 transition-colors hover:text-spruce-800"
                      >
                        <div className="w-10 h-10 shrink-0 rounded-xl bg-spruce-50 flex items-center justify-center">
                          <Mail className="w-4 h-4 text-spruce-700" />
                        </div>
                        <span className="min-w-0 truncate font-medium">{seller.email}</span>
                      </a>
                      <button
                        type="button"
                        onClick={() => handleCopyContact(seller.email, 'Email')}
                        className="shrink-0 self-center rounded-lg p-2.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-spruce-800"
                        aria-label="Copy email address"
                      >
                        <Copy className="h-4 w-4" aria-hidden />
                      </button>
                    </div>
                  )}
                  {sellerWebsiteHref ? (
                    <div className="flex items-stretch gap-1">
                      <a
                        href={sellerWebsiteHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex min-w-0 flex-1 items-center gap-3 rounded-xl py-0.5 pr-1 text-sm text-slate-700 transition-colors hover:text-spruce-800"
                      >
                        <div className="w-10 h-10 shrink-0 rounded-xl bg-spruce-50 flex items-center justify-center">
                          <Globe className="w-4 h-4 text-spruce-700" />
                        </div>
                        <span className="flex min-w-0 items-center gap-1.5 truncate font-medium">
                          <span className="truncate">{sellerWebsiteRaw}</span>
                          <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden />
                        </span>
                      </a>
                      <button
                        type="button"
                        onClick={() => handleCopyContact(sellerWebsiteHref, 'Website URL')}
                        className="shrink-0 self-center rounded-lg p-2.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-spruce-800"
                        aria-label="Copy website URL"
                      >
                        <Copy className="h-4 w-4" aria-hidden />
                      </button>
                    </div>
                  ) : null}
                </div>
              )}

              {mapEmbedUrl ? (
                <div className="mt-6 overflow-hidden rounded-xl border border-slate-200/70 bg-slate-50">
                  <iframe
                    title="Business location map"
                    src={mapEmbedUrl}
                    width="100%"
                    height="260"
                    style={{ border: 0 }}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
              ) : null}

              <div className="mt-6 space-y-2">
                <Button
                  asChild
                  className="w-full rounded-xl bg-spruce-700 text-white hover:bg-spruce-800"
                  data-testid="view-on-map-btn"
                >
                  <a
                    href={mapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex w-full items-center justify-center gap-2 whitespace-nowrap"
                  >
                    <MapPin className="h-4 w-4 shrink-0" />
                    <span>Open in Google Maps</span>
                  </a>
                </Button>

                {mapQuery && (
                  <p className="text-xs text-slate-500 text-center">{mapQuery}</p>
                )}

                <Button
                  variant="outline"
                  className="w-full mt-3 rounded-xl border-slate-200"
                  asChild
                >
                  <Link
                    to={vendorPath(seller.userId || seller.id)}
                    className="inline-flex w-full items-center justify-center gap-2 whitespace-nowrap"
                  >
                    <span>All listings from this business</span>
                    <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                  </Link>
                </Button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
