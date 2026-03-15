import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Textarea } from '../components/ui/textarea';
import { StarRating, StarInput } from '../components/StarRating';
import { listingAPI, reviewAPI } from '../lib/api';
import { useAuth } from '../lib/auth';
import { CATEGORIES, getTierInfo } from '../data/categories';
import { toast } from 'sonner';
import {
  ArrowLeft, MapPin, Phone, Mail, Globe, BadgeCheck,
  ExternalLink, MessageSquare, Send, Loader2, Clock
} from 'lucide-react';

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

  const fetchListing = async () => {
    try {
      const res = await listingAPI.get(id);
      setListing(res.data);
    } catch {
      toast.error('Listing not found');
      navigate('/directory');
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

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
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
      toast.error(err.response?.data?.message || err.response?.data?.detail || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-spruce-700" />
      </div>
    );
  }

  if (!listing) return null;

  const vendor = listing.vendor || {};
  const categoryName = CATEGORIES.find((c) => c.id === listing.categoryId)?.name || listing.categoryId;
  const tierInfo = getTierInfo(vendor.tier);
  const mapQuery = [vendor.name, vendor.city, vendor.neighborhood, 'Alberta'].filter(Boolean).join(', ');
  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`;

  return (
    <div className="min-h-screen bg-slate-50" data-testid="listing-detail-page">
      <div className="container mx-auto px-4 md:px-8 max-w-7xl py-8">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6" data-testid="back-btn">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Hero Image */}
            <div className="relative rounded-xl overflow-hidden h-64 md:h-80 bg-slate-200">
              <img
                src={vendor.images?.[0] || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800'}
                alt={listing.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-4 left-4 flex gap-2 flex-wrap">
                <Badge className="bg-spruce-700 text-white font-medium">{categoryName}</Badge>
                {vendor.verified && (
                  <Badge className="bg-emerald-600 text-white flex items-center gap-1">
                    <BadgeCheck className="w-3.5 h-3.5" /> Verified
                  </Badge>
                )}
              </div>
            </div>

            {/* Listing Info */}
            <div className="bg-white rounded-xl border p-6 md:p-8">
              <h1 className="font-heading text-2xl md:text-3xl font-bold text-slate-900 mb-2" data-testid="listing-title">
                {listing.title}
              </h1>
              {vendor.name && (
                <Link
                  to={`/vendors/${vendor.id}`}
                  className="text-spruce-700 hover:underline font-medium mb-4 inline-block"
                >
                  {vendor.name}
                </Link>
              )}
              {(vendor.city || vendor.neighborhood) && (
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-6">
                  <MapPin className="w-4 h-4" />
                  <span>{[vendor.city, vendor.neighborhood].filter(Boolean).join(', ')}</span>
                </div>
              )}

              <div className="prose max-w-none">
                <h3 className="font-heading text-lg font-semibold text-slate-900 mb-2">Description</h3>
                <p className="text-base leading-relaxed text-slate-600 whitespace-pre-wrap">{listing.description}</p>
              </div>

              {listing.features?.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-heading text-lg font-semibold text-slate-900 mb-2">Features</h3>
                  <ul className="list-disc list-inside text-slate-600 space-y-1">
                    {listing.features.map((f, i) => (
                      <li key={i}>{f}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Reviews / Feedback */}
            <div className="bg-white rounded-xl border p-6 md:p-8" data-testid="reviews-section">
              <h2 className="font-heading text-xl font-semibold mb-6">
                Feedback &amp; Reviews ({reviews.length})
              </h2>

              {user ? (
                <form onSubmit={handleSubmitReview} className="mb-8 p-4 bg-slate-50 rounded-lg" data-testid="review-form">
                  <h3 className="font-medium mb-3">Leave your feedback</h3>
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
                  <Button type="submit" disabled={submitting} className="bg-spruce-700 text-white" data-testid="submit-review-btn">
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                    Submit Review
                  </Button>
                </form>
              ) : (
                <p className="text-sm text-muted-foreground mb-6">
                  <Link to="/login" className="text-spruce-700 hover:underline font-medium">Log in</Link> to leave feedback.
                </p>
              )}

              <div className="space-y-6">
                {reviews.length === 0 && (
                  <p className="text-sm text-muted-foreground py-4">No reviews yet. Be the first!</p>
                )}
                {reviews.map((review) => (
                  <div key={review.id} className="border-b pb-5 last:border-b-0" data-testid={`review-${review.id}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-spruce-100 flex items-center justify-center text-sm font-medium text-spruce-700">
                          {(review.userName || review.user_name || 'U')[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{review.userName || review.user_name || 'User'}</p>
                          <StarRating rating={review.rating} size={12} />
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(review.createdAt || review.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 ml-11">{review.comment}</p>
                    {review.reply && (
                      <div className="ml-11 mt-3 p-3 bg-spruce-50 rounded-lg">
                        <p className="text-xs font-medium text-spruce-700 mb-1">Vendor Response</p>
                        <p className="text-sm text-slate-600">{review.reply}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Card */}
            <div className="bg-white rounded-xl border p-6 sticky top-24" data-testid="listing-contact-card">
              <h3 className="font-heading font-semibold text-lg mb-4">Contact &amp; Location</h3>

              {vendor.tier === 'free' ? (
                <p className="text-sm text-muted-foreground mb-4">
                  Contact info available for upgraded listings.
                  <Link to="/about" className="text-spruce-700 hover:underline ml-1">Learn more</Link>
                </p>
              ) : (
                <div className="space-y-4">
                  {vendor.phone && (
                    <a href={`tel:${vendor.phone}`} className="flex items-center gap-3 text-sm hover:text-spruce-700 transition-colors">
                      <div className="w-10 h-10 rounded-lg bg-spruce-50 flex items-center justify-center">
                        <Phone className="w-4 h-4 text-spruce-700" />
                      </div>
                      <span>{vendor.phone}</span>
                    </a>
                  )}
                  {vendor.email && (
                    <a href={`mailto:${vendor.email}`} className="flex items-center gap-3 text-sm hover:text-spruce-700 transition-colors">
                      <div className="w-10 h-10 rounded-lg bg-spruce-50 flex items-center justify-center">
                        <Mail className="w-4 h-4 text-spruce-700" />
                      </div>
                      <span>{vendor.email}</span>
                    </a>
                  )}
                  {vendor.website && (
                    <a href={vendor.website.startsWith('http') ? vendor.website : `https://${vendor.website}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm hover:text-spruce-700 transition-colors">
                      <div className="w-10 h-10 rounded-lg bg-spruce-50 flex items-center justify-center">
                        <Globe className="w-4 h-4 text-spruce-700" />
                      </div>
                      <span className="flex items-center gap-1">Website <ExternalLink className="w-3 h-3" /></span>
                    </a>
                  )}
                </div>
              )}

              {/* Google Map link / option */}
              <div className="mt-6 space-y-3">
                <p className="text-sm font-medium text-slate-700">View on map</p>
                <Button className="w-full bg-spruce-700 text-white" asChild data-testid="view-on-map-btn">
                  <a href={mapUrl} target="_blank" rel="noopener noreferrer">
                    <MapPin className="w-4 h-4 mr-2" /> Open in Google Maps
                  </a>
                </Button>
                {mapQuery && (
                  <p className="text-xs text-slate-500">
                    {mapQuery}
                  </p>
                )}
              </div>

              <Button variant="outline" className="w-full mt-4" asChild>
                <Link to={`/vendors/${vendor.id}`}>
                  View full vendor profile <ExternalLink className="w-3.5 h-3.5 ml-2" />
                </Link>
              </Button>
            </div>

            {/* Map embed option */}
            <div className="rounded-xl overflow-hidden h-56 bg-slate-200 relative border border-slate-200">
              <a
                href={mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute inset-0 flex items-center justify-center bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                <div className="text-center p-4">
                  <MapPin className="w-10 h-10 text-spruce-600 mx-auto mb-2" />
                  <span className="text-sm font-medium text-slate-700 block">View location in Google Maps</span>
                  <span className="text-xs text-slate-500 block mt-1">Click to open</span>
                </div>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
