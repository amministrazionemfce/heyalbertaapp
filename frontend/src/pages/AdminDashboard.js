import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { useAuth } from '../lib/auth';
import { adminAPI, resourceAPI } from '../lib/api';
import { CATEGORIES, getTierInfo } from '../data/categories';
import { toast } from 'sonner';
import {
  Users,
  Store,
  BarChart3,
  BookOpen,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  Eye,
  Plus,
  Trash2,
  BadgeCheck,
  Search,
  Filter,
  List,
  LayoutGrid,
  Table as TableIcon,
  Star,
  Megaphone,
  CreditCard,
  Settings,
} from 'lucide-react';

const ADMIN_SECTIONS = [
  { id: 'users', label: 'Users', icon: Users, testId: 'admin-nav-users' },
  { id: 'vendors', label: 'Vendors', icon: Store, testId: 'admin-nav-vendors' },
  { id: 'listings', label: 'Listings', icon: List, testId: 'admin-nav-listings' },
  { id: 'resources', label: 'Resources', icon: BookOpen, testId: 'admin-nav-resources' },
  { id: 'marketings', label: 'Marketings', icon: Megaphone, testId: 'admin-nav-marketings' },
  { id: 'memberships', label: 'Memberships', icon: CreditCard, testId: 'admin-nav-memberships' },
  { id: 'statistics', label: 'Statistics', icon: BarChart3, testId: 'admin-nav-statistics' },
  { id: 'general', label: 'General', icon: Settings, testId: 'admin-nav-general' },
];

const STAT_CARDS = [
  { label: 'Users', key: 'totalUsers', altKey: 'total_users', icon: Users, iconBg: 'bg-blue-500' },
  { label: 'Total Vendors', key: 'totalVendors', altKey: 'total_vendors', icon: Store, iconBg: 'bg-teal-500' },
  { label: 'Pending', key: 'pendingVendors', altKey: 'pending_vendors', icon: Clock, iconBg: 'bg-amber-500' },
  { label: 'Approved', key: 'approvedVendors', altKey: 'approved_vendors', icon: CheckCircle2, iconBg: 'bg-emerald-500' },
  { label: 'Reviews', key: 'totalReviews', altKey: 'total_reviews', icon: BarChart3, iconBg: 'bg-violet-500' },
  { label: 'Resources', key: 'totalResources', altKey: 'total_resources', icon: BookOpen, iconBg: 'bg-rose-500' },
];

