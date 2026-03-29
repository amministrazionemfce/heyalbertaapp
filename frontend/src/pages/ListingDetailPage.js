import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate, Link, NavLink } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { Input } from '../components/ui/input';
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
  Heart,
  Share2,
  Shield,
  Star,
  Sparkles,
  Calendar,
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

function ListingVideoInline({ url }) {
  const k = getVendorVideoKind(url);
  if (k.kind === 'empty') return null;
  if (k.kind === 'embed') {
    return (
      <div className="w-full max-w-3xl overflow-hidden rounded-xl border border-slate-200/80 bg-slate-100 aspect-video shadow-inner">
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
    return (
      <video
        src={src}
        controls
        playsInline
        preload="metadata"
        className="w-full max-w-3xl rounded-xl border border-slate-200/80 bg-black max-h-[480px] shadow-sm"
      />
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

function ListingImageCarousel({ images, alt }) {
  const resolved = useMemo(
    () => images.map((src) => resolveMediaUrl(src) || src).filter(Boolean),
    [images]
  );
  const [idx, setIdx] = useState(0);
  const n = resolved.length;
  const safeIdx = n > 0 ? Math.min(idx, n - 1) : 0;
  const current = n > 0 ? resolved[safeIdx] : '';

  useEffect(() => {
    setIdx(0);
  }, [images]);

  const go = (d) => {
    if (n <= 1) return;
    setIdx((i) => (i + d + n) % n);
  };

  if (n === 0) {
    return (
      <div className="relative aspect-[21/9] min-h-[220px] md:min-h-[320px] rounded-2xl overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200">
        <img
          src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200&q=80"
          alt=""
          className="w-full h-full object-cover opacity-90"
        />
      </div>
    );
  }

  return (
    <div className="relative group rounded-2xl overflow-hidden bg-slate-900 shadow-lg ring-1 ring-slate-200/60">
      <div className="aspect-[21/9] min-h-[220px] md:min-h-[340px]">
        <img src={current} alt={alt} className="w-full h-full object-cover" />
      </div>
      {n > 1 && (
        <>
          <button
            type="button"
            onClick={() => go(-1)}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/95 shadow-md flex items-center justify-center text-slate-800 hover:bg-white transition-colors opacity-90 md:opacity-0 md:group-hover:opacity-100"
            aria-label="Previous image"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/95 shadow-md flex items-center justify-center text-slate-800 hover:bg-white transition-colors opacity-90 md:opacity-0 md:group-hover:opacity-100"
            aria-label="Next image"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5">
            {resolved.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIdx(i)}
                className={`h-2 rounded-full transition-all ${i === safeIdx ? 'w-8 bg-white' : 'w-2 bg-white/50 hover:bg-white/70'
                  }`}
                aria-label={`Photo ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
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
  const [meeting, setMeeting] = useState({ date: '', name: '', phone: '', email: '', message: '' });
  const [meetingSending, setMeetingSending] = useState(false);

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

  const fetchReviews = async (vendorId) => {
    if (!vendorId) return;
    try {
      const res = await reviewAPI.list(vendorId);
      setReviews(Array.isArray(res.data) ? res.data : []);
    } catch {
      setReviews([]);
    }
  };

  useEffect(() => {
    fetchListing();
  }, [id]);

  useEffect(() => {
    if (listing?.vendor?.id) fetchReviews(listing.vendor.id);
  }, [listing?.vendor?.id]);

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
    if (!listing?.vendor?.id) return;
    setSubmitting(true);
    try {
      await reviewAPI.create(listing.vendor.id, { rating: reviewRating, comment: reviewComment });
      toast.success('Review submitted!');
      setReviewComment('');
      setReviewRating(5);
      fetchReviews(listing.vendor.id);
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
    toast.success(now ? 'Saved to favorites' : 'Removed from favorites');
  };

  const handleMeetingSubmit = (e) => {
    e.preventDefault();
    if (!meeting.name.trim() || !meeting.email.trim()) {
      toast.error('Please enter your name and email');
      return;
    }
    setMeetingSending(true);
    setTimeout(() => {
      toast.success('Thanks! Your request was sent. The business may reach out using the details you provided.');
      setMeeting({ date: '', name: '', phone: '', email: '', message: '' });
      setMeetingSending(false);
    }, 400);
  };

  const gallerySources = useMemo(() => {
    if (!listing) return [];
    return getListingGalleryImageUrls(listing);
  }, [listing]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-spruce-700" />
      </div>
    );
  }

  if (!listing) return null;

  const vendor = listing.vendor || {};
  const uid = user ? String(user.id ?? user._id ?? '') : '';
  const isVendorOwner = Boolean(uid && vendor.userId && String(vendor.userId) === uid);
  const hasUserReviewed = Boolean(
    uid && reviews.some((r) => String(r.userId ?? r.user_id ?? '') === uid)
  );

  const categoryName = CATEGORIES.find((c) => c.id === listing.categoryId)?.name || listing.categoryId;
  const mapQuery = [vendor.name, vendor.city, vendor.neighborhood, 'Alberta'].filter(Boolean).join(', ');
  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`;
  // Always render a map inside the page.
  // Prefer the API-key embed (more reliable). If the key is missing, fall back to the no-key embed URL.
  const googleMapsKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
  const mapEmbedUrl =
    mapQuery &&
      googleMapsKey
      ? `https://www.google.com/maps/embed/v1/search?key=${encodeURIComponent(googleMapsKey)}&q=${encodeURIComponent(
        mapQuery
      )}`
      : mapQuery
        ? `https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}&output=embed`
        : null;

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

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white" data-testid="listing-detail-page">
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
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Alberta directory</p>
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
                        ? 'border-red-200 bg-red-50 text-red-500'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-spruce-300 hover:text-spruce-700'
                      }`}
                    aria-label={favorited ? 'Remove from favorites' : 'Save to favorites'}
                  >
                    <Heart className={`w-4 h-4 ${favorited ? 'fill-current' : ''}`} />
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

            <ListingImageCarousel images={gallerySources} alt={listing.title} />

            <div className="rounded-2xl border border-slate-100 bg-white p-6 md:p-8 shadow-sm">
              <div className="flex flex-wrap items-start gap-3 mb-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-spruce-100 text-spruce-800">
                  <Shield className="w-6 h-6" aria-hidden />
                </div>
                <div className="min-w-0 flex-1">
                  <h1
                    className="font-heading text-2xl md:text-3xl font-bold text-slate-900 leading-tight"
                    data-testid="listing-title"
                  >
                    {listing.title}
                  </h1>
                  {vendor.name && (
                    <Link
                      to={vendorPath(vendor.id)}
                      className="mt-1 inline-block text-spruce-700 hover:underline font-medium text-sm md:text-base"
                    >
                      {vendor.name}
                    </Link>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-600 pb-6 border-b border-slate-100">
                {(vendor.city || vendor.neighborhood) && (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-spruce-600 shrink-0" />
                    {[vendor.city, vendor.neighborhood].filter(Boolean).join(', ')}
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

              <div className="pt-6">
                <h2 className="font-heading text-lg font-semibold text-slate-900 mb-3">Description</h2>
                <p className="text-base leading-relaxed text-slate-600 whitespace-pre-wrap">{listing.description}</p>
              </div>

              {listing.videoUrl?.trim() ? (
                <div className="mt-8 pt-8 border-t border-slate-100">
                  <h2 className="font-heading text-lg font-semibold text-slate-900 mb-4">Video</h2>
                  <ListingVideoInline url={listing.videoUrl} />
                </div>
              ) : null}
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
                    const v = s.vendor || {};
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

            <div className="rounded-2xl border border-slate-100 bg-white p-5 md:p-6 shadow-sm">
              <h3 className="font-heading font-semibold text-lg text-slate-900 mb-1">Book a meeting</h3>
              <p className="text-xs text-slate-500 mb-4">Share your details and the vendor can follow up.</p>
              <form onSubmit={handleMeetingSubmit} className="space-y-3">
                <div>
                  <Label htmlFor="meet-date" className="text-xs text-slate-600">
                    Preferred date
                  </Label>
                  <div className="relative mt-1">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <Input
                      id="meet-date"
                      type="date"
                      value={meeting.date}
                      onChange={(e) => setMeeting((m) => ({ ...m, date: e.target.value }))}
                      className="pl-10 h-10 rounded-xl border-slate-200"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="meet-name" className="text-xs text-slate-600">
                    Name *
                  </Label>
                  <Input
                    id="meet-name"
                    value={meeting.name}
                    onChange={(e) => setMeeting((m) => ({ ...m, name: e.target.value }))}
                    className="mt-1 rounded-xl border-slate-200 h-10"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <Label htmlFor="meet-phone" className="text-xs text-slate-600">
                    Phone
                  </Label>
                  <Input
                    id="meet-phone"
                    value={meeting.phone}
                    onChange={(e) => setMeeting((m) => ({ ...m, phone: e.target.value }))}
                    className="mt-1 rounded-xl border-slate-200 h-10"
                    placeholder="(403) 555-0100"
                  />
                </div>
                <div>
                  <Label htmlFor="meet-email" className="text-xs text-slate-600">
                    Email *
                  </Label>
                  <Input
                    id="meet-email"
                    type="email"
                    value={meeting.email}
                    onChange={(e) => setMeeting((m) => ({ ...m, email: e.target.value }))}
                    className="mt-1 rounded-xl border-slate-200 h-10"
                    placeholder="you@example.com"
                  />
                </div>
                <div>
                  <Label htmlFor="meet-msg" className="text-xs text-slate-600">
                    Message
                  </Label>
                  <Textarea
                    id="meet-msg"
                    value={meeting.message}
                    onChange={(e) => setMeeting((m) => ({ ...m, message: e.target.value }))}
                    rows={3}
                    className="mt-1 rounded-xl border-slate-200 resize-y"
                    placeholder="What would you like to discuss?"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={meetingSending}
                  className="w-full bg-spruce-700 hover:bg-spruce-800 text-white rounded-xl h-11"
                >
                  {meetingSending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send request'}
                </Button>
              </form>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm" data-testid="listing-contact-card">
              <h3 className="font-heading font-semibold text-lg mb-4 text-slate-900">Contact &amp; location</h3>

              {listingPlanFromVendorTier(vendor.tier) === 'free' ? (
                <p className="text-sm text-slate-500 mb-4">
                  Contact info available for upgraded listings.
                  <Link to={ROUTES.ABOUT} className="text-spruce-700 hover:underline ml-1 font-medium">
                    Learn more
                  </Link>
                </p>
              ) : (
                <div className="space-y-3">
                  {vendor.phone && (
                    <a href={`tel:${vendor.phone}`} className="flex items-center gap-3 text-sm text-slate-700 hover:text-spruce-800 transition-colors">
                      <div className="w-10 h-10 rounded-xl bg-spruce-50 flex items-center justify-center shrink-0">
                        <Phone className="w-4 h-4 text-spruce-700" />
                      </div>
                      <span>{vendor.phone}</span>
                    </a>
                  )}
                  {vendor.email && (
                    <a href={`mailto:${vendor.email}`} className="flex items-center gap-3 text-sm text-slate-700 hover:text-spruce-800 transition-colors">
                      <div className="w-10 h-10 rounded-xl bg-spruce-50 flex items-center justify-center shrink-0">
                        <Mail className="w-4 h-4 text-spruce-700" />
                      </div>
                      <span>{vendor.email}</span>
                    </a>
                  )}
                  {vendor.website && (
                    <a
                      href={vendor.website.startsWith('http') ? vendor.website : `https://${vendor.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 text-sm text-slate-700 hover:text-spruce-800 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-xl bg-spruce-50 flex items-center justify-center shrink-0">
                        <Globe className="w-4 h-4 text-spruce-700" />
                      </div>
                      <span className="flex items-center gap-1">
                        Website <ExternalLink className="w-3 h-3" />
                      </span>
                    </a>
                  )}
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
                    to={vendorPath(vendor.id)}
                    className="inline-flex w-full items-center justify-center gap-2 whitespace-nowrap"
                  >
                    <span>Full vendor profile</span>
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
