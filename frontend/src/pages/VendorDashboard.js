import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { useAuth } from '../lib/auth';
import { vendorAPI, reviewAPI, listingAPI } from '../lib/api';
import { CATEGORIES, CITIES, getTierInfo } from '../data/categories';
import { listingValidation, hasListingErrors } from '../validations/listingValidation';
import { StarRating } from '../components/StarRating';
import { toast } from 'sonner';
import {
  Pencil, Trash2, Loader2, Store, MessageSquare,
  Eye, BadgeCheck, Clock, ListPlus, Check, Star, Sparkles, Settings, Building2
} from 'lucide-react';
import { ROUTES } from '../constants';

const defaultFormData = {
  name: '', description: '', category: '', city: '',
  neighborhood: '', phone: '', email: '', website: '', images: [], tier: 'free'
};

export default function VendorDashboard() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const tabFromUrl = tabParam === 'settings' || tabParam === 'add-listing' || tabParam === 'reviews' ? tabParam : 'listings';
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingVendor, setEditingVendor] = useState(null);
  const [formData, setFormData] = useState(defaultFormData);
  const hasVendor = vendors.length > 0;
  const [saving, setSaving] = useState(false);
  const [addListingErrors, setAddListingErrors] = useState({});
  const [settingsEditMode, setSettingsEditMode] = useState(false);
  const [listings, setListings] = useState([]);
  const [listingsLoading, setListingsLoading] = useState(false);
  const [listingForm, setListingForm] = useState({ title: '', description: '', categoryId: '', status: 'draft' });
  const [editingListingId, setEditingListingId] = useState(null);
  const [listingSaving, setListingSaving] = useState(false);
  const [addListingBlockedDismissed, setAddListingBlockedDismissed] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate(ROUTES.LOGIN);
      return;
    }
    fetchVendors();
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (hasVendor) fetchListings();
    else setListings([]);
  }, [hasVendor]);

  // When user has no vendor, keep URL on settings so refresh stays on Settings
  useEffect(() => {
    if (!loading && vendors.length === 0 && searchParams.get('tab') !== 'settings') {
      setSearchParams({ tab: 'settings' });
    }
  }, [loading, vendors.length, searchParams]);

  // Derived values used by add-listing blocked message (must be before any early return so hook count is stable)
  const effectiveTab = !hasVendor ? 'settings' : tabFromUrl;
  const isVendorApproved = hasVendor && vendors[0]?.status === 'approved';
  const isAddListingBlocked = effectiveTab === 'add-listing' && hasVendor && !isVendorApproved;

  // Re-show "company not approved" message when entering Add Listing while blocked
  useEffect(() => {
    if (isAddListingBlocked) setAddListingBlockedDismissed(false);
  }, [effectiveTab, hasVendor, vendors[0]?.status]);

  const fetchVendors = async () => {
    try {
      const res = await vendorAPI.myVendors();
      setVendors(res.data);
    } catch { } finally { setLoading(false); }
  };

  const fetchListings = async () => {
    setListingsLoading(true);
    try {
      const res = await listingAPI.myListings();
      setListings(res.data || []);
    } catch { setListings([]); } finally { setListingsLoading(false); }
  };

  const resetForm = () => {
    setFormData(defaultFormData);
    setEditingVendor(null);
    setAddListingErrors({});
  };

  const handleEdit = (vendor) => {
    setFormData({
      name: vendor.name, description: vendor.description, category: vendor.category,
      city: vendor.city, neighborhood: vendor.neighborhood || '', phone: vendor.phone || '',
      email: vendor.email || '', website: vendor.website || '',
      images: vendor.images || [], tier: vendor.tier
    });
    setEditingVendor(vendor.id);
    setSearchParams({ tab: 'add-listing' });
  };

  const validateAndSave = async (isEdit) => {
    const trimmed = {
      ...formData,
      name: (formData.name || '').trim(),
      description: (formData.description || '').trim(),
      category: (formData.category || '').trim(),
      city: (formData.city || '').trim(),
      neighborhood: (formData.neighborhood || '').trim(),
      phone: (formData.phone || '').trim(),
      email: (formData.email || '').trim(),
      website: (formData.website || '').trim(),
    };
    const errors = listingValidation(trimmed);
    setAddListingErrors(errors);
    if (hasListingErrors(errors)) {
      const firstError = Object.values(errors).find(Boolean);
      toast.error(firstError || 'Please fix the errors below');
      return;
    }
    setSaving(true);
    try {
      if (isEdit) {
        await vendorAPI.update(editingVendor, trimmed);
        toast.success('Listing updated!');
        setSettingsEditMode(false);
        setSearchParams({});
      } else {
        await vendorAPI.create(trimmed);
        toast.success('You applied for a business registration! You will be notified when your business is approved.');
        setFormData(defaultFormData);
        setAddListingErrors({});
        setSearchParams({});
        fetchVendors();
      }
      resetForm();
      fetchVendors();
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.detail || 'Failed to save';
      if (typeof msg === 'string' && msg.toLowerCase().includes('already exists')) {
        setAddListingErrors((e) => ({ ...e, name: 'The business name already exists, please rename it.' }));
        toast.error(msg);
      } else {
        toast.error(msg);
      }
    } finally { setSaving(false); }
  };

  const handleSave = async () => validateAndSave(!!editingVendor);

  const handleDeleteVendor = async (id) => {
    if (!window.confirm('Delete this business?')) return;
    try {
      await vendorAPI.delete(id);
      toast.success('Business deleted');
      fetchVendors();
    } catch { toast.error('Failed to delete'); }
  };

  const handleDeleteListing = async (id) => {
    if (!window.confirm('Delete this listing?')) return;
    try {
      await listingAPI.delete(id);
      toast.success('Listing deleted');
      fetchListings();
    } catch { toast.error('Failed to delete'); }
  };

  const handleSaveListing = async () => {
    if (!isVendorApproved) {
      setAddListingBlockedDismissed(false);
      return;
    }
    const { title, description, categoryId, status } = listingForm;
    if (!title?.trim()) { toast.error('Title is required'); return; }
    if (!(description ?? '').trim()) { toast.error('Description is required'); return; }
    if (!(categoryId ?? '').trim()) { toast.error('Category is required'); return; }
    if (!vendors[0]) return;
    setListingSaving(true);
    try {
      if (editingListingId) {
        await listingAPI.update(editingListingId, { title: title.trim(), description: (description || '').trim(), categoryId: categoryId || '', status: status || 'draft' });
        toast.success('Listing updated');
        setEditingListingId(null);
        setListingForm({ title: '', description: '', categoryId: '', status: 'draft' });
        setSearchParams({});
      } else {
        await listingAPI.create({ vendorId: vendors[0].id, title: title.trim(), description: (description || '').trim(), categoryId: categoryId || '', status: status || 'draft' });
        toast.success('Listing created');
        setListingForm({ title: '', description: '', categoryId: '', status: 'draft' });
        setSearchParams({});
      }
      fetchListings();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save listing');
    } finally { setListingSaving(false); }
  };

  const statusColor = { pending: 'bg-yellow-100 text-yellow-700', approved: 'bg-green-100 text-green-700', rejected: 'bg-red-100 text-red-700' };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-spruce-700" /></div>;

  const navItems = [
    { id: 'settings', label: 'Settings', icon: Settings, testId: 'tab-settings' },
    { id: 'listings', label: 'My Listings', icon: Store, testId: 'tab-listings' },
    { id: 'add-listing', label: 'Add Listing', icon: ListPlus, testId: 'tab-add-listing' },
    { id: 'reviews', label: 'Reviews', icon: MessageSquare, testId: 'tab-reviews' },
  ];

  const isNavDisabled = (itemId) => !hasVendor && itemId !== 'settings';

  const setTab = (id) => {
    if (isNavDisabled(id)) return;
    setSearchParams(id === 'listings' ? {} : { tab: id });
  };

  const isNavActive = (itemId) =>
    (itemId === 'listings' && effectiveTab === 'listings') || (itemId !== 'listings' && effectiveTab === itemId);

  return (
    <div className="min-h-screen flex flex-col lg:flex-row" data-testid="vendor-dashboard">
      {/* Left sidebar — vertical on lg+, horizontal bar on smaller */}
      <aside className="lg:w-56 flex-shrink-0 bg-white border-b lg:border-b-0 border-slate-200 lg:min-h-screen lg:sticky lg:top-0">
        <div className="flex flex-col lg:block">
          <nav className="p-2 flex flex-row lg:flex-col flex-wrap gap-1 lg:gap-0">
            {navItems.map((item) => {
              const disabled = isNavDisabled(item.id);
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTab(item.id)}
                  disabled={disabled}
                  title={disabled ? 'You are not allowed to use these options until your business is registered and approved.' : undefined}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors lg:w-full ${disabled ? 'opacity-50 cursor-not-allowed text-slate-400' : isNavActive(item.id) ? 'bg-spruce-700 text-white hover:bg-spruce-700' : 'text-slate-600 hover:bg-slate-100'
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

      {/* Main content — left half = tab content, right half = Listings overview */}
      <main className="flex-1 min-w-0 min-h-0 flex flex-col py-6 px-4 md:px-6">
        <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-4 lg:gap-0 w-full">
          <div className="flex-1 min-w-0 flex flex-col">
          {effectiveTab === 'settings' && (
            <SettingsView
              hasVendor={hasVendor}
              vendors={vendors}
              settingsEditMode={settingsEditMode}
              formData={formData}
              setFormData={setFormData}
              errors={addListingErrors}
              saving={saving}
              onSave={() => validateAndSave(false)}
              onSaveEdit={() => validateAndSave(true)}
              resetForm={resetForm}
              onStartEdit={() => {
                if (vendors[0]) {
                  const v = vendors[0];
                  setFormData({
                    name: v.name, description: v.description || '', category: v.category || '',
                    city: v.city || '', neighborhood: v.neighborhood || '', phone: v.phone || '',
                    email: v.email || '', website: v.website || '',
                    images: v.images || [], tier: v.tier || 'free'
                  });
                  setEditingVendor(v.id);
                  setSettingsEditMode(true);
                }
              }}
              onCancelEdit={() => {
                resetForm();
                setSettingsEditMode(false);
              }}
            />
          )}
          {effectiveTab === 'add-listing' && hasVendor && (
            <div className="space-y-4">
              {isAddListingBlocked && (
                <div
                  className={`rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 transition-all duration-300 ease-out ${
                    addListingBlockedDismissed ? 'opacity-0 max-h-0 overflow-hidden py-0 px-4' : 'opacity-100 max-h-40'
                  }`}
                  role="alert"
                  data-testid="add-listing-blocked-message"
                >
                  You can add listings only after your company is approved. Please wait for approval or check Settings for status.
                </div>
              )}
              <ListingFormSection
                listingForm={listingForm}
                setListingForm={setListingForm}
                editingListingId={editingListingId}
                saving={listingSaving}
                onSave={handleSaveListing}
                onCancel={() => { setEditingListingId(null); setListingForm({ title: '', description: '', categoryId: '', status: 'draft' }); setSearchParams({}); }}
                disabled={!isVendorApproved}
              />
            </div>
          )}
          {effectiveTab === 'add-listing' && !hasVendor && (
            <div className="bg-white rounded-xl border p-8 text-center text-slate-600">Register your company in Settings first.</div>
          )}
          {effectiveTab === 'listings' && (
            <ListingsTableView
              vendors={vendors}
              listings={listings}
              loading={listingsLoading}
              onAddListing={() => { setEditingListingId(null); setListingForm({ title: '', description: '', categoryId: '', status: 'draft' }); setSearchParams({ tab: 'add-listing' }); }}
              onEditListing={(listing) => {
                setListingForm({ title: listing.title || '', description: listing.description || '', categoryId: listing.categoryId || '', status: listing.status || 'draft' });
                setEditingListingId(listing.id);
                setSearchParams({ tab: 'add-listing' });
              }}
              onDeleteListing={handleDeleteListing}
            />
          )}
          {effectiveTab === 'reviews' && <VendorReviews vendors={vendors} />}
          </div>

          {/* Right half of main: Listings overview (below tab content on small screens) */}
          {hasVendor && (
            <div className="lg:w-72 flex-shrink-0 flex flex-col gap-4 order-last lg:order-none border-slate-200 lg:pl-6">
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <h3 className="font-heading font-semibold text-slate-900 mb-3 text-sm">Listings overview</h3>
                {listings.length === 0 ? (
                  <p className="text-xs text-slate-500">No listings yet. Add one from My Listings.</p>
                ) : (
                  <>
                    <div className="overflow-x-auto -mx-1">
                      <table className="w-full text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-slate-200">
                            <th className="text-left py-2 px-1 font-medium text-slate-600">Title</th>
                            <th className="text-left py-2 px-1 font-medium text-slate-600">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {listings.slice(0, 8).map((listing) => (
                            <tr key={listing.id} className="border-b border-slate-100 last:border-0">
                              <td className="py-2 px-1 truncate max-w-[120px]" title={listing.title}>{listing.title || '—'}</td>
                              <td className="py-2 px-1">
                                <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                  listing.status === 'published' ? 'bg-emerald-100 text-emerald-800' :
                                  listing.status === 'draft' ? 'bg-slate-100 text-slate-600' : 'bg-amber-100 text-amber-800'
                                }`}>
                                  {listing.status || 'draft'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {listings.length > 8 && <p className="text-[10px] text-slate-500 mt-2">+{listings.length - 8} more</p>}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Right sidebar: Tips + Upgrade only */}
      <aside className="hidden lg:block w-72 flex-shrink-0 border-l border-slate-200 bg-white/50 p-6 space-y-6">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h3 className="font-heading font-semibold text-slate-900 mb-3">Tips for a Better Listing</h3>
          <ul className="space-y-2 text-sm text-slate-600">
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
              <span>Use clear business name</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
              <span>Write at least 50–100 words</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
              <span>Add images to increase trust</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
              <span>Add website & phone</span>
            </li>
          </ul>
          <p className="mt-4 text-sm font-medium text-spruce-700 bg-spruce-50 rounded-lg px-3 py-2">
            Listings with images get <strong>3x more views</strong>.
          </p>
        </div>
        <div className="bg-gradient-to-br from-amber-50 to-secondary-50 rounded-xl border border-amber-200/60 p-5 shadow-sm">
          <h3 className="font-heading font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-600" />
            Upgrade to Gold
          </h3>
          <ul className="space-y-2 text-sm text-slate-700 mb-4">
            <li className="flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-500 flex-shrink-0" />
              <span>Verified badge</span>
            </li>
            <li className="flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-500 flex-shrink-0" />
              <span>Priority listing</span>
            </li>
            <li className="flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-500 flex-shrink-0" />
              <span>Featured in search</span>
            </li>
          </ul>
          <Button className="w-full bg-amber-500 hover:bg-amber-600 text-white text-sm">
            Upgrade to Gold
          </Button>
        </div>
      </aside>

    </div>
  );
}

function ListingsTableView({
  vendors,
  listings,
  loading,
  onAddListing,
  onEditListing,
  onDeleteListing,
}) {
  if (vendors.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-xl border">
        <Store className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <p className="text-lg font-medium text-slate-600 mb-2">Register your company first</p>
        <p className="text-sm text-muted-foreground">Go to Settings to register your business, then you can add listings here.</p>
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
        <Button onClick={onAddListing} className="bg-spruce-700 hover:bg-spruce-800 text-white">
          <ListPlus className="w-4 h-4 mr-2" /> Add listing
        </Button>
      </div>
    );
  }
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden" data-testid="dashboard-listings-table">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
        <h2 className="font-heading text-lg font-semibold text-slate-900">Listings</h2>
        <Button size="sm" onClick={onAddListing} className="bg-spruce-700 hover:bg-spruce-800 text-white">
          <ListPlus className="w-4 h-4 mr-1" /> Add listing
        </Button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200">
            <tr>
              <th className="text-left py-3 px-4 font-medium text-slate-600">Title</th>
              <th className="text-left py-3 px-4 font-medium text-slate-600">Category</th>
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
                <td className="py-3 px-4">
                  <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-medium ${
                    listing.status === 'published' ? 'bg-emerald-100 text-emerald-800' :
                    listing.status === 'draft' ? 'bg-slate-100 text-slate-600' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {listing.status || 'draft'}
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

function ListingFormSection({ listingForm, setListingForm, editingListingId, saving, onSave, onCancel, disabled }) {
  return (
    <div className={`bg-white rounded-xl border border-slate-200 p-4 md:p-6 w-full ${disabled ? 'pointer-events-none opacity-60' : ''}`} data-testid="listing-form">
      <h2 className="font-heading text-lg font-semibold text-slate-900 mb-1">
        {editingListingId ? 'Edit listing' : 'Add listing'}
      </h2>
      <p className="text-xs text-slate-500 mb-4">Create a listing under your business. Title, description, and category are required.</p>
      <form onSubmit={(e) => { e.preventDefault(); if (!disabled) onSave(); }} className="space-y-3">
        <div>
          <Label htmlFor="listing-title" className="text-xs">Title *</Label>
          <Input
            id="listing-title"
            value={listingForm.title}
            onChange={(e) => setListingForm({ ...listingForm, title: e.target.value })}
            className="mt-1 h-9"
            placeholder="e.g. Family Law Consultation"
          />
        </div>
        <div>
          <Label htmlFor="listing-desc" className="text-xs">Description *</Label>
          <Textarea
            id="listing-desc"
            value={listingForm.description}
            onChange={(e) => setListingForm({ ...listingForm, description: e.target.value })}
            rows={3}
            className="mt-1"
            placeholder="Describe this offering..."
          />
        </div>
        <div>
          <Label className="text-xs">Category *</Label>
          <Select value={listingForm.categoryId} onValueChange={(v) => setListingForm({ ...listingForm, categoryId: v })}>
            <SelectTrigger className="mt-1 h-9"><SelectValue placeholder="Select category" /></SelectTrigger>
            <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Status</Label>
          <Select value={listingForm.status} onValueChange={(v) => setListingForm({ ...listingForm, status: v })}>
            <SelectTrigger className="mt-1 h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="published">Published</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2 pt-1">
          <Button type="submit" disabled={saving || disabled} className="bg-spruce-700 hover:bg-spruce-800 text-white h-9">
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            {editingListingId ? 'Update' : 'Create'} listing
          </Button>
          <Button type="button" variant="outline" size="sm" className="h-9" onClick={onCancel}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}

function SettingsView({
  hasVendor, vendors, settingsEditMode, formData, setFormData, errors, saving,
  onSave, onSaveEdit, resetForm, onStartEdit, onCancelEdit
}) {
  if (hasVendor && !settingsEditMode && vendors[0]) {
    const v = vendors[0];
    const statusClass = v.status === 'approved' ? 'bg-emerald-100 text-emerald-800' : v.status === 'pending' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800';
    const statusLabel = v.status === 'approved' ? 'Approved' : v.status === 'pending' ? 'Pending' : 'Rejected';
    const categoryName = CATEGORIES.find((c) => c.id === v.category)?.name || v.category;
    return (
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden w-full" data-testid="settings-registered">
        <div className="border-b border-slate-200 px-6 py-4 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-slate-200 overflow-hidden flex-shrink-0">
              <img 
                src={v.images?.[0] || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=200'} 
                alt="" className="w-full h-full object-cover" 
              />
            </div>
            <div>
              <h2 className="font-heading text-lg font-semibold text-slate-900">{v.name}</h2>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${statusClass}`}>
                {statusLabel}
              </span>
            </div>
          </div>  
          <Button 
            onClick={onStartEdit} 
            variant="outline" 
            size="sm" 
            className="gap-2 text-slate-700 hover:text-slate-900" 
            data-testid="settings-edit-btn"
          >
            <Pencil className="w-4 h-4" /> Edit
          </Button>
        </div>
        <dl className="px-6 py-5 space-y-4">
          <div>
            <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Description</dt>
            <dd className="text-sm text-slate-700 whitespace-pre-wrap">{v.description || '—'}</dd>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Category</dt>
              <dd className="text-sm text-slate-700">{categoryName || '—'}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">City</dt>
              <dd className="text-sm text-slate-700">{v.city || '—'}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Neighborhood</dt>
              <dd className="text-sm text-slate-700">{v.neighborhood || '—'}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Phone</dt>
              <dd className="text-sm text-slate-700">{v.phone || '—'}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Email</dt>
              <dd className="text-sm text-slate-700">{v.email || '—'}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Website</dt>
              <dd className="text-sm text-slate-700">
                {v.website ? <a href={v.website.startsWith('http') ? v.website : `https://${v.website}`} target="_blank" rel="noopener noreferrer" className="text-spruce-600 hover:underline">{v.website}</a> : '—'}
              </dd>
            </div>
          </div>
        </dl>
      </div>
    );
  }

  if (hasVendor && settingsEditMode) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-4 md:p-6 w-full" data-testid="settings-edit-form">
        <h2 className="font-heading text-lg font-semibold text-slate-900 mb-4">Edit company details</h2>
        <AddListingForm
          formData={formData}
          setFormData={setFormData}
          errors={errors}
          saving={saving}
          onSave={onSaveEdit}
          onCancel={onCancelEdit}
          isEdit={true}
          title="Edit company details"
          submitLabel="Update"
        />
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0 flex flex-col" data-testid="settings-register-company">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex-1 min-h-0 flex flex-col">
        <div className="bg-spruce-700 px-6 py-5 md:py-6 text-white flex-shrink-0">
          <h1 className="font-heading text-xl md:text-2xl font-bold mb-1">Register your company</h1>
          <p className="text-white/90 text-sm">You don't have a business listing yet. Register your company to appear in the directory.</p>
        </div>
        <div className="p-4 md:p-6 flex-1 min-h-0 overflow-auto">
          <p className="text-sm text-slate-600 mb-4">Fill in your business details below. Once submitted, your business will be reviewed and then published.</p>
          <AddListingForm
            formData={formData}
            setFormData={setFormData}
            errors={errors}
            saving={saving}
            onSave={onSave}
            onCancel={null}
            isEdit={false}
            title="Company details"
            submitLabel="Register company"
          />
        </div>
      </div>
    </div>
  );
}

// Resize image to max dimension and compress as JPEG data URL
function imageFileToDataUrl(file, maxSize = 1200, quality = 0.85) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let w = img.width, h = img.height;
      if (w > maxSize || h > maxSize) {
        if (w > h) { h = (h * maxSize) / w; w = maxSize; }
        else { w = (w * maxSize) / h; h = maxSize; }
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
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Failed to load image')); };
    img.src = url;
  });
}

function AddListingForm({ formData, setFormData, errors, saving, onSave, onCancel, isEdit, title, submitLabel }) {
  const formTitle = title || (isEdit ? 'Edit listing' : 'Create a new listing');
  const formSubtitle = 'Fields marked with * are required.';
  const submitText = submitLabel || (isEdit ? 'Update listing' : 'Create listing');
  const imageUrl = formData.images?.[0] || '';

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file (JPEG, PNG, etc.)');
      return;
    }
    try {
      const dataUrl = await imageFileToDataUrl(file);
      setFormData({ ...formData, images: [dataUrl] });
    } catch {
      toast.error('Failed to process image');
    }
    e.target.value = '';
  };

  const clearImage = () => setFormData({ ...formData, images: [] });

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 md:p-6 w-full" data-testid="add-listing-form">
      <form
        onSubmit={(e) => { e.preventDefault(); onSave(); }}
        className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <Label htmlFor="add-name" className="text-xs">Business Name *</Label>
            <div>
              <Input
                id="add-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1 h-9"
                placeholder="Your business or service name"
                data-testid="add-listing-name"
              />
              {errors.name && <p className="text-red-500 text-xs mt-0.5">{errors.name}</p>}
            </div>
          </div>
          <div>
            <Label className="text-xs">Category *</Label>
            <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
              <SelectTrigger className="mt-1 h-9" data-testid="add-listing-category"><SelectValue placeholder="Category" /></SelectTrigger>
              <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
            {errors.category && <p className="text-red-500 text-xs mt-0.5">{errors.category}</p>}
          </div>
          <div>
            <Label className="text-xs">City *</Label>
            <Select value={formData.city} onValueChange={(v) => setFormData({ ...formData, city: v })}>
              <SelectTrigger className="mt-1 h-9" data-testid="add-listing-city"><SelectValue placeholder="City" /></SelectTrigger>
              <SelectContent>{CITIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
            {errors.city && <p className="text-red-500 text-xs mt-0.5">{errors.city}</p>}
          </div>
        </div>
        <div>
          <Label htmlFor="add-desc" className="text-xs">Description *</Label>
          <Textarea
            id="add-desc"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={4}
            className="mt-1 min-h-[4rem] resize-y"
            placeholder="Describe your business (at least 30 characters)"
            data-testid="add-listing-desc"
          />
          {errors.description && <p className="text-red-500 text-xs mt-0.5">{errors.description}</p>}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <Label htmlFor="add-neighborhood" className="text-xs">Neighborhood (optional)</Label>
            <Input
              id="add-neighborhood"
              value={formData.neighborhood}
              onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
              className="mt-1 h-9"
              placeholder="e.g. Downtown, Beltline"
            />
          </div>
          <div>
            <Label htmlFor="add-phone" className="text-xs">Phone (optional)</Label>
            <Input
              id="add-phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="mt-1 h-9"
              placeholder="(403) 555-0100"
            />
          </div>
          <div>
            <Label htmlFor="add-email" className="text-xs">Email (optional)</Label>
            <Input
              id="add-email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="mt-1 h-9"
              placeholder="contact@example.com"
              data-testid="add-listing-email"
            />
            {errors.email && <p className="text-red-500 text-xs mt-0.5">{errors.email}</p>}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <Label htmlFor="add-website" className="text-xs">Website (optional)</Label>
            <Input
              id="add-website"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              className="mt-1 h-9"
              placeholder="https://..."
              data-testid="add-listing-website"
            />
            {errors.website && <p className="text-red-500 text-xs mt-0.5">{errors.website}</p>}
          </div>
          <div>
            <Label className="text-xs">Image (optional)</Label>
            <div className="mt-1 flex items-center gap-2">
              <label className="flex-1 cursor-pointer">
                <input type="file" accept="image/*" className="sr-only" onChange={handleImageChange} />
                <span className="inline-flex items-center justify-center h-9 px-3 rounded-md border border-slate-200 bg-slate-50 text-xs font-medium text-slate-600 hover:bg-slate-100 w-full">
                  {imageUrl ? 'Change image' : 'Upload image'}
                </span>
              </label>
              {imageUrl && (
                <div className="relative flex-shrink-0">
                  <img src={imageUrl} alt="" className="w-12 h-12 rounded object-cover border border-slate-200" />
                  <button type="button" onClick={clearImage} className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] leading-none flex items-center justify-center hover:bg-red-600">×</button>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2 pt-1">
          <Button type="submit" disabled={saving} className="bg-spruce-700 hover:bg-spruce-800 text-white h-9" data-testid="add-listing-submit">
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            {saving ? (isEdit ? 'Updating…' : 'Creating…') : submitText}
          </Button>
          {onCancel && (
            <Button type="button" variant="outline" size="sm" className="h-9" onClick={onCancel}>Cancel</Button>
          )}
        </div>
      </form>
    </div>
  );
}

function VendorReviews({ vendors }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');

  useEffect(() => {
    const fetchAll = async () => {
      const all = [];
      for (const v of vendors) {
        try {
          const res = await reviewAPI.list(v.id);
          res.data.forEach(r => all.push({ ...r, vendorName: v.name }));
        } catch { }
      }
      all.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setReviews(all);
      setLoading(false);
    };
    fetchAll();
  }, [vendors]);

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
                <p className="text-xs text-muted-foreground mb-1">For: <strong>{review.vendorName}</strong></p>
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
            {!review.reply && (
              replyingTo === review.id ? (
                <div className="flex gap-2 mt-3">
                  <Input value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="Write reply..." className="text-sm" />
                  <Button size="sm" onClick={() => handleReply(review.id)} className="bg-spruce-700 text-white">Reply</Button>
                  <Button size="sm" variant="ghost" onClick={() => setReplyingTo(null)}>Cancel</Button>
                </div>
              ) : (
                <button onClick={() => { setReplyingTo(review.id); setReplyText(''); }} className="text-xs text-spruce-700 hover:underline mt-3 flex items-center gap-1">
                  <MessageSquare className="w-3 h-3" /> Reply to this review
                </button>
              )
            )}
          </div>
        ))
      )}
    </div>
  );
}