import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  Loader2,
  Pencil,
  Star,
  Trash2,
  XCircle,
  MapPin,
  Phone,
  Mail,
  Globe,
  LayoutList,
  MessageSquare,
} from 'lucide-react';
import { useAuth } from '../../lib/auth';
import { adminAPI } from '../../lib/api';
import { CATEGORIES, CITIES, TIERS, getTierInfo } from '../../data/categories';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import ConfirmActionModal from '../../components/ConfirmActionModal';
import { toast } from 'sonner';
import { ROUTES, adminVendorPath, vendorPath } from '../../constants';
import { getStatusPresentation } from './vendorStatus';

const PLACEHOLDER_IMG =
  'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80';

function vendorIdOf(v) {
  return v?.id || v?._id;
}

export default function AdminVendorDetailPage() {
  const { vendorId } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteNotifyEmail, setDeleteNotifyEmail] = useState(false);

  const backToVendors = () => navigate(`${ROUTES.ADMIN}?section=vendors`);

  const fetchVendor = useCallback(async () => {
    if (!vendorId) return;
    setLoading(true);
    setLoadError(null);
    try {
      const res = await adminAPI.getVendor(vendorId);
      setVendor(res.data);
      setEditForm({
        name: res.data.name || '',
        description: res.data.description || '',
        category: res.data.category || '',
        city: res.data.city || '',
        neighborhood: res.data.neighborhood || '',
        phone: res.data.phone || '',
        email: res.data.email || '',
        website: res.data.website || '',
        tier: res.data.tier || 'free',
        videoUrl: res.data.videoUrl || '',
        verified: !!res.data.verified,
      });
    } catch (e) {
      setLoadError(e.response?.data?.message || 'Could not load vendor.');
      setVendor(null);
    } finally {
      setLoading(false);
    }
  }, [vendorId]);

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== 'admin') {
      navigate(ROUTES.LOGIN);
      return;
    }
    fetchVendor();
  }, [user, authLoading, navigate, fetchVendor]);

  const getCategoryName = (id) => CATEGORIES.find((c) => c.id === id)?.name;

  const handleApprove = async () => {
    if (!vendor) return;
    setActionLoading(true);
    try {
      await adminAPI.approveVendor(vendorIdOf(vendor));
      toast.success('Vendor approved');
      await fetchVendor();
    } catch {
      toast.error('Failed to approve');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!vendor) return;
    setActionLoading(true);
    try {
      await adminAPI.rejectVendor(vendorIdOf(vendor));
      toast.success('Vendor rejected');
      await fetchVendor();
    } catch {
      toast.error('Failed to reject');
    } finally {
      setActionLoading(false);
    }
  };

  const handleFeature = async (featured) => {
    if (!vendor) return;
    setActionLoading(true);
    try {
      await adminAPI.featureVendor(vendorIdOf(vendor), featured);
      toast.success(featured ? 'Vendor featured' : 'Vendor unfeatured');
      await fetchVendor();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editForm || !vendor) return;
    setSavingEdit(true);
    try {
      const payload = {
        name: editForm.name.trim(),
        description: editForm.description.trim(),
        category: editForm.category,
        city: editForm.city.trim(),
        neighborhood: editForm.neighborhood.trim(),
        phone: editForm.phone.trim(),
        email: editForm.email.trim(),
        website: editForm.website.trim(),
        tier: editForm.tier,
        videoUrl: editForm.videoUrl.trim(),
        verified: editForm.verified,
      };
      await adminAPI.updateVendor(vendorIdOf(vendor), payload);
      toast.success('Vendor updated');
      setEditOpen(false);
      await fetchVendor();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to save';
      toast.error(msg);
    } finally {
      setSavingEdit(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!vendor) return;
    setActionLoading(true);
    try {
      await adminAPI.deleteVendor(vendorIdOf(vendor), { notifyEmail: deleteNotifyEmail });
      toast.success('Vendor deleted');
      setDeleteOpen(false);
      backToVendors();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    } finally {
      setActionLoading(false);
    }
  };

  if (authLoading || (loading && !vendor)) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center" data-testid="admin-vendor-detail-loading">
        <Loader2 className="w-10 h-10 animate-spin text-admin-600" />
      </div>
    );
  }

  if (loadError || !vendor) {
    return (
      <div className="max-w-lg mx-auto py-16 px-4 text-center">
        <p className="text-slate-700 mb-4">{loadError || 'Vendor not found.'}</p>
        <Button onClick={backToVendors} variant="outline" className="gap-2">
          <ArrowLeft className="w-4 h-4" /> Back to vendors
        </Button>
      </div>
    );
  }

  const status = getStatusPresentation(vendor.status);
  const tierInfo = getTierInfo(vendor.tier);
  const img = vendor.images?.[0] || PLACEHOLDER_IMG;
  const vid = vendorIdOf(vendor);

  return (
    <div className="bg-admin-50 min-h-screen pb-16" data-testid="admin-vendor-detail">
      <div className="max-w-4xl mx-auto px-4 py-6 md:py-10">
        <button
          type="button"
          onClick={backToVendors}
          className="inline-flex items-center gap-2 text-sm font-medium text-admin-800 hover:text-admin-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to vendors
        </button>

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="relative h-48 md:h-64 bg-slate-200">
            <img src={img} alt="" className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h1 className="font-heading text-2xl md:text-3xl font-bold text-white drop-shadow-sm">
                  {vendor.name}
                </h1>
                <div className="flex flex-wrap gap-2 mt-2">
                  <Badge className={status.className}>{status.label}</Badge>
                  <Badge variant="secondary" className={tierInfo.color}>
                    {tierInfo.name}
                  </Badge>
                  {vendor.featured && (
                    <Badge className="bg-amber-500 text-white border-0 gap-1">
                      <Star className="w-3.5 h-3.5 fill-white" /> Featured
                    </Badge>
                  )}
                  {vendor.verified && (
                    <Badge className="bg-admin-600 text-white border-0">Verified</Badge>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="p-5 md:p-8 space-y-8">
            <section className="rounded-xl border border-slate-100 bg-slate-50/80 p-4 md:p-5">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-3">
                Quick actions
              </h2>
              <p className="text-sm text-slate-600 mb-4">
                Approve or reject new listings, feature on the homepage, edit details, or remove the vendor and all
                related data.
              </p>
              <div className="flex flex-wrap gap-2">
                {vendor.status === 'pending' && (
                  <>
                    <Button
                      type="button"
                      className="bg-spruce hover:bg-spruce-800 text-white gap-1.5 shadow-sm"
                      disabled={actionLoading}
                      onClick={handleApprove}
                      data-testid="detail-approve"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Approve
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="border-2 border-rose-900 text-rose-950 hover:bg-rose-50 gap-1.5"
                      disabled={actionLoading}
                      onClick={handleReject}
                      data-testid="detail-reject"
                    >
                      <XCircle className="w-4 h-4" /> Reject
                    </Button>
                  </>
                )}
                <Button
                  type="button"
                  variant={vendor.featured ? 'outline' : 'default'}
                  className={
                    vendor.featured
                      ? 'border-amber-300 text-amber-800'
                      : 'bg-amber-500 hover:bg-amber-600 text-white'
                  }
                  disabled={actionLoading || vendor.status !== 'approved'}
                  title={vendor.status !== 'approved' ? 'Approve vendor first to feature' : undefined}
                  onClick={() => handleFeature(!vendor.featured)}
                  data-testid="detail-feature"
                >
                  <Star className={`w-4 h-4 mr-1 ${vendor.featured ? 'fill-amber-600' : ''}`} />
                  {vendor.featured ? 'Unfeature' : 'Feature'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="gap-1.5"
                  onClick={() => setEditOpen((o) => !o)}
                  data-testid="detail-edit-toggle"
                >
                  <Pencil className="w-4 h-4" /> {editOpen ? 'Close editor' : 'Edit details'}
                </Button>
                <Link
                  to={vendorPath(vid)}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid="detail-public"
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium border border-slate-200 bg-white hover:bg-slate-50 h-10 px-4 py-2 gap-1.5"
                >
                  <ExternalLink className="w-4 h-4" /> View public page
                </Link>
                <Button
                  type="button"
                  variant="outline"
                  className="border-2 border-adminDanger-500 bg-red-50 text-adminDanger-900 hover:bg-adminDanger-100 gap-1.5"
                  disabled={actionLoading}
                  onClick={() => setDeleteOpen(true)}
                  data-testid="detail-delete"
                >
                  <Trash2 className="w-4 h-4" /> Delete vendor
                </Button>
              </div>
            </section>

            {editOpen && editForm && (
              <section className="rounded-xl border border-admin-200 bg-white p-4 md:p-6 space-y-4">
                <h2 className="font-heading text-lg font-semibold text-slate-900">Edit vendor</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label htmlFor="ev-name">Business name</Label>
                    <Input
                      id="ev-name"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="ev-desc">Description</Label>
                    <Textarea
                      id="ev-desc"
                      rows={4}
                      value={editForm.description}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Category</Label>
                    <Select value={editForm.category} onValueChange={(v) => setEditForm({ ...editForm, category: v })}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Category" />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>City</Label>
                    <Select value={editForm.city} onValueChange={(v) => setEditForm({ ...editForm, city: v })}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="City" />
                      </SelectTrigger>
                      <SelectContent>
                        {CITIES.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="ev-neigh">Neighborhood</Label>
                    <Input
                      id="ev-neigh"
                      value={editForm.neighborhood}
                      onChange={(e) => setEditForm({ ...editForm, neighborhood: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Tier</Label>
                    <Select value={editForm.tier} onValueChange={(v) => setEditForm({ ...editForm, tier: v })}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TIERS.map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="ev-phone">Phone</Label>
                    <Input
                      id="ev-phone"
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="ev-email">Email</Label>
                    <Input
                      id="ev-email"
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="ev-web">Website</Label>
                    <Input
                      id="ev-web"
                      value={editForm.website}
                      onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="ev-video">Video URL</Label>
                    <Input
                      id="ev-video"
                      value={editForm.videoUrl}
                      onChange={(e) => setEditForm({ ...editForm, videoUrl: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div className="md:col-span-2 flex items-center gap-2">
                    <input
                      id="ev-verified"
                      type="checkbox"
                      checked={editForm.verified}
                      onChange={(e) => setEditForm({ ...editForm, verified: e.target.checked })}
                      className="h-4 w-4 rounded border-slate-300"
                    />
                    <Label htmlFor="ev-verified" className="font-normal cursor-pointer">
                      Mark as verified
                    </Label>
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button
                    type="button"
                    className="bg-admin-600 hover:bg-admin-700 text-white shadow-sm"
                    disabled={savingEdit}
                    onClick={handleSaveEdit}
                  >
                    {savingEdit ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    Save changes
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
                    Cancel
                  </Button>
                </div>
              </section>
            )}

            <section>
              <h2 className="font-heading text-lg font-semibold text-slate-900 mb-4">Overview</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="rounded-lg border border-slate-200 bg-white p-4 text-center">
                  <MessageSquare className="w-5 h-5 text-admin-600 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-slate-900">{vendor.reviewCount ?? 0}</p>
                  <p className="text-xs text-slate-500">Reviews</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-4 text-center">
                  <Star className="w-5 h-5 text-amber-500 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-slate-900">{vendor.avgRating ?? 0}</p>
                  <p className="text-xs text-slate-500">Avg rating</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-4 text-center">
                  <LayoutList className="w-5 h-5 text-admin-600 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-slate-900">{vendor.listingCount ?? 0}</p>
                  <p className="text-xs text-slate-500">Listings</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-4 text-center">
                  <MapPin className="w-5 h-5 text-admin-600 mx-auto mb-1" />
                  <p className="text-sm font-semibold text-slate-900 truncate">{vendor.city || '—'}</p>
                  <p className="text-xs text-slate-500">City</p>
                </div>
              </div>
            </section>

            {vendor.description && (
              <section>
                <h2 className="font-heading text-lg font-semibold text-slate-900 mb-2">Description</h2>
                <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{vendor.description}</p>
              </section>
            )}

            <section>
              <h2 className="font-heading text-lg font-semibold text-slate-900 mb-4">Contact &amp; location</h2>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="flex gap-3">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <dt className="text-slate-500">Location</dt>
                    <dd className="font-medium text-slate-900">
                      {[vendor.city, vendor.neighborhood].filter(Boolean).join(', ') || '—'}
                    </dd>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="text-slate-400 shrink-0 w-4" />
                  <div>
                    <dt className="text-slate-500">Category</dt>
                    <dd className="font-medium text-slate-900">{getCategoryName(vendor.category) || vendor.category || '—'}</dd>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Phone className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <dt className="text-slate-500">Phone</dt>
                    <dd className="font-medium text-slate-900">{vendor.phone || '—'}</dd>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Mail className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <dt className="text-slate-500">Email</dt>
                    <dd className="font-medium text-slate-900">{vendor.email || '—'}</dd>
                  </div>
                </div>
                <div className="flex gap-3 sm:col-span-2">
                  <Globe className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <dt className="text-slate-500">Website</dt>
                    <dd className="font-medium text-admin-700">
                      {vendor.website ? (
                        <a href={vendor.website.startsWith('http') ? vendor.website : `https://${vendor.website}`} target="_blank" rel="noopener noreferrer" className="hover:underline">
                          {vendor.website}
                        </a>
                      ) : (
                        '—'
                      )}
                    </dd>
                  </div>
                </div>
              </dl>
            </section>

            <p className="text-xs text-slate-400">
              Admin link:{' '}
              <code className="text-slate-600">{typeof window !== 'undefined' ? window.location.origin : ''}{adminVendorPath(vid)}</code>
            </p>
          </div>
        </div>
      </div>

      <ConfirmActionModal
        open={deleteOpen}
        onOpenChange={(o) => !o && setDeleteOpen(false)}
        title="Delete this vendor?"
        description={
          <>
            <span className="font-semibold text-slate-800">{vendor.name}</span> will be permanently removed. All
            listings and reviews for this vendor will be deleted.
          </>
        }
        confirmLabel="Delete vendor"
        cancelLabel="Cancel"
        onConfirm={handleConfirmDelete}
        loading={actionLoading}
        checkbox={{
          id: 'admin-vendor-detail-delete-notify',
          label: 'Notify vendor by email',
          checked: deleteNotifyEmail,
          onChange: setDeleteNotifyEmail,
          testId: 'vendor-detail-delete-notify-email',
        }}
        footerNote="This cannot be undone."
        data-testid="admin-vendor-detail-delete-modal"
      />
    </div>
  );
}
