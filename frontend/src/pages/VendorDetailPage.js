import { useEffect, useMemo, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { StarRating, StarInput } from '../components/StarRating';
import { vendorAPI, reviewAPI, listingAPI } from '../lib/api';
import { useAuth } from '../lib/auth';
import { CATEGORIES } from '../data/categories';
import { toast } from 'sonner';
import { getApiErrorLines } from '../lib/formatApiError';
import { getVendorVideoKind } from '../lib/vendorVideoEmbed';
import { resolveMediaUrl } from '../lib/mediaUrl';
import { getListingCoverImageUrl } from '../lib/listingCover';
import {
  ArrowLeft,
  MapPin,
  Phone,
  Mail,
  Globe,
  BadgeCheck,
  ExternalLink,
  MessageSquare,
  Send,
  Loader2,
  Clock,
  ChevronLeft,
  ChevronRight,
  Heart,
  Share2,
  Video,
  Sparkles,
} from 'lucide-react';
import { ROUTES, directoryCategoryQuery, listingPath } from '../constants';
import {
  emptyOpeningHours,
  formatLocaleDateTime,
  getNowOpenStatus,
  OPENING_DAY_LABELS,
  OPENING_DAY_ORDER,
} from '../lib/vendorOpeningHours';

const VENDOR_FAV_KEY = 'hey_alberta_favorite_vendors';

function readFavoriteVendorIds() {
  try {
    const raw = localStorage.getItem(VENDOR_FAV_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function toggleFavoriteVendorId(vendorId) {
  const next = readFavoriteVendorIds();
  const i = next.indexOf(vendorId);
  if (i >= 0) next.splice(i, 1);
  else next.push(vendorId);
  localStorage.setItem(VENDOR_FAV_KEY, JSON.stringify(next));
  return i < 0;
}

function VendorVideoInline({ url }) {
  const k = getVendorVideoKind(url);
  if (k.kind === 'empty') return null;
  if (k.kind === 'embed') {
    return (
      <div className="w-full overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-100 aspect-video shadow-inner">
        <iframe
          title="Vendor video"
          src={k.embedSrc}
          className="h-full w-full min-h-[220px]"
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
        className="w-full rounded-2xl border border-slate-200/80 bg-black max-h-[540px] shadow-sm"
      />
    );
  }
  return (
    <a
      href={k.href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-spruce-700 hover:underline font-medium break-all"
    >
      {k.href}
    </a>
  );
}

const VENDOR_HERO_FALLBACK =
  'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200&q=80';

function VendorImageCarousel({ images, alt }) {
  const resolved = useMemo(
    () => images.map((src) => resolveMediaUrl(src) || src).filter(Boolean),
    [images]
  );
  const [idx, setIdx] = useState(0);
  const [imgBroken, setImgBroken] = useState(false);
  const n = resolved.length;
  const safeIdx = n > 0 ? Math.min(idx, n - 1) : 0;
  const current = n > 0 ? resolved[safeIdx] : '';

  useEffect(() => {
    setIdx(0);
  }, [images]);

  useEffect(() => {
    setImgBroken(false);
  }, [current]);

  useEffect(() => {
    if (n <= 1) return undefined;
    const timer = setInterval(() => {
      setIdx((i) => (i + 1) % n);
    }, 4500);
    return () => clearInterval(timer);
  }, [n]);

  const go = (d) => {
    if (n <= 1) return;
    setIdx((i) => (i + d + n) % n);
  };

  if (n === 0) {
    return (
      <div className="relative w-full min-w-0 max-w-full aspect-[21/9] min-h-[220px] md:min-h-[340px] rounded-2xl overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 ring-1 ring-slate-200/70">
        <img
          src={VENDOR_HERO_FALLBACK}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-90"
        />
      </div>
    );
  }

  const displaySrc = imgBroken ? VENDOR_HERO_FALLBACK : current;

  return (
    <div className="relative group w-full min-w-0 max-w-full overflow-hidden rounded-2xl bg-slate-900 shadow-lg ring-1 ring-slate-200/60">
      {/* Absolute fill image: intrinsic dimensions cannot spill out of the aspect box or overlap the grid */}
      <div className="relative w-full aspect-[21/9] min-h-[220px] md:min-h-[340px]">
        <img
          src={displaySrc}
          alt={alt}
          className="absolute inset-0 h-full w-full object-cover"
          onError={() => setImgBroken(true)}
        />
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

function getVendorGalleryImageUrls(vendor) {
  const raw = Array.isArray(vendor?.images) ? vendor.images.filter(Boolean) : [];
  if (!raw.length) return [];
  const requested = Number(vendor?.coverImageIndex);
  const coverIndex = Number.isInteger(requested) ? requested : 0;
  if (coverIndex < 0 || coverIndex >= raw.length) return raw;
  return [raw[coverIndex], ...raw.filter((_, i) => i !== coverIndex)];
}

function extractMapSearchQuery(googleMapUrl) {
  const raw = (googleMapUrl || '').trim();
  if (!raw) return '';
  try {
    const u = new URL(raw);
    const q = u.searchParams.get('q') || u.searchParams.get('query');
    if (q) return q;

    const atMatch = u.href.match(/@(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/);
    if (atMatch) return `${atMatch[1]},${atMatch[2]}`;

    const placeMatch = u.pathname.match(/\/place\/([^/]+)/);
    if (placeMatch?.[1]) return decodeURIComponent(placeMatch[1]).replace(/\+/g, ' ');
  } catch {
    return '';
  }
  return '';
}

export default function VendorDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [replyText, setReplyText] = useState({});
  const [replyingTo, setReplyingTo] = useState(null);
  const [favorited, setFavorited] = useState(false);
  const [vendorListings, setVendorListings] = useState([]);
  const [vendorListingsLoading, setVendorListingsLoading] = useState(false);
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [nowTick, setNowTick] = useState(() => new Date());

  const fetchVendor = async () => {
    try {
      const res = await vendorAPI.get(id);
      setVendor(res.data);
    } catch {
      toast.error('Vendor not found');
      navigate(ROUTES.VENDORS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendor();
  }, [id]);

  useEffect(() => {
    if (!vendor?.id) return;
    setFavorited(readFavoriteVendorIds().includes(vendor.id));
  }, [vendor?.id]);

  useEffect(() => {
    const t = setInterval(() => setNowTick(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!vendor?.id) return;
    let cancelled = false;
    const run = async () => {
      setVendorListingsLoading(true);
      try {
        const res = await listingAPI.directory({ vendorId: vendor.id, limit: 8, page: 1 });
        if (cancelled) return;
        setVendorListings(Array.isArray(res.data?.listings) ? res.data.listings : []);
      } catch {
        if (!cancelled) setVendorListings([]);
      } finally {
        if (!cancelled) setVendorListingsLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [vendor?.id]);

  const myReview = useMemo(() => {
    if (!vendor?.reviews?.length || !user) return null;
    const u = String(user.id ?? user._id ?? '').trim();
    return vendor.reviews.find((r) => String(r.userId ?? r.user_id ?? '').trim() === u) ?? null;
  }, [vendor?.reviews, vendor?.id, user?.id]);

  useEffect(() => {
    if (!user) {
      setReviewRating(5);
      setReviewComment('');
      return;
    }
    if (!vendor?.id) return;
    if (myReview) {
      setReviewRating(Number(myReview.rating) || 5);
      setReviewComment(String(myReview.comment ?? ''));
    } else {
      setReviewRating(5);
      setReviewComment('');
    }
  }, [vendor?.id, user?.id, myReview?.id, myReview?.rating, myReview?.comment]);

  const handleShare = async () => {
    try {
      const url = window.location.href;
      if (navigator.share) {
        await navigator.share({ title: vendor?.name || 'Vendor', url });
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        toast.success('Link copied');
      } else {
        throw new Error('Clipboard not supported');
      }
    } catch {
      try {
        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(window.location.href);
          toast.success('Link copied');
          return;
        }
      } catch {
        // no-op
      }
      toast.error('Could not share or copy link');
    }
  };

  const toggleFavorite = () => {
    if (!vendor?.id) return;
    const now = toggleFavoriteVendorId(vendor.id);
    setFavorited(now);
    toast.success(now ? 'Saved vendor' : 'Removed from saved vendors');
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please log in to leave a review');
      return;
    }
    setSubmitting(true);
    try {
      await reviewAPI.create(id, { rating: reviewRating, comment: reviewComment });
      toast.success('Review saved');
      await fetchVendor();
    } catch (err) {
      const lines = getApiErrorLines(err);
      toast.error(lines[0] || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const openingHours = useMemo(
    () => ({ ...emptyOpeningHours(), ...(vendor?.openingHours || {}) }),
    [vendor?.openingHours]
  );
  const hasAnyOpeningHours = useMemo(
    () => OPENING_DAY_ORDER.some((d) => String(openingHours[d] || '').trim()),
    [openingHours]
  );
  const openStatus = useMemo(() => getNowOpenStatus(openingHours, nowTick), [openingHours, nowTick]);
  const vendorTags = useMemo(
    () => (Array.isArray(vendor?.tags) ? vendor.tags.filter(Boolean) : []),
    [vendor?.tags]
  );

  const submitContactBusiness = useCallback(
    (e) => {
      e.preventDefault();
      const to = (vendor?.email || '').trim();
      if (!to) {
        toast.error('This business has no public email. Please call or visit their website.');
        return;
      }
      if (!(contactMessage || '').trim()) {
        toast.error('Please enter a message.');
        return;
      }
      const subject = encodeURIComponent(
        `Inquiry — ${vendor?.name || 'Hey Alberta'}`
      );
      const body = encodeURIComponent(
        [
          contactName && `Name: ${contactName}`,
          contactEmail && `Email: ${contactEmail}`,
          contactPhone && `Phone: ${contactPhone}`,
          '',
          (contactMessage || '').trim(),
        ]
          .filter(Boolean)
          .join('\n')
      );
      window.location.href = `mailto:${to}?subject=${subject}&body=${body}`;
    },
    [vendor?.email, vendor?.name, contactName, contactEmail, contactPhone, contactMessage]
  );

  const handleReply = async (reviewId) => {
    if (!replyText[reviewId]?.trim()) return;
    try {
      await reviewAPI.reply(reviewId, { reply: replyText[reviewId] });
      toast.success('Reply posted');
      setReplyingTo(null);
      setReplyText({});
      fetchVendor();
    } catch {
      toast.error('Failed to post reply');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-spruce-700" />
      </div>
    );
  }

  if (!vendor) return null;

  const categoryInfo = CATEGORIES.find((c) => c.id === vendor.category);
  const uid = user ? String(user.id ?? user._id ?? '').trim() : '';
  const isOwner = Boolean(uid && String(vendor.user_id ?? '').trim() === uid);
  const gallery = getVendorGalleryImageUrls(vendor);
  const cityLine = [vendor.city, vendor.neighborhood].filter(Boolean).join(', ');
  const locationQuery = [vendor.neighborhood, vendor.city, 'Alberta'].filter(Boolean).join(' ') || 'Alberta';
  const latNum = Number(vendor.latitude);
  const lngNum = Number(vendor.longitude);
  const hasCoords = Number.isFinite(latNum) && Number.isFinite(lngNum);
  const mapSearchQuery = hasCoords
    ? `${latNum},${lngNum}`
    : extractMapSearchQuery(vendor.googleMapUrl) || locationQuery;
  const mapEmbedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(mapSearchQuery)}&t=&z=13&ie=UTF8&iwloc=&output=embed`;
  const directionsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapSearchQuery)}`;

  return (
    <div className="min-h-screen bg-slate-50" data-testid="vendor-detail-page">
      <div className="container mx-auto px-4 md:px-8 max-w-7xl py-8 md:py-10">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-5" data-testid="back-btn">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-7 items-start">
          <div className="min-w-0 lg:col-span-3 space-y-6">
            <div className="relative w-full min-w-0 max-w-full overflow-hidden rounded-2xl">
              <VendorImageCarousel images={gallery} alt={vendor.name} />
              <div className="absolute top-4 left-4 z-20 flex gap-2 flex-wrap">
                {vendor.featured && <Badge className="bg-yellow-500 text-white border-0">Featured</Badge>}
                {vendor.verified && (
                  <Badge className="bg-spruce-700 text-white border-0 flex items-center gap-1">
                    <BadgeCheck className="w-3.5 h-3.5" /> Verified
                  </Badge>
                )}
              </div>
              <div className="absolute top-4 right-4 z-20 flex gap-2">
                <button
                  type="button"
                  onClick={toggleFavorite}
                  className={`inline-flex h-10 w-10 items-center justify-center rounded-full border-2 bg-white/95 shadow-sm transition-colors ${favorited
                      ? 'text-red-500 border-red-200'
                      : 'text-slate-700 border-white/80 hover:text-red-500'
                    }`}
                  aria-label={favorited ? 'Remove from favorites' : 'Save vendor'}
                >
                  <Heart className={`w-4 h-4 ${favorited ? 'fill-current' : ''}`} />
                </button>
                <button
                  type="button"
                  onClick={handleShare}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border-2 border-white/80 bg-white/95 text-slate-700 shadow-sm transition-colors hover:text-spruce-700"
                  aria-label="Share vendor"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <section className="bg-white rounded-2xl border border-slate-200/80 p-6 md:p-8 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                <div>
                  <h1 className="font-heading text-2xl md:text-3xl font-bold text-slate-900" data-testid="vendor-name">
                    {vendor.name}
                  </h1>
                  {categoryInfo && (
                    <Link
                      to={directoryCategoryQuery(categoryInfo.id)}
                      className="inline-flex mt-2 text-sm text-spruce-700 hover:underline font-medium"
                    >
                      {categoryInfo.name}
                    </Link>
                  )}
                </div>
                <StarRating rating={vendor.avg_rating || 0} size={17} showCount count={vendor.review_count || 0} />
              </div>

              <div className="mb-5 flex items-center gap-2 text-sm text-slate-600">
                <MapPin className="w-4 h-4 text-spruce-700" />
                <span>{cityLine || 'Alberta'}</span>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                <h3 className="font-semibold text-slate-900 mb-2">About this business</h3>
                <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">
                  {vendor.description || 'No business description added yet.'}
                </p>
              </div>
            </section>

            {vendor.videoUrl && (
              <section className="bg-white rounded-2xl border border-slate-200/80 p-6 md:p-8 shadow-sm">
                <h2 className="font-heading text-xl font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <Video className="w-5 h-5 text-spruce-700" />
                  Video
                </h2>
                <VendorVideoInline url={vendor.videoUrl} />
              </section>
            )}

            <section className="bg-white rounded-2xl border border-slate-200/80 p-6 md:p-8 shadow-sm" data-testid="reviews-section">
              <h2 className="font-heading text-xl font-semibold mb-6 text-slate-900">
                Reviews ({vendor.reviews?.length || 0})
              </h2>

              {user && isOwner && (
                <p className="text-sm text-slate-600 mb-6 p-4 bg-slate-50 rounded-xl border border-slate-200" data-testid="review-own-vendor-notice">
                  You can&apos;t review your own business.
                </p>
              )}

              {user && !isOwner && (
                <form onSubmit={handleSubmitReview} className="mb-8 p-4 bg-slate-50 rounded-xl border border-slate-200" data-testid="review-form">
                  <h3 className="font-medium mb-3 text-slate-900">
                    {myReview ? 'Your review' : 'Write a review'}
                  </h3>
                  <p className="text-xs text-slate-500 mb-3">
                    One review per account. Submit again anytime to update your rating or comment.
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
                    {myReview ? 'Update review' : 'Submit review'}
                  </Button>
                </form>
              )}

              {!user && (
                <p className="text-sm text-slate-500 mb-6">
                  <Link to={ROUTES.LOGIN} className="text-spruce-700 hover:underline font-medium">Log in</Link> to leave a review.
                </p>
              )}

              <div className="space-y-6">
                {vendor.reviews?.length === 0 && (
                  <p className="text-sm text-slate-500 py-3">No reviews yet. Be the first.</p>
                )}
                {vendor.reviews?.map((review) => (
                  <div key={review.id} className="border-b border-slate-100 pb-5 last:border-b-0" data-testid={`review-${review.id}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-spruce-100 flex items-center justify-center text-sm font-medium text-spruce-700">
                          {review.user_name?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <div>
                          <p className="font-medium text-sm text-slate-900">{review.user_name}</p>
                          <StarRating rating={review.rating} size={12} />
                        </div>
                      </div>
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(review.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 ml-12">{review.comment}</p>

                    {review.reply && (
                      <div className="ml-12 mt-3 p-3 bg-spruce-50 rounded-lg border border-spruce-100">
                        <p className="text-xs font-medium text-spruce-700 mb-1">Vendor Response</p>
                        <p className="text-sm text-slate-600">{review.reply}</p>
                      </div>
                    )}

                    {isOwner && !review.reply && (
                      <div className="ml-12 mt-3">
                        {replyingTo === review.id ? (
                          <div className="flex flex-col sm:flex-row gap-2">
                            <Input
                              value={replyText[review.id] || ''}
                              onChange={(e) => setReplyText({ ...replyText, [review.id]: e.target.value })}
                              placeholder="Write a reply..."
                              className="text-sm"
                              data-testid={`reply-input-${review.id}`}
                            />
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => handleReply(review.id)} className="bg-spruce-700 hover:bg-spruce-800 text-white" data-testid={`reply-submit-${review.id}`}>
                                Reply
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => setReplyingTo(null)}>Cancel</Button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => setReplyingTo(review.id)}
                            className="text-xs text-spruce-700 hover:underline flex items-center gap-1"
                            data-testid={`reply-btn-${review.id}`}
                          >
                            <MessageSquare className="w-3 h-3" /> Reply
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>

            <section className="bg-white rounded-2xl border border-slate-200/80 p-6 md:p-8 shadow-sm" data-testid="vendor-listings-section">
              <div className="mb-5 flex items-center justify-between gap-3">
                <h2 className="font-heading text-xl font-semibold text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-spruce-700" />
                  More listings from {vendor.name}
                </h2>
              </div>

              {vendorListingsLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="animate-pulse overflow-hidden rounded-xl border border-slate-200 bg-white">
                      <div className="h-36 bg-slate-100" />
                      <div className="p-4 space-y-2">
                        <div className="h-4 w-3/4 rounded bg-slate-100" />
                        <div className="h-3 w-1/2 rounded bg-slate-100" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : vendorListings.length === 0 ? (
                <p className="text-sm text-slate-500">No published listings from this vendor yet.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {vendorListings.map((listing) => {
                    const cover = resolveMediaUrl(getListingCoverImageUrl(listing)) || getListingCoverImageUrl(listing) || '/services/1.jpg';
                    const priceLabel = (listing.price || '').trim() || 'Contact for price';
                    return (
                      <Link
                        key={listing.id}
                        to={listingPath(listing.id)}
                        className="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition"
                      >
                        <div className="relative h-36 bg-slate-100">
                          <img src={cover} alt="" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
                          <span className="absolute right-3 bottom-3 rounded-lg bg-white/95 px-2 py-1 text-xs font-semibold text-spruce-900 shadow-sm">
                            {priceLabel}
                          </span>
                        </div>
                        <div className="p-4">
                          <h3 className="font-semibold text-slate-900 line-clamp-1 group-hover:text-spruce-800">{listing.title}</h3>
                          <p className="mt-1 text-xs text-slate-500 line-clamp-2">{listing.description || 'Explore details'}</p>
                          <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                            <span>{listing.reviewCount ?? 0} reviews</span>
                            <span className="text-slate-300">•</span>
                            <span>{listing.avgRating ? `${listing.avgRating} ★` : 'No ratings'}</span>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </section>
          </div>

          <div className="min-w-0 lg:col-span-2 space-y-6">
            <section className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm" data-testid="vendor-contact-card">
              <h3 className="font-heading font-semibold text-lg mb-4 text-slate-900">Contact Information</h3>
              <div className="space-y-4">
                {vendor.phone && (
                  <a href={`tel:${vendor.phone}`} className="flex items-center gap-3 text-sm text-slate-700 hover:text-spruce-700 transition-colors" data-testid="vendor-phone">
                    <div className="w-10 h-10 rounded-lg bg-spruce-50 flex items-center justify-center">
                      <Phone className="w-4 h-4 text-spruce-700" />
                    </div>
                    <span>{vendor.phone}</span>
                  </a>
                )}
                {vendor.email && (
                  <a href={`mailto:${vendor.email}`} className="flex items-center gap-3 text-sm text-slate-700 hover:text-spruce-700 transition-colors" data-testid="vendor-email">
                    <div className="w-10 h-10 rounded-lg bg-spruce-50 flex items-center justify-center">
                      <Mail className="w-4 h-4 text-spruce-700" />
                    </div>
                    <span>{vendor.email}</span>
                  </a>
                )}
                {vendor.website && (
                  <a href={vendor.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm text-slate-700 hover:text-spruce-700 transition-colors" data-testid="vendor-website">
                    <div className="w-10 h-10 rounded-lg bg-spruce-50 flex items-center justify-center">
                      <Globe className="w-4 h-4 text-spruce-700" />
                    </div>
                    <span className="flex items-center gap-1">Website <ExternalLink className="w-3 h-3" /></span>
                  </a>
                )}
                {!vendor.phone && !vendor.email && !vendor.website && (
                  <p className="text-sm text-slate-500">Contact info is not available yet.</p>
                )}
              </div>

              <Button className="w-full mt-6 bg-spruce-700 hover:bg-spruce-800 text-white" asChild data-testid="get-directions-btn">
                <a href={directionsUrl} target="_blank" rel="noopener noreferrer">
                 Get Directions
                </a>
              </Button>
            </section>

            <section className="rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-sm">
              <div className="px-5 py-3 border-b border-slate-100">
                <h4 className="font-semibold text-slate-900">Business Location</h4>
              </div>
              <div className="h-64 md:h-72">
                <iframe
                  title="Vendor map"
                  src={mapEmbedUrl}
                  className="w-full h-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </section>

            <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden" data-testid="vendor-opening-hours">
              <div className="px-5 py-4 border-b border-dashed border-slate-200">
                <h4 className="font-heading font-semibold text-slate-900">Opening Hours</h4>
              </div>
              <div className="px-5 py-3 flex items-center justify-between border-b border-dashed border-slate-200">
                <span className="text-sm font-medium text-slate-600">Now</span>
                <span
                  className={`text-sm font-semibold ${
                    !hasAnyOpeningHours
                      ? 'text-slate-400'
                      : openStatus.known
                        ? openStatus.open
                          ? 'text-emerald-600'
                          : 'text-red-500'
                        : 'text-slate-400'
                  }`}
                >
                  {!hasAnyOpeningHours ? '—' : openStatus.known ? (openStatus.open ? 'Open' : 'Closed') : '—'}
                </span>
              </div>
              {!hasAnyOpeningHours ? (
                <p className="px-5 py-4 text-sm text-slate-500">No hours listed yet.</p>
              ) : (
                <div className="divide-y divide-dashed divide-slate-200">
                  {OPENING_DAY_ORDER.map((day) => {
                    const line = String(openingHours[day] || '').trim();
                    return (
                      <div key={day} className="px-5 py-2.5 flex items-center justify-between gap-3 text-sm">
                        <span className="text-slate-600">{OPENING_DAY_LABELS[day]}</span>
                        <span className="text-slate-700 text-right tabular-nums">{line || '—'}</span>
                      </div>
                    );
                  })}
                </div>
              )}
              <div className="p-4 pt-3">
                <div className="w-full rounded-lg bg-spruce-800 text-white text-center text-sm font-medium py-2.5 px-3 shadow-sm">
                  {formatLocaleDateTime(nowTick)}
                </div>
              </div>
            </section>

            <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 md:p-6" data-testid="vendor-contact-business">
              <h4 className="font-heading font-semibold text-slate-900 mb-4">Contact Business</h4>
              <form onSubmit={submitContactBusiness} className="space-y-3">
                <Input
                  placeholder="Your Name"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  className="h-11 bg-slate-100 text-slate-900 placeholder:text-slate-400 rounded-md"
                />
                <Input
                  type="email"
                  placeholder="Your Email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="h-11 bg-slate-100 text-slate-900 placeholder:text-slate-400 rounded-md"
                />
                <Input
                  placeholder="Your Phone"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  className="h-11 bg-slate-100 text-slate-900 placeholder:text-slate-400 rounded-md"
                />
                <Textarea
                  placeholder="Your Message"
                  value={contactMessage}
                  onChange={(e) => setContactMessage(e.target.value)}
                  rows={4}
                  className="min-h-[100px] bg-slate-100 text-slate-900 placeholder:text-slate-400 rounded-md resize-y"
                  required
                />
                <Button
                  type="submit"
                  className="w-full sm:w-auto h-11 px-8 bg-spruce-700 hover:bg-spruce-800 text-white font-semibold tracking-wide uppercase text-xs rounded-md shadow-sm"
                >
                  Send message
                </Button>
                {!vendor.email?.trim() && (
                  <p className="text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded-md px-3 py-2">
                    This business has not published an email. Use phone or website above, or add your details and we will try to route through the directory when possible.
                  </p>
                )}
              </form>
            </section>

            {vendorTags.length > 0 && (
              <section className="border-y border-slate-200 bg-white py-5 px-1" data-testid="vendor-tags-section">
                <h4 className="font-heading font-semibold text-slate-900 mb-3 px-4">Tags</h4>
                <div className="flex flex-wrap gap-2 px-4">
                  {vendorTags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}