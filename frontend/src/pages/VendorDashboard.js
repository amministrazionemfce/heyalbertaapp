import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { useAuth } from '../lib/auth';
import { reviewAPI, listingAPI, uploadVendorVideo, BACKEND_URL } from '../lib/api';
import { CATEGORIES, CITIES } from '../data/categories';
import { listingFormValidation, hasListingFormErrors } from '../validations/listingFormValidation';
import AuthFormError from '../components/AuthFormError';
import { getApiErrorLines } from '../lib/formatApiError';
import { StarRating } from '../components/StarRating';
import { toast } from 'sonner';
import {
  Pencil, Trash2, Loader2, Store, MessageSquare,
  Clock, ListPlus, Star, Video, ImageIcon, MapPin, Sparkles,
} from 'lucide-react';
import { MEMBERSHIP_PLANS_URL, ROUTES } from '../constants';
import { resolveMediaUrl } from '../lib/mediaUrl';
import { getVendorVideoKind, isDirectPlayableVideoUrl } from '../lib/vendorVideoEmbed';
import { emptyOpeningHours, OPENING_DAY_LABELS, OPENING_DAY_ORDER } from '../lib/vendorOpeningHours';
import { membershipPlanTierFromUserAndListings } from '../lib/membershipTier';
import {
  listingPlanTierCapabilities,
  FREE_LISTING_DESCRIPTION_MAX_WORDS,
  countWords,
} from '../lib/listingTierRules';
import MembershipTierEntitlementsCard, { MembershipUpgradeCard } from '../components/MembershipTierEntitlementsCard';

const emptyListingForm = {
  title: '',
  businessName: '',
  description: '',
  price: '',
  categoryId: '',
  city: '',
  neighborhood: '',
  phone: '',
  email: '',
  website: '',
  googleMapUrl: '',
  latitude: '',
  longitude: '',
  status: 'published',
  images: [],
  coverImageIndex: 0,
  videoUrl: '',
  openingHours: emptyOpeningHours(),
  showOpeningHours: false,
};

/** YouTube / Vimeo / TikTok / Instagram embed, uploaded file player, or external link. */
function VendorVideoBlock({ url, classNameFile }) {
  const k = getVendorVideoKind(url);
  if (k.kind === 'empty') return null;
  if (k.kind === 'embed') {
    return (
      <div className="mt-1 w-full max-w-md overflow-hidden rounded-lg border border-slate-200 bg-slate-100 aspect-video">
        <iframe
          src={k.embedSrc}
          title={`${k.provider} video`}
          className="h-full w-full min-h-[180px]"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          loading="lazy"
        />
      </div>
    );
  }
  if (isDirectPlayableVideoUrl(url)) {
    return <VendorVideoPreview url={url} className={classNameFile} />;
  }
  return (
    <a
      href={k.href}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-1 inline-block text-sm text-spruce-600 hover:underline font-medium break-all"
    >
      {k.href}
    </a>
  );
}

