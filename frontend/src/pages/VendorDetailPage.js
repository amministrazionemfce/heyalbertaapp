import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Textarea } from '../components/ui/textarea';
import { StarRating, StarInput } from '../components/StarRating';
import { vendorAPI, reviewAPI } from '../lib/api';
import { useAuth } from '../lib/auth';
import { getTierInfo, CATEGORIES } from '../data/categories';
import { toast } from 'sonner';
import {
  ArrowLeft, MapPin, Phone, Mail, Globe, BadgeCheck,
  ExternalLink, MessageSquare, Send, Loader2, Clock
} from 'lucide-react';
import { ROUTES, directoryCategoryQuery } from '../constants';

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

  const fetchVendor = async () => {
    try {
      const res = await vendorAPI.get(id);
      setVendor(res.data);
    } catch {
      toast.error('Vendor not found');
      navigate(ROUTES.DIRECTORY);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchVendor(); }, [id]);

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!user) { toast.error('Please log in to leave a review'); return; }
    setSubmitting(true);
    try {
      await reviewAPI.create(id, { rating: reviewRating, comment: reviewComment });
      toast.success('Review submitted!');
      setReviewComment('');
      setReviewRating(5);
      fetchVendor();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = async (reviewId) => {
    if (!replyText[reviewId]?.trim()) return;
    try {
      await reviewAPI.reply(reviewId, { reply: replyText[reviewId] });
      toast.success('Reply posted!');
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

  const tierInfo = getTierInfo(vendor.tier);
  const categoryInfo = CATEGORIES.find(c => c.id === vendor.category);
  const isOwner = user && vendor.user_id === user.id;

  return (
    <div className="min-h-screen bg-slate-50" data-testid="vendor-detail-page">
      <div className="container mx-auto px-4 md:px-8 max-w-7xl py-8">
        {/* Back */}
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
                alt={vendor.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-4 left-4 flex gap-2">
                <Badge className={`${tierInfo.color} font-medium`}>{tierInfo.name}</Badge>
                {vendor.verified && (
                  <Badge className="bg-spruce-700 text-white flex items-center gap-1">
                    <BadgeCheck className="w-3.5 h-3.5" /> Verified
                  </Badge>
                )}
              </div>
            </div>

            {/* Info */}
            <div className="bg-white rounded-xl border p-6 md:p-8">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="font-heading text-2xl md:text-3xl font-bold text-slate-900 mb-2" data-testid="vendor-name">
                    {vendor.name}
                  </h1>
                  {categoryInfo && (
                    <Link to={directoryCategoryQuery(categoryInfo.id)} className="text-sm text-spruce-700 hover:underline font-medium">
                      {categoryInfo.name}
                    </Link>
                  )}
                </div>
                <StarRating rating={vendor.avg_rating || 0} size={18} showCount count={vendor.review_count || 0} />
              </div>

              <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-6">
                <MapPin className="w-4 h-4" />
                <span>{vendor.city}{vendor.neighborhood ? `, ${vendor.neighborhood}` : ''}</span>
              </div>

              <div className="prose max-w-none">
                <p className="text-base leading-relaxed text-slate-600">{vendor.description}</p>
              </div>

              {/* Additional Images */}
              {vendor.images?.length > 1 && (
                <div className="grid grid-cols-3 gap-3 mt-6">
                  {vendor.images.slice(1).map((img, i) => (
                    <div key={i} className="rounded-lg overflow-hidden h-32 bg-slate-100">
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Reviews Section */}
            <div className="bg-white rounded-xl border p-6 md:p-8" data-testid="reviews-section">
              <h2 className="font-heading text-xl font-semibold mb-6">
                Reviews ({vendor.reviews?.length || 0})
              </h2>

              {/* Write Review */}
              {user && !isOwner && (
                <form onSubmit={handleSubmitReview} className="mb-8 p-4 bg-slate-50 rounded-lg" data-testid="review-form">
                  <h3 className="font-medium mb-3">Write a Review</h3>
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
              )}

              {!user && (
                <p className="text-sm text-muted-foreground mb-6">
                  <Link to={ROUTES.LOGIN} className="text-spruce-700 hover:underline font-medium">Log in</Link> to leave a review.
                </p>
              )}

              {/* Review List */}
              <div className="space-y-6">
                {vendor.reviews?.length === 0 && (
                  <p className="text-sm text-muted-foreground py-4">No reviews yet. Be the first!</p>
                )}
                {vendor.reviews?.map(review => (
                  <div key={review.id} className="border-b pb-5 last:border-b-0" data-testid={`review-${review.id}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-spruce-100 flex items-center justify-center text-sm font-medium text-spruce-700">
                          {review.user_name?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{review.user_name}</p>
                          <StarRating rating={review.rating} size={12} />
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(review.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 ml-11">{review.comment}</p>

                    {review.reply && (
                      <div className="ml-11 mt-3 p-3 bg-spruce-50 rounded-lg">
                        <p className="text-xs font-medium text-spruce-700 mb-1">Vendor Response</p>
                        <p className="text-sm text-slate-600">{review.reply}</p>
                      </div>
                    )}

                    {isOwner && !review.reply && (
                      <div className="ml-11 mt-3">
                        {replyingTo === review.id ? (
                          <div className="flex gap-2">
                            <Input
                              value={replyText[review.id] || ''}
                              onChange={(e) => setReplyText({ ...replyText, [review.id]: e.target.value })}
                              placeholder="Write a reply..."
                              className="text-sm"
                              data-testid={`reply-input-${review.id}`}
                            />
                            <Button size="sm" onClick={() => handleReply(review.id)} className="bg-spruce-700 text-white" data-testid={`reply-submit-${review.id}`}>
                              Reply
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setReplyingTo(null)}>Cancel</Button>
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
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Card */}
            <div className="bg-white rounded-xl border p-6 sticky top-24" data-testid="vendor-contact-card">
              <h3 className="font-heading font-semibold text-lg mb-4">Contact Information</h3>

              {vendor.tier === 'free' ? (
                <p className="text-sm text-muted-foreground">
                  Contact info available for verified vendors. 
                  <Link to={ROUTES.ABOUT} className="text-spruce-700 hover:underline ml-1">Learn more</Link>
                </p>
              ) : (
                <div className="space-y-4">
                  {vendor.phone && (
                    <a href={`tel:${vendor.phone}`} className="flex items-center gap-3 text-sm hover:text-spruce-700 transition-colors" data-testid="vendor-phone">
                      <div className="w-10 h-10 rounded-lg bg-spruce-50 flex items-center justify-center">
                        <Phone className="w-4 h-4 text-spruce-700" />
                      </div>
                      <span>{vendor.phone}</span>
                    </a>
                  )}
                  {vendor.email && (
                    <a href={`mailto:${vendor.email}`} className="flex items-center gap-3 text-sm hover:text-spruce-700 transition-colors" data-testid="vendor-email">
                      <div className="w-10 h-10 rounded-lg bg-spruce-50 flex items-center justify-center">
                        <Mail className="w-4 h-4 text-spruce-700" />
                      </div>
                      <span>{vendor.email}</span>
                    </a>
                  )}
                  {vendor.website && (
                    <a href={vendor.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm hover:text-spruce-700 transition-colors" data-testid="vendor-website">
                      <div className="w-10 h-10 rounded-lg bg-spruce-50 flex items-center justify-center">
                        <Globe className="w-4 h-4 text-spruce-700" />
                      </div>
                      <span className="flex items-center gap-1">Website <ExternalLink className="w-3 h-3" /></span>
                    </a>
                  )}
                </div>
              )}

              <Button className="w-full mt-6 bg-spruce-700 text-white" asChild data-testid="get-directions-btn">
                <a href={`https://www.google.com/maps/search/${encodeURIComponent(`${vendor.name} ${vendor.city} Alberta`)}`} target="_blank" rel="noopener noreferrer">
                  <MapPin className="w-4 h-4 mr-2" /> Get Directions
                </a>
              </Button>
            </div>

            {/* Map Placeholder */}
            <div className="rounded-xl overflow-hidden h-48 bg-slate-200 relative">
              <img
                src="https://images.unsplash.com/photo-1592930686924-e9751cb4919d?crop=entropy&cs=srgb&fm=jpg&w=600"
                alt="Map placeholder"
                className="w-full h-full object-cover opacity-60"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-medium text-slate-700 bg-white/80 px-4 py-2 rounded-lg">
                  <MapPin className="w-4 h-4 inline mr-1" /> {vendor.city}, Alberta
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}