function AdminPlaceholder({ icon: Icon, title, description }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-12 text-center" data-testid={`admin-placeholder-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <Icon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
      <h3 className="font-heading font-semibold text-slate-800">{title}</h3>
      <p className="text-sm text-slate-500 mt-1">{description}</p>
    </div>
  );
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const sectionParam = searchParams.get('section');
  const validSection = ADMIN_SECTIONS.some((s) => s.id === sectionParam) ? sectionParam : 'statistics';
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/login');
      return;
    }
    adminAPI
      .stats()
      .then((r) => setStats(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user, navigate]);

  const refreshStats = () => {
    adminAPI.stats().then((r) => setStats(r.data)).catch(() => {});
  };

  const setSection = (id) => {
    setSearchParams(id === 'statistics' ? {} : { section: id });
  };

  const isNavActive = (id) => (id === 'statistics' && !sectionParam) || validSection === id;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center" data-testid="admin-dashboard">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-spruce-700 mx-auto mb-4" />
          <p className="text-slate-500">Loading dashboard…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-50" data-testid="admin-dashboard">
      {/* Left sidebar — same pattern as VendorDashboard */}
      <aside className="lg:w-56 flex-shrink-0 bg-white border-b lg:border-b-0 lg:border-r border-slate-200 lg:min-h-screen lg:sticky lg:top-0 z-40">
        <div className="flex flex-col lg:block">
          <nav className="p-2 flex flex-row lg:flex-col flex-wrap gap-1 lg:gap-0">
            {ADMIN_SECTIONS.map((item) => {
              const Icon = item.icon;
              const active = isNavActive(item.id);
              const pendingBadge = item.id === 'vendors' && (stats?.pendingVendors ?? stats?.pending_vendors) > 0;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSection(item.id)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors lg:w-full ${
                    active ? 'bg-spruce-700 text-white hover:bg-spruce-700' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                  data-testid={item.testId}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{item.label}</span>
                  {pendingBadge && (
                    <Badge className="ml-auto bg-amber-500 text-white text-xs shrink-0">
                      {stats.pendingVendors ?? stats.pending_vendors}
                    </Badge>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0 py-6 px-4 md:px-6">
        <div className="max-w-5xl">
          {validSection === 'statistics' && (
            <section className="space-y-6" data-testid="admin-stats">
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Overview</h2>
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                {STAT_CARDS.map((s) => (
                  <div
                    key={s.label}
                    className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow"
                    data-testid={`stat-${s.label.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <div className={`w-10 h-10 rounded-full ${s.iconBg} flex items-center justify-center mb-3 shadow-sm`}>
                      <s.icon className="w-5 h-5 text-white" />
                    </div>
                    <p className="text-2xl font-bold font-heading text-slate-900">{stats?.[s.key] ?? stats?.[s.altKey] ?? 0}</p>
                    <p className="text-sm text-slate-500 mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
          {validSection === 'users' && <AdminUsers />}
          {validSection === 'vendors' && <AdminVendors onUpdate={refreshStats} />}
          {validSection === 'listings' && (
            <AdminPlaceholder icon={List} title="Listings" description="Manage all listings across vendors. Coming soon." />
          )}
          {validSection === 'resources' && <AdminResources onUpdate={refreshStats} />}
          {validSection === 'marketings' && (
            <AdminPlaceholder icon={Megaphone} title="Marketings" description="Campaigns and promotions. Coming soon." />
          )}
          {validSection === 'memberships' && (
            <AdminPlaceholder icon={CreditCard} title="Memberships" description="Tiers and billing. Coming soon." />
          )}
          {validSection === 'general' && (
            <AdminPlaceholder icon={Settings} title="General" description="Site settings and preferences. Coming soon." />
          )}
        </div>
      </main>
    </div>
  );
}

function AdminVendors({ onUpdate }) {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('list'); // 'table' | 'list'
  const [detailVendor, setDetailVendor] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const navigate = useNavigate();

  const fetch = async () => {
    setLoading(true);
    try {
      const params = filter ? { status: filter } : {};
      const res = await adminAPI.vendors(params);
      setVendors(Array.isArray(res.data) ? res.data : []);
    } catch {
      setVendors([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch();
  }, [filter]);

  const handleApprove = async (id) => {
    setActionLoading(true);
    try {
      await adminAPI.approveVendor(id);
      toast.success('Vendor approved');
      fetch();
      onUpdate();
      if (detailVendor?.id === id) setDetailVendor((prev) => (prev ? { ...prev, status: 'approved' } : null));
    } catch {
      toast.error('Failed to approve');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (id) => {
    setActionLoading(true);
    try {
      await adminAPI.rejectVendor(id);
      toast.success('Vendor rejected');
      fetch();
      onUpdate();
      if (detailVendor?.id === id) setDetailVendor((prev) => (prev ? { ...prev, status: 'rejected' } : null));
    } catch {
      toast.error('Failed to reject');
    } finally {
      setActionLoading(false);
    }
  };

  const handleFeature = async (id, featured) => {
    setActionLoading(true);
    try {
      await adminAPI.featureVendor(id, featured);
      toast.success(featured ? 'Vendor featured' : 'Vendor unfeatured');
      fetch();
      onUpdate();
      if (detailVendor?.id === id) setDetailVendor((prev) => (prev ? { ...prev, featured } : null));
    } catch {
      toast.error('Failed to update feature');
    } finally {
      setActionLoading(false);
    }
  };

  const statusConfig = {
    pending: { label: 'Pending', class: 'bg-amber-800 text-amber-600 hover:cursor-pointer hover:bg-amber-700' },
    approved: { label: 'Approved', class: 'bg-blue-800 text-blue-800 hover:cursor-pointer hover:bg-blue-900' },
    rejected: { label: 'Rejected', class: 'bg-red-800 text-red-800 hover:cursor-pointer hover:bg-red-900' },
  };

  const filteredVendors = search
    ? vendors.filter(
        (v) =>
          (v.name || '').toLowerCase().includes(search.toLowerCase()) ||
          (v.city || '').toLowerCase().includes(search.toLowerCase()) ||
          (CATEGORIES.find((c) => c.id === v.category)?.name || '').toLowerCase().includes(search.toLowerCase())
      )
    : vendors;

  const openDetail = (v) => setDetailVendor(v);
  const closeDetail = () => setDetailVendor(null);

  return (
    <div className="space-y-6" data-testid="admin-vendors-section">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search by name, city, or category…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10 bg-white"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-slate-500 flex items-center gap-1">
            <Filter className="w-4 h-4" /> Status:
          </span>
          {['all', 'pending', 'approved', 'rejected'].map((s) => {
            const isActive = filter === s;
            const activeClass = isActive
              ? s === 'pending'
                ? 'bg-spruce-900 text-white hover:bg-spruce-900 border-spruce-800'
                : s === 'approved'
                  ? 'bg-spruce-900 text-white hover:bg-spruce-900 border-spruce-800'
                  : s === 'rejected'
                    ? 'bg-spruce-900 text-white hover:bg-spruce-900 border-spruce-800'
                    : 'bg-spruce-900 text-white hover:bg-spruce-900 border-spruce-800'
              : '';
            return (
              <Button
                key={s || 'all'}
                variant="outline"
                size="sm"
                className={isActive ? activeClass : ''}
                onClick={() => setFilter(s)}
                data-testid={`filter-${s || 'all'}`}
              >
                {s || 'All'}
              </Button>
            );
          })}
        </div>
        <div className="flex items-center gap-1 border border-slate-200 rounded-lg p-1 bg-white">
          <button
            type="button"
            onClick={() => setViewMode('table')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${viewMode === 'table' ? 'bg-spruce-700 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
            data-testid="view-table"
            title="Table view"
          >
            <TableIcon className="w-4 h-4" /> Table
          </button>
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${viewMode === 'list' ? 'bg-spruce-700 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
            data-testid="view-list"
            title="List view"
          >
            <LayoutGrid className="w-4 h-4" /> List
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-spruce-600" />
        </div>
      ) : filteredVendors.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <Store className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600 font-medium">No vendors found</p>
          <p className="text-sm text-slate-500 mt-1">
            {search ? 'Try a different search or clear filters.' : 'Change the status filter or wait for new submissions.'}
          </p>
          {(search || filter) && (
            <Button variant="outline" className="mt-4" onClick={() => { setSearch(''); setFilter(''); fetch(); }}>
              Clear filters
            </Button>
          )}
        </div>
      ) : viewMode === 'table' ? (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left p-4 font-semibold text-slate-700">Name</th>
                  <th className="text-left p-4 font-semibold text-slate-700">City</th>
                  <th className="text-left p-4 font-semibold text-slate-700">Category</th>
                  <th className="text-left p-4 font-semibold text-slate-700">Status</th>
                  <th className="text-left p-4 font-semibold text-slate-700">Tier</th>
                  <th className="text-left p-4 font-semibold text-slate-700">Reviews</th>
                  <th className="text-right p-4 font-semibold text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredVendors.map((v) => {
                  const tierInfo = getTierInfo(v.tier);
                  const status = statusConfig[v.status] || statusConfig.pending;
                  const categoryName = CATEGORIES.find((c) => c.id === v.category)?.name;
                  return (
                    <tr key={v.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50" data-testid={`admin-vendor-${v.id}`}>
                      <td className="p-4 font-medium text-slate-900">{v.name}</td>
                      <td className="p-4 text-slate-600">{v.city || '—'}</td>
                      <td className="p-4 text-slate-600">{categoryName || '—'}</td>
                      <td className="p-4">
                        <Badge className={status.class}>{status.label}</Badge>
                      </td>
                      <td className="p-4">
                        <Badge variant="secondary" className={tierInfo.color}>{tierInfo.name}</Badge>
                      </td>
                      <td className="p-4 text-slate-600">{v.reviewCount ?? 0} ({v.avgRating ?? 0})</td>
                      <td className="p-4 text-right">
                        <Button size="sm" variant="outline" className="gap-1" onClick={() => openDetail(v)} data-testid={`view-vendor-${v.id}`}>
                          <Eye className="w-4 h-4" /> View
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredVendors.map((v) => {
            const tierInfo = getTierInfo(v.tier);
            const status = statusConfig[v.status] || statusConfig.pending;
            return (
              <div
                key={v.id}
                className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col gap-3 hover:border-slate-300 transition-colors shadow-sm"
                data-testid={`admin-vendor-${v.id}`}
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5 mb-1">
                    <h3 className="font-heading font-semibold text-slate-900 truncate w-full">{v.name}</h3>
                    <Badge className={`${status.class} text-xs border`}>{status.label}</Badge>
                    <Badge variant="secondary" className={`${tierInfo.color} text-xs`}>{tierInfo.name}</Badge>
                    {v.verified && <BadgeCheck className="w-4 h-4 text-spruce-600 flex-shrink-0" />}
                    {v.featured && <Star className="w-4 h-4 text-amber-500 fill-amber-500 flex-shrink-0" />}
                  </div>
                  <p className="text-sm text-slate-500 truncate">
                    {v.city}
                    {CATEGORIES.find((c) => c.id === v.category)?.name && ` · ${CATEGORIES.find((c) => c.id === v.category).name}`}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 mt-auto pt-1">
                  <Button size="sm" variant="outline" className="gap-1 flex-1 min-w-0" onClick={() => openDetail(v)} data-testid={`view-vendor-${v.id}`}>
                    <Eye className="w-4 h-4 shrink-0" /> View
                  </Button>
                  {v.status === 'pending' && (
                    <>
                      <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1 shrink-0" onClick={() => handleApprove(v.id)} data-testid={`approve-${v.id}`}>
                        <CheckCircle2 className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 gap-1 shrink-0" onClick={() => handleReject(v.id)} data-testid={`reject-${v.id}`}>
                        <XCircle className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail view dialog */}
      <Dialog open={!!detailVendor} onOpenChange={(open) => !open && closeDetail()}>
        <DialogContent 
        className="max-w-2xl max-h-[90vh] sm:w-[90%] w-[45%] overflow-y-auto" data-testid="vendor-detail-dialog">
          {detailVendor && (
            <>
              <DialogHeader>
                <DialogTitle className="font-heading text-xl flex items-center gap-2">
                  {detailVendor.name}
                  {(statusConfig[detailVendor.status] || statusConfig.pending).label && (
                    <Badge className={(statusConfig[detailVendor.status] || statusConfig.pending).class}>
                      {(statusConfig[detailVendor.status] || statusConfig.pending).label}
                    </Badge>
                  )}
                  {detailVendor.featured && <Star className="w-5 h-5 text-amber-500 fill-amber-500" />}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                {detailVendor.description && (
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Description</p>
                    <p className="text-sm text-slate-700">{detailVendor.description}</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="text-slate-500">Category</span><p className="font-medium">{CATEGORIES.find((c) => c.id === detailVendor.category)?.name || detailVendor.category || '—'}</p></div>
                  <div><span className="text-slate-500">City</span><p className="font-medium">{detailVendor.city || '—'}</p></div>
                  <div><span className="text-slate-500">Neighborhood</span><p className="font-medium">{detailVendor.neighborhood || '—'}</p></div>
                  <div><span className="text-slate-500">Tier</span><p className="font-medium">{getTierInfo(detailVendor.tier).name}</p></div>
                  <div><span className="text-slate-500">Phone</span><p className="font-medium">{detailVendor.phone || '—'}</p></div>
                  <div><span className="text-slate-500">Email</span><p className="font-medium">{detailVendor.email || '—'}</p></div>
                  <div><span className="text-slate-500">Website</span><p className="font-medium">{detailVendor.website ? <a href={detailVendor.website} target="_blank" rel="noopener noreferrer" className="text-spruce-600 hover:underline">{detailVendor.website}</a> : '—'}</p></div>
                  <div><span className="text-slate-500">Reviews</span><p className="font-medium">{detailVendor.reviewCount ?? 0} (avg {detailVendor.avgRating ?? 0})</p></div>
                </div>
                <div className="flex justify-between gap-2 pt-4 border-t">
                  {detailVendor.status === 'pending' && (
                    <div>
                      <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1" onClick={() => handleApprove(detailVendor.id)} disabled={actionLoading} data-testid={`detail-approve-${detailVendor.id}`}>
                        <CheckCircle2 className="w-4 h-4" /> Approve
                      </Button>
                      <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 gap-1" onClick={() => handleReject(detailVendor.id)} disabled={actionLoading} data-testid={`detail-reject-${detailVendor.id}`}>
                        <XCircle className="w-4 h-4" /> Reject
                      </Button>
                    </div>
                  )}
                  <Button
                    size="sm"
                    variant={detailVendor.featured ? 'outline' : 'default'}
                    className={detailVendor.featured ? 'border-amber-300 text-amber-700 hover:bg-amber-50' : 'bg-amber-500 hover:bg-amber-600 text-white'}
                    onClick={() => handleFeature(detailVendor.id, !detailVendor.featured)}
                    disabled={actionLoading || detailVendor.status !== 'approved'}
                    title={detailVendor.status !== 'approved' ? 'Approve vendor first to feature' : undefined}
                    data-testid={`detail-feature-${detailVendor.id}`}
                  >
                    <Star className={`w-4 h-4 shrink-0 ${detailVendor.featured ? 'fill-amber-500' : ''}`} />
                    {detailVendor.featured ? ' Unfeature' : ' Feature'}
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    adminAPI
      .users()
      .then((r) => setUsers(Array.isArray(r.data) ? r.data : []))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }, []);

  const roleConfig = {
    admin: { label: 'Admin', class: 'bg-yellow-800 text-violet-800' },
    vendor: { label: 'Vendor', class: 'bg-spruce-100 text-spruce-800' },
    user: { label: 'User', class: 'bg-slate-100 text-slate-700' },
  };

  const filteredUsers = search
    ? users.filter(
        (u) =>
          (u.name || '').toLowerCase().includes(search.toLowerCase()) ||
          (u.email || '').toLowerCase().includes(search.toLowerCase())
      )
    : users;

  return (
    <div className="space-y-6" data-testid="admin-users-section">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10 bg-white"
          />
        </div>
        <p className="text-sm text-slate-500">{filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''}</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-spruce-600" />
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left p-4 font-semibold text-slate-700">Name</th>
                  <th className="text-left p-4 font-semibold text-slate-700">Email</th>
                  <th className="text-left p-4 font-semibold text-slate-700">Role</th>
                  <th className="text-left p-4 font-semibold text-slate-700">Joined</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => {
                  const role = roleConfig[u.role] || roleConfig.user;
                  const date = u.createdAt || u.created_at;
                  return (
                    <tr
                      key={u.id || u._id}
                      className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50"
                      data-testid={`admin-user-${u.id || u._id}`}
                    >
                      <td className="p-4 font-medium text-slate-900">{u.name}</td>
                      <td className="p-4 text-slate-600">{u.email}</td>
                      <td className="p-4">
                        <Badge className={role.class}><span className="text-xs p-0.5">{role.label}</span></Badge>
                      </td>
                      <td className="p-4 text-slate-500">{date ? new Date(date).toLocaleDateString() : '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filteredUsers.length === 0 && (
            <div className="p-12 text-center text-slate-500">
              {search ? 'No users match your search.' : 'No users yet.'}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AdminResources({ onUpdate }) {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: '', type: 'guide', content: '', category: 'general' });
  const [search, setSearch] = useState('');

  const fetch = async () => {
    try {
      const res = await resourceAPI.list();
      setResources(Array.isArray(res.data) ? res.data : []);
    } catch {
      setResources([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch();
  }, []);

  const handleCreate = async () => {
    if (!form.title?.trim()) {
      toast.error('Title is required');
      return;
    }
    try {
      await resourceAPI.create(form);
      toast.success('Resource created');
      setShowCreate(false);
      setForm({ title: '', type: 'guide', content: '', category: 'general' });
      fetch();
      onUpdate();
    } catch {
      toast.error('Failed to create resource');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this resource? This cannot be undone.')) return;
    try {
      await resourceAPI.delete(id);
      toast.success('Resource deleted');
      fetch();
      onUpdate();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const typeConfig = {
    checklist: { label: 'Checklist', class: 'bg-blue-100 text-blue-800' },
    guide: { label: 'Guide', class: 'bg-emerald-100 text-emerald-800' },
    faq: { label: 'FAQ', class: 'bg-violet-100 text-violet-800' },
  };

  const filteredResources = search
    ? resources.filter(
        (r) =>
          (r.title || '').toLowerCase().includes(search.toLowerCase()) ||
          (r.category || '').toLowerCase().includes(search.toLowerCase())
      )
    : resources;

  return (
    <div className="space-y-6" data-testid="admin-resources-section">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search resources…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10 bg-white"
          />
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button className="bg-spruce-700 hover:bg-spruce-800 text-white gap-2" data-testid="create-resource-btn">
              <Plus className="w-4 h-4" /> Add Resource
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-heading text-xl">Create resource</DialogTitle>
              <p className="text-sm text-slate-500 mt-1">Add a new guide, checklist, or FAQ for the resource library.</p>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label className="text-slate-700">Title</Label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="mt-1.5"
                  placeholder="e.g. Moving checklist"
                  data-testid="resource-form-title"
                />
              </div>
              <div>
                <Label className="text-slate-700">Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="checklist">Checklist</SelectItem>
                    <SelectItem value="guide">Guide</SelectItem>
                    <SelectItem value="faq">FAQ</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-slate-700">Category</Label>
                <Input
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="mt-1.5"
                  placeholder="e.g. general, moving"
                />
              </div>
              <div>
                <Label className="text-slate-700">Content (Markdown supported)</Label>
                <Textarea
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  rows={8}
                  className="mt-1.5 font-mono text-sm"
                  placeholder="## Heading&#10;- Bullet points&#10;1. Numbered list"
                  data-testid="resource-form-content"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <Button onClick={handleCreate} className="flex-1 bg-spruce-700 hover:bg-spruce-800 text-white" data-testid="resource-form-save">
                  Create resource
                </Button>
                <Button variant="outline" onClick={() => setShowCreate(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-spruce-600" />
        </div>
      ) : filteredResources.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600 font-medium">No resources yet</p>
          <p className="text-sm text-slate-500 mt-1">Create guides, checklists, or FAQs to help newcomers.</p>
          <Button className="mt-4 bg-spruce-700 text-white" onClick={() => setShowCreate(true)}>
            <Plus className="w-4 h-4 mr-2" /> Add first resource
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredResources.map((r) => {
            const type = typeConfig[r.type] || typeConfig.guide;
            return (
              <div
                key={r.id}
                className="bg-white rounded-xl border border-slate-200 p-4 md:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-300 transition-colors"
                data-testid={`admin-resource-${r.id}`}
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h3 className="font-semibold text-slate-900">{r.title}</h3>
                    <Badge className={type.class}>{type.label}</Badge>
                  </div>
                  <p className="text-sm text-slate-500">{r.category || 'general'}</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-red-600 border-red-200 hover:bg-red-50 gap-1 flex-shrink-0"
                  onClick={() => handleDelete(r.id)}
                  data-testid={`delete-resource-${r.id}`}
                >
                  <Trash2 className="w-4 h-4" /> Delete
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