/** Inline preview: loads video directly from API (not via CRA proxy) so Range/MP4 works. */
function VendorVideoPreview({ url, className }) {
  const resolved = resolveMediaUrl(url);
  const [headOk, setHeadOk] = useState(null);
  const [headStatus, setHeadStatus] = useState(null);
  const [playError, setPlayError] = useState(false);

  useEffect(() => {
    if (!resolved) return;
    let cancelled = false;
    setHeadOk(null);
    setHeadStatus(null);
    setPlayError(false);
    fetch(resolved, { method: 'HEAD', mode: 'cors' })
      .then((r) => {
        if (!cancelled) {
          setHeadOk(r.ok);
          setHeadStatus(r.status);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setHeadOk(false);
          setHeadStatus(0);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [resolved]);

  if (!resolved) return null;

  const mixedContentBlocked =
    typeof window !== 'undefined' &&
    window.location.protocol === 'https:' &&
    resolved.startsWith('http:');

  if (mixedContentBlocked) {
    return (
      <p className="text-xs text-red-800 bg-red-50 border border-red-200 rounded-md px-2 py-2 max-w-md">
        HTTPS page cannot load HTTP video. Use <code className="rounded bg-white px-1 text-[11px]">http://</code> for this
        app in dev, or serve the API over HTTPS and set <code className="rounded bg-white px-1 text-[11px]">REACT_APP_BACKEND_URL</code> to that URL.
      </p>
    );
  }

  if (headOk === false) {
    return (
      <div className="text-xs text-red-800 bg-red-50 border border-red-200 rounded-md px-2 py-2 max-w-md space-y-1">
        <p>
          No file at this URL (HTTP {headStatus || 'network'}). Is the API running at{' '}
          <code className="rounded bg-white px-1 text-[11px]">{BACKEND_URL}</code>?
        </p>
        <p className="break-all font-mono text-[11px] text-red-900">{resolved}</p>
      </div>
    );
  }

  if (headOk === null) {
    return <p className="text-xs text-slate-500">Loading video…</p>;
  }

  return (
    <div className="flex flex-col gap-1.5">
      <video
        key={resolved}
        src={resolved}
        title={resolved}
        controls
        playsInline
        preload="metadata"
        className={className}
        onError={() => setPlayError(true)}
        onLoadedData={() => setPlayError(false)}
      />
      {playError ? (
        <p className="text-xs text-amber-900 bg-amber-50 border border-amber-200 rounded-md px-2 py-2 max-w-md">
          Decoder failed (unusual). Try{' '}
          <a href={resolved} target="_blank" rel="noopener noreferrer" className="font-medium text-spruce-700 underline">
            open in new tab
          </a>
          . Re-upload or re-encode on the server (ffmpeg).
        </p>
      ) : null}
    </div>
  );
}

export default function VendorDashboard() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const normalizedTab = tabParam === 'settings' ? 'add-listing' : tabParam;
  const tabFromUrl = normalizedTab === 'add-listing' || normalizedTab === 'reviews' ? normalizedTab : 'listings';
  const [loading, setLoading] = useState(true);
  const [listings, setListings] = useState([]);
  const [listingsLoading, setListingsLoading] = useState(false);
  const [listingForm, setListingForm] = useState(() => ({
    ...emptyListingForm,
    openingHours: emptyOpeningHours(),
  }));
  const [listingFormErrors, setListingFormErrors] = useState({});
  const [listingApiErrorLines, setListingApiErrorLines] = useState([]);
  const [editingListingId, setEditingListingId] = useState(null);
  const [listingSaving, setListingSaving] = useState(false);

  const sortedListingsByCreated = useMemo(
    () => [...listings].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)),
    [listings]
  );
  const hasProfile = sortedListingsByCreated.length > 0;

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate(ROUTES.LOGIN);
      return;
    }
    (async () => {
      setLoading(true);
      await fetchListings();
      setLoading(false);
    })();
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!loading && listings.length === 0 && searchParams.get('tab') !== 'add-listing') {
      setSearchParams({ tab: 'add-listing' });
    }
  }, [loading, listings.length, searchParams, setSearchParams]);

  const effectiveTab = tabFromUrl;
  const vendorListingPlan = membershipPlanTierFromUserAndListings(user, listings);
  const planCapabilities = useMemo(
    () => listingPlanTierCapabilities(vendorListingPlan),
    [vendorListingPlan]
  );
  const freePlanListingLimitReached =
    planCapabilities.maxListings != null &&
    listings.length >= planCapabilities.maxListings &&
    !editingListingId;

  const fetchListings = async () => {
    setListingsLoading(true);
    try {
      const res = await listingAPI.myListings();
      setListings(res.data || []);
    } catch { setListings([]); } finally { setListingsLoading(false); }
  };

  const handleDeleteListing = async (id) => {
    if (!window.confirm('Delete this listing?')) return;
    try {
      await listingAPI.delete(id);
      toast.success('Listing deleted');
      fetchListings();
    } catch { toast.error('Failed to delete'); }
  };

  const patchListingForm = (patchOrFn) => {
    setListingForm((prev) => (typeof patchOrFn === 'function' ? patchOrFn(prev) : { ...prev, ...patchOrFn }));
    setListingFormErrors((e) => {
      if (typeof patchOrFn === 'function') return { ...e };
      const next = { ...e };
      Object.keys(patchOrFn).forEach((k) => {
        if (next[k]) delete next[k];
      });
      return next;
    });
    setListingApiErrorLines([]);
  };

  const handleSaveListing = async () => {
    const openingHours = {};
    if (listingForm.showOpeningHours) {
      for (const d of OPENING_DAY_ORDER) {
        const v = listingForm.openingHours?.[d];
        if (v != null && String(v).trim()) openingHours[d] = String(v).trim().slice(0, 120);
      }
    }
    const latRaw = listingForm.latitude;
    const lngRaw = listingForm.longitude;
    const trimmed = {
      title: (listingForm.title || '').trim(),
      businessName: (listingForm.businessName || '').trim(),
      description: (listingForm.description || '').trim(),
      price: (listingForm.price != null ? String(listingForm.price) : '').trim(),
      categoryId: (listingForm.categoryId || '').trim(),
      city: (listingForm.city || '').trim(),
      neighborhood: (listingForm.neighborhood || '').trim(),
      phone: (listingForm.phone || '').trim(),
      email: (listingForm.email || '').trim(),
      website: (listingForm.website || '').trim(),
      googleMapUrl: (listingForm.googleMapUrl || '').trim(),
      latitude: latRaw === '' || latRaw === undefined || latRaw === null ? '' : Number(latRaw),
      longitude: lngRaw === '' || lngRaw === undefined || lngRaw === null ? '' : Number(lngRaw),
      status: (listingForm.status || '').trim(),
      images: Array.isArray(listingForm.images) ? listingForm.images : [],
      coverImageIndex: listingForm.coverImageIndex ?? 0,
      videoUrl: (listingForm.videoUrl || '').trim(),
      openingHours,
    };

    const errors = listingFormValidation(trimmed, vendorListingPlan);
    setListingFormErrors(errors);
    setListingApiErrorLines([]);
    if (hasListingFormErrors(errors)) {
      const msgs = Object.values(errors).filter(Boolean);
      toast.error(msgs[0] || 'Please fix the highlighted fields before saving.');
      return;
    }

    setListingSaving(true);
    try {
      const payload = {
        title: trimmed.title,
        businessName: trimmed.businessName,
        description: trimmed.description,
        price: trimmed.price,
        categoryId: trimmed.categoryId,
        city: trimmed.city,
        neighborhood: trimmed.neighborhood,
        phone: trimmed.phone,
        email: trimmed.email,
        website: trimmed.website,
        status: trimmed.status,
        images: trimmed.images,
        coverImageIndex: Math.min(
          Math.max(0, trimmed.coverImageIndex),
          Math.max(0, trimmed.images.length - 1)
        ),
        videoUrl: trimmed.videoUrl || '',
        googleMapUrl: trimmed.googleMapUrl,
        latitude: trimmed.latitude === '' ? undefined : trimmed.latitude,
        longitude: trimmed.longitude === '' ? undefined : trimmed.longitude,
        openingHours: trimmed.openingHours,
        showOpeningHours: Boolean(listingForm.showOpeningHours),
      };
      if (editingListingId) {
        await listingAPI.update(editingListingId, payload);
        toast.success('Listing updated');
        setEditingListingId(null);
        setListingForm({ ...emptyListingForm, openingHours: emptyOpeningHours() });
        setListingFormErrors({});
        setListingApiErrorLines([]);
        setSearchParams({});
      } else {
        await listingAPI.create({ ...payload });
        toast.success(
          trimmed.status === 'published'
            ? 'Listing created and published.'
            : 'Listing saved as draft.'
        );
        setListingForm({ ...emptyListingForm, openingHours: emptyOpeningHours() });
        setListingFormErrors({});
        setListingApiErrorLines([]);
        setSearchParams({});
      }
      fetchListings();
    } catch (err) {
      const lines = getApiErrorLines(err);
      setListingApiErrorLines(lines);
      const msg = lines[0] || '';
      if (/title|already exists/i.test(msg)) {
        setListingFormErrors((e) => ({ ...e, title: msg }));
      }
    } finally {
      setListingSaving(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-spruce-700" /></div>;

  const navItems = [
    { id: 'listings', label: 'My Listings', icon: Store, testId: 'tab-listings' },
    { id: 'add-listing', label: 'Add listing', icon: ListPlus, testId: 'tab-add-listing' },
    { id: 'reviews', label: 'Reviews', icon: MessageSquare, testId: 'tab-reviews' },
  ];

  const setTab = (id) => {
    setSearchParams(id === 'listings' ? {} : { tab: id });
  };

  const isNavActive = (itemId) =>
    (itemId === 'listings' && effectiveTab === 'listings') || (itemId !== 'listings' && effectiveTab === itemId);

  return (
    <div className="min-h-screen flex flex-col lg:flex-row" data-testid="vendor-dashboard">
      {/* Left sidebar — vertical on lg+, horizontal bar on smaller */}
      <aside className="lg:w-56 flex-shrink-0 bg-white border-b lg:border-b-0 border-slate-200 lg:min-h-screen lg:sticky lg:top-0">
        <div className="flex flex-col lg:block">
          <nav className="p-3 flex flex-row lg:flex-col flex-wrap gap-2 lg:gap-3">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTab(item.id)}
                  className={`flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors lg:w-full ${isNavActive(item.id) ? 'bg-spruce-700 text-white hover:bg-spruce-700' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  data-testid={item.testId}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0 min-h-0 flex flex-col py-6 px-4 md:px-6">
        <div className="flex-1 min-h-0 flex flex-col w-full">
          <div className="flex-1 min-w-0 flex flex-col">
          {effectiveTab === 'add-listing' && (
            <div className="space-y-4 w-full">
              {freePlanListingLimitReached ? (
                <FreePlanListingLimitPanel />
              ) : (
                <ListingFormSection
                  listingForm={listingForm}
                  patchListingForm={patchListingForm}
                  editingListingId={editingListingId}
                  saving={listingSaving}
                  onSave={handleSaveListing}
                  onCancel={() => {
                    setEditingListingId(null);
                    setListingForm({ ...emptyListingForm, openingHours: emptyOpeningHours() });
                    setListingFormErrors({});
                    setListingApiErrorLines([]);
                    setSearchParams({});
                  }}
                  disabled={false}
                  errors={listingFormErrors}
                  apiErrorLines={listingApiErrorLines}
                  vendorListingPlan={vendorListingPlan}
                />
              )}
            </div>
          )}
          {effectiveTab === 'listings' && (
            <ListingsTableView
              hasProfile={hasProfile}
              listings={listings}
              loading={listingsLoading}
              addListingBlocked={freePlanListingLimitReached}
              onAddListing={() => {
                setEditingListingId(null);
                setListingForm({ ...emptyListingForm, openingHours: emptyOpeningHours() });
                setListingFormErrors({});
                setListingApiErrorLines([]);
                setSearchParams({ tab: 'add-listing' });
              }}
              onEditListing={(listing) => {
                const cap = listingPlanTierCapabilities(vendorListingPlan);
                let imgs = Array.isArray(listing.images) ? [...listing.images] : [];
                if (cap.maxImages === 1 && imgs.length > 1) imgs = imgs.slice(0, 1);
                setListingForm({
                  title: listing.title || '',
                  businessName: listing.businessName != null ? String(listing.businessName) : '',
                  description: listing.description || '',
                  price: listing.price != null ? String(listing.price) : '',
                  categoryId: listing.categoryId || '',
                  city: listing.city || '',
                  neighborhood: listing.neighborhood || '',
                  phone: listing.phone || '',
                  email: listing.email || '',
                  website: listing.website || '',
                  googleMapUrl: listing.googleMapUrl || '',
                  latitude: listing.latitude ?? '',
                  longitude: listing.longitude ?? '',
                  status: listing.status === 'draft' ? 'draft' : 'published',
                  images: imgs,
                  coverImageIndex: imgs.length ? Math.min(Number(listing.coverImageIndex) || 0, imgs.length - 1) : 0,
                  videoUrl: listing.videoUrl || '',
                  openingHours: { ...emptyOpeningHours(), ...(listing.openingHours || {}) },
                  showOpeningHours: listing.showOpeningHours !== false,
                });
                setListingFormErrors({});
                setListingApiErrorLines([]);
                setEditingListingId(listing.id);
                setSearchParams({ tab: 'add-listing' });
              }}
              onDeleteListing={handleDeleteListing}
            />
          )}
          {effectiveTab === 'reviews' && (
            <VendorReviews listings={listings} canReplyToReviews={listingPlanTierCapabilities(vendorListingPlan).allowReviewReplies} />
          )}
          </div>
        </div>
      </main>

      {/* Right sidebar: plan entitlements + upgrade */}
      <aside className="hidden lg:block w-72 flex-shrink-0 border-l border-slate-200 bg-white/50 p-6 space-y-6">
        <MembershipTierEntitlementsCard planTier={vendorListingPlan} />
        <MembershipUpgradeCard planTier={vendorListingPlan} />
      </aside>

    </div>
  );
}

function FreePlanListingLimitPanel() {
  return (
    <div
      className="mx-auto max-w-lg rounded-2xl border text-center shadow-sm md:p-10"
      data-testid="free-plan-listing-limit-notice"
    >
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full">
        <Sparkles className="h-6 w-6" aria-hidden />
      </div>
      <h2 className="font-heading text-xl font-semibold text-slate-900 md:text-2xl">Listing limit reached</h2>
      <p className="mt-3 text-sm leading-relaxed text-slate-600">
        You can only have one listing with your current membership. If you want to add more listings, please
        upgrade your membership.
      </p>
      <Button asChild className="mt-6 bg-spruce-700 hover:bg-spruce-800 text-white">
        <Link to={MEMBERSHIP_PLANS_URL}>View membership plans</Link>
      </Button>
    </div>
  );
}

function ListingsTableView({
  hasProfile,
  listings,
  loading,
  addListingBlocked,
  onAddListing,
  onEditListing,
  onDeleteListing,
}) {
  if (!hasProfile) {
    return (
      <div className="text-center py-16 bg-white rounded-xl border">
        <Store className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <p className="text-lg font-medium text-slate-600 mb-2">No listings yet</p>
        <p className="text-sm text-muted-foreground mb-4">Create your first listing under Add listing — it will show here when saved.</p>
        <Button
          onClick={onAddListing}
          className="bg-spruce-700 hover:bg-spruce-800 text-white"
          title={addListingBlocked ? 'Free plan: one listing. Open to see upgrade options.' : undefined}
        >
          <ListPlus className="w-4 h-4 mr-2" /> Add listing
        </Button>
      </div>
    );
  }
  if (loading) {
    return <div className="flex items-center justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-spruce-700" /></div>;
  }
  if (listings.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center" data-testid="listings-empty">
        <Store className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <p className="text-lg font-medium text-slate-600 mb-2">No listings yet</p>
        <p className="text-sm text-muted-foreground mb-4">Add your first listing to appear in the directory.</p>
        <Button
          onClick={onAddListing}
          className="bg-spruce-700 hover:bg-spruce-800 text-white"
          title={addListingBlocked ? 'Free plan: one listing. Open to see upgrade options.' : undefined}
        >
          <ListPlus className="w-4 h-4 mr-2" /> Add listing
        </Button>
      </div>
    );
  }
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden" data-testid="dashboard-listings-table">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
        <h2 className="font-heading text-lg font-semibold text-slate-900">Listings</h2>
        <Button
          size="sm"
          onClick={onAddListing}
          className="bg-spruce-700 hover:bg-spruce-800 text-white"
          title={addListingBlocked ? 'Free plan: one listing. Open to see upgrade options.' : undefined}
        >
          <ListPlus className="w-4 h-4 mr-1" /> Add listing
        </Button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200">
            <tr>
              <th className="text-left py-3 px-4 font-medium text-slate-600">Title</th>
              <th className="text-left py-3 px-4 font-medium text-slate-600">Category</th>
              <th className="text-left py-3 px-4 font-medium text-slate-600">Price</th>
              <th className="text-left py-3 px-4 font-medium text-slate-600">Status</th>
              <th className="text-left py-3 px-4 font-medium text-slate-600">Created</th>
              <th className="text-right py-3 px-4 font-medium text-slate-600"></th>
            </tr>
          </thead>
          <tbody>
            {listings.map((listing) => (
              <tr key={listing.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50" data-testid={`listing-row-${listing.id}`}>
                <td className="py-3 px-4 font-medium text-slate-900 truncate max-w-[200px]" title={listing.title}>{listing.title || '—'}</td>
                <td className="py-3 px-4 text-slate-600">{CATEGORIES.find((c) => c.id === listing.categoryId)?.name || listing.categoryId || '—'}</td>
                <td
                  className="py-3 px-4 text-slate-700 max-w-[10rem] sm:max-w-[14rem] truncate font-medium"
                  title={listing.price != null && String(listing.price).trim() ? String(listing.price).trim() : undefined}
                >
                  {listing.price != null && String(listing.price).trim() ? String(listing.price).trim() : '—'}
                </td>
                <td className="py-3 px-4">
                  <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-medium ${
                    listing.status === 'published' ? 'bg-emerald-100 text-emerald-800' :
                    listing.status === 'draft' ? 'bg-slate-100 text-slate-600' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {listing.status === 'published' ? 'Published' : 'Draft'}
                  </span>
                </td>
                <td className="py-3 px-4 text-slate-500 text-xs">{listing.createdAt ? new Date(listing.createdAt).toLocaleDateString() : '—'}</td>
                <td className="py-3 px-4 text-right">
                  <div className="inline-flex items-center gap-2" role="group" aria-label="Row actions">
                    {onEditListing && (
                      <button
                        type="button"
                        onClick={() => onEditListing(listing)}
                        data-testid={`edit-listing-${listing.id}`}
                        className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                        title="Edit listing"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onDeleteListing(listing.id)}
                      data-testid={`delete-listing-${listing.id}`}
                      className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-red-600 text-white hover:bg-red-700 transition-colors"
                      title="Delete listing"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Resize image to max dimension and compress as JPEG data URL (listing form)
function imageFileToDataUrl(file, maxSize = 1200, quality = 0.85) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let w = img.width;
      let h = img.height;
      if (w > maxSize || h > maxSize) {
        if (w > h) {
          h = (h * maxSize) / w;
          w = maxSize;
        } else {
          w = (w * maxSize) / h;
          h = maxSize;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);
      try {
        resolve(canvas.toDataURL('image/jpeg', quality));
      } catch (e) {
        reject(e);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };
    img.src = url;
  });
}

function ListingFormSection({
  listingForm,
  patchListingForm,
  editingListingId,
  saving,
  onSave,
  onCancel,
  disabled,
  errors,
  apiErrorLines,
  vendorListingPlan,
}) {
  const [videoUploading, setVideoUploading] = useState(false);
  const [videoUploadError, setVideoUploadError] = useState('');
  const images = listingForm.images || [];
  const cap = listingPlanTierCapabilities(vendorListingPlan);
  const descWordCount = countWords(listingForm.description || '');
  const descWordsLabel =
    cap.maxDescriptionWords != null
      ? `${descWordCount} / ${FREE_LISTING_DESCRIPTION_MAX_WORDS} words`
      : null;
  const allowPublicContact = cap.allowVendorProfileContactFields;

  const handleAddImages = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    const newUrls = [];
    for (const file of files) {
      if (!file.type.startsWith('image/')) continue;
      try {
        newUrls.push(await imageFileToDataUrl(file));
      } catch {
        /* skip */
      }
    }
    if (!newUrls.length) return;
    if (cap.maxImages === 1) {
      if ((images?.length || 0) >= 1 || newUrls.length > 1) {
        toast.message('Free plan: only 1 image per listing. Upgrade to add more than one image.');
      }
      patchListingForm((prev) => ({
        ...prev,
        images: newUrls.slice(0, 1),
        coverImageIndex: 0,
      }));
      return;
    }
    patchListingForm((prev) => ({
      ...prev,
      images: [...(prev.images || []), ...newUrls],
    }));
  };

  const removeImageAt = (idx) => {
    patchListingForm((prev) => {
      const imgs = [...(prev.images || [])];
      imgs.splice(idx, 1);
      let cover = prev.coverImageIndex ?? 0;
      if (idx === cover) cover = 0;
      else if (idx < cover) cover = Math.max(0, cover - 1);
      const nextCover = imgs.length > 0 ? Math.min(cover, imgs.length - 1) : 0;
      return { ...prev, images: imgs, coverImageIndex: nextCover };
    });
  };

  const handleVideoFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('video/')) {
      setVideoUploadError('Please choose a video file.');
      return;
    }
    setVideoUploadError('');
    setVideoUploading(true);
    try {
      const res = await uploadVendorVideo(file);
      patchListingForm({ videoUrl: res.data.url });
    } catch (err) {
      const msg = err.response?.data?.message || 'Upload failed';
      setVideoUploadError(typeof msg === 'string' ? msg : 'Upload failed');
    } finally {
      setVideoUploading(false);
    }
  };

  const clearVideo = () => {
    setVideoUploadError('');
    patchListingForm({ videoUrl: '' });
  };

  return (
    <div className={`bg-white rounded-xl border border-slate-200 p-4 md:p-6 w-full ${disabled ? 'pointer-events-none opacity-60' : ''}`} data-testid="listing-form">
      <h2 className="font-heading text-lg font-semibold text-slate-900 mb-1">
        {editingListingId ? 'Edit listing' : 'Add listing'}
      </h2>
      <p className="text-xs text-slate-500 mb-4">
        Required fields are marked with *. Price is optional. Video is optional on Standard and Gold. Listing title must be unique.
        {cap.maxImages === 1
          ? ' Free plan: one image and a short description — see your plan on the right.'
          : ' Add images and choose the cover shown on the directory and listing page.'}
      </p>
      <form onSubmit={(e) => { e.preventDefault(); if (!disabled) onSave(); }} className="space-y-8">
        <AuthFormError lines={apiErrorLines} data-testid="listing-form-api-error" />

        <section className="space-y-4">
          <h3 className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-2">Listing details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
            <div className="sm:col-span-2 lg:col-span-2 space-y-3">
              <div>
                <Label htmlFor="listing-title" className="text-xs">Title *</Label>
                <Input
                  id="listing-title"
                  value={listingForm.title}
                  onChange={(e) => patchListingForm({ title: e.target.value })}
                  className="mt-1 h-9 w-full"
                  placeholder="e.g. Family Law Consultation"
                  data-testid="listing-form-title"
                />
                {errors.title && <p className="text-red-500 text-sm mt-0.5">{errors.title}</p>}
              </div>
              <div>
                <Label htmlFor="listing-business-name" className="text-xs">
                  Business name <span className="font-normal text-slate-500">(optional)</span>
                </Label>
                <Input
                  id="listing-business-name"
                  value={listingForm.businessName ?? ''}
                  onChange={(e) => patchListingForm({ businessName: e.target.value })}
                  className="mt-1 h-9 w-full"
                  placeholder="e.g. Smith & Associates"
                  autoComplete="organization"
                  data-testid="listing-form-business-name"
                />
                <p className="mt-1 text-[11px] text-slate-500 leading-snug">
                  Shown on directory cards and the listing page when set. Your listing title stays unique.
                </p>
                {errors.businessName && (
                  <p className="text-red-500 text-sm mt-0.5">{errors.businessName}</p>
                )}
              </div>
            </div>
            <div>
              <Label htmlFor="listing-price" className="text-xs">Price (optional)</Label>
              <Input
                id="listing-price"
                type="text"
                inputMode="text"
                autoComplete="off"
                value={listingForm.price ?? ''}
                onChange={(e) => patchListingForm({ price: e.target.value })}
                className="mt-1 h-9 w-full"
                placeholder="e.g. $500, From $99/hr"
                data-testid="listing-form-price"
              />
              {errors.price && <p className="text-red-500 text-sm mt-0.5">{errors.price}</p>}
            </div>
            <div>
              <Label className="text-xs">Category *</Label>
              <Select value={listingForm.categoryId} onValueChange={(v) => patchListingForm({ categoryId: v })}>
                <SelectTrigger className="mt-1 h-9" data-testid="listing-form-category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
              {errors.categoryId && <p className="text-red-500 text-sm mt-0.5">{errors.categoryId}</p>}
            </div>
            <div>
              <Label className="text-xs">City *</Label>
              <Select value={listingForm.city || ''} onValueChange={(v) => patchListingForm({ city: v })}>
                <SelectTrigger className="mt-1 h-9" data-testid="listing-form-city">
                  <SelectValue placeholder="Select city" />
                </SelectTrigger>
                <SelectContent>{CITIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
              {errors.city && <p className="text-red-500 text-sm mt-0.5">{errors.city}</p>}
            </div>
            <div>
              <Label className="text-xs">Visibility *</Label>
              <Select value={listingForm.status} onValueChange={(v) => patchListingForm({ status: v })}>
                <SelectTrigger className="mt-1 h-9" data-testid="listing-form-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                </SelectContent>
              </Select>
              {errors.status && <p className="text-red-500 text-sm mt-0.5">{errors.status}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
            <div className="min-w-0 flex flex-col gap-2">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="listing-desc" className="text-xs">Description *</Label>
                {descWordsLabel ? (
                  <span
                    className={`text-[11px] tabular-nums ${descWordCount > FREE_LISTING_DESCRIPTION_MAX_WORDS ? 'text-red-600 font-medium' : 'text-slate-500'}`}
                  >
                    {descWordsLabel}
                  </span>
                ) : null}
              </div>
              <Textarea
                id="listing-desc"
                value={listingForm.description}
                onChange={(e) => patchListingForm({ description: e.target.value })}
                rows={14}
                className="mt-0 min-h-[16rem] w-full resize-y"
                placeholder={
                  cap.maxDescriptionWords != null
                    ? `Up to ${FREE_LISTING_DESCRIPTION_MAX_WORDS} words (no phone numbers, URLs, or email addresses). At least 10 characters.`
                    : 'Describe this offering (at least 10 characters)…'
                }
                data-testid="listing-form-desc"
              />
              {cap.maxDescriptionWords != null ? (
                <p className="text-[11px] text-slate-500">
                  Free plan: do not include phone numbers, website links, or email addresses in the description.
                </p>
              ) : null}
              {errors.description && <p className="text-red-500 text-sm">{errors.description}</p>}
            </div>

            <div className="min-w-0 space-y-4 rounded-xl border border-slate-200 p-4 md:p-5">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-700 flex items-center gap-2 border-slate-200/90 pb-2">
                <MapPin className="w-4 h-4 text-spruce-600 shrink-0" aria-hidden /> Contact &amp; map
              </h4>
              <div>
                <Label htmlFor="listing-neighborhood" className="text-xs">Neighborhood</Label>
                <Input
                  id="listing-neighborhood"
                  value={listingForm.neighborhood ?? ''}
                  onChange={(e) => patchListingForm({ neighborhood: e.target.value })}
                  className="mt-1 h-9 w-full"
                  placeholder="e.g. Downtown"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="listing-phone" className="text-xs">Phone</Label>
                  <Input
                    id="listing-phone"
                    value={listingForm.phone ?? ''}
                    onChange={(e) => patchListingForm({ phone: e.target.value })}
                    className="mt-1 h-9 w-full"
                    placeholder="(403) 555-0100"
                    disabled={!allowPublicContact}
                  />
                  {!allowPublicContact ? (
                    <p className="text-[11px] text-slate-500 mt-1">Standard / Gold</p>
                  ) : null}
                </div>
                <div>
                  <Label htmlFor="listing-email" className="text-xs">Email</Label>
                  <Input
                    id="listing-email"
                    type="email"
                    value={listingForm.email ?? ''}
                    onChange={(e) => patchListingForm({ email: e.target.value })}
                    className="mt-1 h-9 w-full"
                    placeholder="contact@example.com"
                    disabled={!allowPublicContact}
                  />
                  {errors.email && <p className="text-red-500 text-sm mt-0.5">{errors.email}</p>}
                  {!allowPublicContact ? (
                    <p className="text-[11px] text-slate-500 mt-1">Standard / Gold</p>
                  ) : null}
                </div>
              </div>
              <div>
                <Label htmlFor="listing-website" className="text-xs">Website</Label>
                <Input
                  id="listing-website"
                  value={listingForm.website ?? ''}
                  onChange={(e) => patchListingForm({ website: e.target.value })}
                  className="mt-1 h-9 w-full"
                  placeholder="https://…"
                  disabled={!allowPublicContact}
                />
                {errors.website && <p className="text-red-500 text-sm mt-0.5">{errors.website}</p>}
                {!allowPublicContact ? (
                  <p className="text-[11px] text-slate-500 mt-1">Standard / Gold</p>
                ) : null}
              </div>
              <div>
                <Label htmlFor="listing-map-url" className="text-xs">Google Map URL</Label>
                <Input
                  id="listing-map-url"
                  value={listingForm.googleMapUrl ?? ''}
                  onChange={(e) => patchListingForm({ googleMapUrl: e.target.value })}
                  className="mt-1 h-9 w-full"
                  placeholder="https://maps.google.com/…"
                />
                {errors.googleMapUrl && <p className="text-red-500 text-sm mt-0.5">{errors.googleMapUrl}</p>}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="listing-lat" className="text-xs">Latitude</Label>
                  <Input
                    id="listing-lat"
                    type="number"
                    step="any"
                    value={listingForm.latitude ?? ''}
                    onChange={(e) => patchListingForm({ latitude: e.target.value })}
                    className="mt-1 h-9 w-full"
                    placeholder="53.5461"
                  />
                  {errors.latitude && <p className="text-red-500 text-sm mt-0.5">{errors.latitude}</p>}
                </div>
                <div>
                  <Label htmlFor="listing-lng" className="text-xs">Longitude</Label>
                  <Input
                    id="listing-lng"
                    type="number"
                    step="any"
                    value={listingForm.longitude ?? ''}
                    onChange={(e) => patchListingForm({ longitude: e.target.value })}
                    className="mt-1 h-9 w-full"
                    placeholder="-113.4938"
                  />
                  {errors.longitude && <p className="text-red-500 text-sm mt-0.5">{errors.longitude}</p>}
                </div>
              </div>
              <p className="text-[11px] text-slate-500">Map link or both coordinates for a precise pin on your public listing.</p>
            </div>
          </div>
        </section>

        <section className="space-y-4 rounded-xl border border-slate-200 p-4 md:p-5">
          <h3 className="text-sm font-semibold text-slate-900 pb-2">Hours of operation</h3>
          <div className="flex items-center gap-3 rounded-lg bg-white px-3 py-2">
            <input
              type="checkbox"
              id="listing-show-hours"
              className="h-4 w-4 rounded border-slate-300 text-spruce-700 focus:ring-spruce-600"
              checked={Boolean(listingForm.showOpeningHours)}
              onChange={(e) => {
                const checked = e.target.checked;
                patchListingForm({
                  showOpeningHours: checked,
                  ...(checked ? {} : { openingHours: emptyOpeningHours() }),
                });
              }}
            />
            <Label htmlFor="listing-show-hours" className="text-sm font-normal leading-snug cursor-pointer text-slate-700">
              Want to show working hours?
            </Label>
          </div>
          {listingForm.showOpeningHours ? (
            <div>
              <Label className="text-xs">Daily hours</Label>
              <p className="text-[11px] text-slate-500 mt-0.5 mb-3">
                e.g. <span className="font-mono text-slate-600">9:00 AM - 5:00 PM</span> or{' '}
                <span className="font-mono text-slate-600">Closed</span>.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-7 gap-3">
                {OPENING_DAY_ORDER.map((day) => (
                  <div key={day}>
                    <span className="text-[11px] font-medium text-slate-600 block mb-1">{OPENING_DAY_LABELS[day]}</span>
                    <Input
                      value={listingForm.openingHours?.[day] ?? ''}
                      onChange={(e) =>
                        patchListingForm((prev) => ({
                          ...prev,
                          openingHours: {
                            ...emptyOpeningHours(),
                            ...(prev.openingHours || {}),
                            [day]: e.target.value,
                          },
                        }))
                      }
                      className="h-9 w-full"
                      placeholder="9–5 or Closed"
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </section>

        <section className="space-y-3">
          <Label className="text-xs flex items-center gap-1">
            <ImageIcon className="w-3.5 h-3.5" aria-hidden /> Images * (cover for directory)
          </Label>
          <p className="text-[11px] text-slate-500 mt-0.5 mb-2">
            {cap.maxImages === 1
              ? 'Free plan: upload one photo (replaces any previous image).'
              : 'Upload one or more photos. Click the star to set the cover image.'}
          </p>
          <label className="inline-flex cursor-pointer">
            <input
              type="file"
              accept="image/*"
              multiple={cap.maxImages !== 1}
              className="sr-only"
              onChange={handleAddImages}
              disabled={disabled}
              data-testid="listing-form-images"
            />
            <span className="inline-flex items-center justify-center h-9 px-3 rounded-md border border-slate-200 bg-slate-50 text-xs font-medium text-slate-600 hover:bg-slate-100">
              Add images
            </span>
          </label>
          {errors.images && <p className="text-red-500 text-sm mt-1">{errors.images}</p>}
          {errors.coverImageIndex && <p className="text-red-500 text-sm mt-0.5">{errors.coverImageIndex}</p>}
          {images.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {images.map((src, idx) => (
                <div key={`${idx}-${src?.slice?.(0, 24) || idx}`} className="relative group">
                  <img src={src} alt="" className="h-20 w-28 rounded-lg object-cover border border-slate-200 bg-slate-100" />
                  <button
                    type="button"
                    title="Set as cover"
                    onClick={() => patchListingForm({ coverImageIndex: idx })}
                    className={`absolute top-1 left-1 w-7 h-7 rounded-full flex items-center justify-center text-xs shadow ${
                      (listingForm.coverImageIndex ?? 0) === idx
                        ? 'bg-amber-500 text-white'
                        : 'bg-white/90 text-slate-500 hover:bg-amber-100'
                    }`}
                  >
                    <Star className={`w-3.5 h-3.5 ${(listingForm.coverImageIndex ?? 0) === idx ? 'fill-current' : ''}`} />
                  </button>
                  <button
                    type="button"
                    title="Remove"
                    onClick={() => removeImageAt(idx)}
                    className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] leading-none flex items-center justify-center hover:bg-red-600"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {cap.allowListingVideo ? (
          <section className="space-y-3">
            <Label className="text-xs flex items-center gap-1">
              <Video className="w-3.5 h-3.5" aria-hidden /> Video (optional)
            </Label>
            <p className="text-[11px] text-slate-500 mt-0.5 mb-1.5">
              Paste a link (YouTube, Vimeo, TikTok, Instagram) or upload a file (max 80MB).
            </p>
            <div className="flex flex-col sm:flex-row gap-2 flex-wrap items-stretch sm:items-center">
              <label className="cursor-pointer shrink-0">
                <input
                  type="file"
                  accept="video/*"
                  className="sr-only"
                  onChange={handleVideoFile}
                  disabled={videoUploading || disabled}
                  data-testid="listing-form-video-file"
                />
                <span className="inline-flex items-center justify-center gap-1.5 h-9 px-3 rounded-md border border-slate-200 bg-slate-50 text-xs font-medium text-slate-600 hover:bg-slate-100">
                  {videoUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden /> : null}
                  {videoUploading ? 'Uploading…' : 'Upload video'}
                </span>
              </label>
              <Input
                value={listingForm.videoUrl || ''}
                onChange={(e) => {
                  setVideoUploadError('');
                  patchListingForm({ videoUrl: e.target.value });
                }}
                placeholder="Or paste a video URL…"
                className="h-9 flex-1 min-w-[12rem]"
                data-testid="listing-form-video-url"
              />
              {(listingForm.videoUrl || '').trim() ? (
                <Button type="button" variant="outline" size="sm" className="h-9 shrink-0" onClick={clearVideo}>
                  Clear video
                </Button>
              ) : null}
            </div>
            {videoUploadError && <p className="text-red-500 text-xs mt-1">{videoUploadError}</p>}
            {errors.videoUrl && <p className="text-red-500 text-sm mt-0.5">{errors.videoUrl}</p>}
            {(listingForm.videoUrl || '').trim() ? (
              <VendorVideoBlock
                url={listingForm.videoUrl}
                classNameFile="mt-2 max-h-40 w-full max-w-md rounded-lg border border-slate-200 bg-black"
              />
            ) : null}
          </section>
        ) : (listingForm.videoUrl || '').trim() ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900 space-y-2">
            <p>Your plan does not include listing video. Remove the video to save changes, or upgrade to Standard or Gold.</p>
            <Button type="button" variant="outline" size="sm" className="h-8 text-xs" onClick={clearVideo}>
              Remove video from listing
            </Button>
          </div>
        ) : null}

        <div className="flex gap-2 pt-1">
          <Button type="submit" disabled={saving || disabled || videoUploading} className="bg-spruce-700 hover:bg-spruce-800 text-white h-9" data-testid="listing-form-submit">
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            {editingListingId ? 'Update' : 'Create'} listing
          </Button>
          <Button type="button" variant="outline" size="sm" className="h-9" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}

function VendorReviews({ listings, canReplyToReviews }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');

  useEffect(() => {
    const fetchAll = async () => {
      const all = [];
      for (const l of listings || []) {
        const lid = l.id || l._id;
        if (!lid) continue;
        try {
          const res = await reviewAPI.list(lid);
          res.data.forEach((r) => all.push({ ...r, listingTitle: l.title || 'Listing' }));
        } catch { /* skip */ }
      }
      all.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setReviews(all);
      setLoading(false);
    };
    fetchAll();
  }, [listings]);

  const handleReply = async (reviewId) => {
    if (!replyText.trim()) return;
    try {
      await reviewAPI.reply(reviewId, { reply: replyText });
      toast.success('Reply posted!');
      setReplyingTo(null);
      setReplyText('');
      // refresh
      const updated = reviews.map(r => r.id === reviewId ? { ...r, reply: replyText } : r);
      setReviews(updated);
    } catch { toast.error('Failed to reply'); }
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-spruce-700" /></div>;

  return (
    <div className="space-y-4" data-testid="vendor-reviews-list">
      {reviews.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border">
          <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-lg font-medium text-slate-600">No reviews yet</p>
        </div>
      ) : (
        reviews.map(review => (
          <div key={review.id} className="bg-white rounded-xl border p-5" data-testid={`dashboard-review-${review.id}`}>
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="text-xs text-muted-foreground mb-1">For: <strong>{review.listingTitle}</strong></p>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{review.user_name}</span>
                  <StarRating rating={review.rating} size={12} />
                </div>
              </div>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" /> {new Date(review.created_at).toLocaleDateString()}
              </span>
            </div>
            <p className="text-sm text-slate-600 mt-2">{review.comment}</p>
            {review.reply && (
              <div className="mt-3 p-3 bg-spruce-50 rounded-lg">
                <p className="text-xs font-medium text-spruce-700 mb-1">Your Reply</p>
                <p className="text-sm">{review.reply}</p>
              </div>
            )}
            {!review.reply && canReplyToReviews && (
              replyingTo === review.id ? (
                <div className="flex gap-2 mt-3">
                  <Input value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="Write reply..." className="text-sm" />
                  <Button size="sm" onClick={() => handleReply(review.id)} className="bg-spruce-700 text-white">Reply</Button>
                  <Button size="sm" variant="ghost" onClick={() => setReplyingTo(null)}>Cancel</Button>
                </div>
              ) : (
                <button type="button" onClick={() => { setReplyingTo(review.id); setReplyText(''); }} className="text-xs text-spruce-700 hover:underline mt-3 flex items-center gap-1">
                  <MessageSquare className="w-3 h-3" /> Reply to this review
                </button>
              )
            )}
            {!review.reply && !canReplyToReviews ? (
              <p className="text-xs text-slate-500 mt-3">Replies are available on Standard and Gold.</p>
            ) : null}
          </div>
        ))
      )}
    </div>
  );
}