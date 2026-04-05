import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import { Button } from '../../components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { adminAPI } from '../../lib/api';
import { resolveMediaUrl } from '../../lib/mediaUrl';
import { useAuth } from '../../lib/auth';
import { ROUTES } from '../../constants';
import ConfirmActionModal from '../../components/ConfirmActionModal';
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  LayoutList,
  Loader2,
  Mail,
  Search,
  Trash2,
} from 'lucide-react';

const PAGE_SIZE_OPTIONS = [10, 20, 50];
const DEFAULT_PAGE_SIZE = 20;
const SORT_KEYS = { name: 'name', role: 'role' };

function userRowId(u) {
  return u.id || u._id || '';
}

function UserAvatar({ user }) {
  const raw = user.avatar_url || user.avatarUrl;
  const src = raw ? resolveMediaUrl(raw) || raw : '';
  const initial = (user.name || user.email || '?').trim().slice(0, 1).toUpperCase() || '?';
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (src && !failed) {
    return (
      <img
        src={src}
        alt=""
        className="h-8 w-8 rounded-full object-cover border border-slate-200 bg-slate-100 shrink-0"
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <div
      className="h-8 w-8 rounded-full bg-green-100 text-slate-600 border border-green-100 flex items-center justify-center shrink-0 font-semibold text-xs"
      aria-hidden
    >
      {initial}
    </div>
  );
}

function SortHeaderButton({ label, sortKey, activeKey, order, onSort }) {
  const active = activeKey === sortKey;
  const Icon = !active ? ArrowUpDown : order === 'asc' ? ArrowUp : ArrowDown;
  return (
    <button
      type="button"
      onClick={() => onSort(sortKey)}
      className="inline-flex items-center gap-1.5 font-semibold text-slate-700 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-admin-500 rounded"
      aria-sort={
        active ? (order === 'asc' ? 'ascending' : 'descending') : 'none'
      }
    >
      {label}
      <Icon className="h-4 w-4 text-slate-400 shrink-0" aria-hidden />
    </button>
  );
}

/** Rounded “pill” chips similar to admin roster tables (distinct hues per role). */
function RolePill({ role }) {
  const r = String(role || 'user').toLowerCase();
  const styles = {
    admin: 'bg-emerald-100 text-emerald-900',
    vendor: 'bg-sky-100 text-sky-900',
    user: 'bg-indigo-50 text-indigo-800',
  };
  const labels = { admin: 'Admin', vendor: 'Vendor', user: 'User' };
  const cls = styles[r] || styles.user;
  const label = labels[r] || r.charAt(0).toUpperCase() + r.slice(1);
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-tight ${cls}`}
    >
      {label}
    </span>
  );
}

const ROLE_FILTER_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'user', label: 'Users' },
  { value: 'vendor', label: 'Vendors' },
];

const MEMBERSHIP_FILTER_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'featured', label: 'Featured' },
];

function MembershipStatusPill({ status }) {
  const s = String(status || 'free').toLowerCase();
  const styles = {
    free: 'bg-slate-100 text-slate-600 ring-1 ring-slate-200/80',
    standard: 'bg-sky-50 text-sky-900 ring-1 ring-sky-200/80',
    premium: 'bg-amber-50 text-amber-900 ring-1 ring-amber-200/80',
  };
  const labels = { free: 'Free', standard: 'Standard', premium: 'Gold' };
  const cls = styles[s] || styles.free;
  const label = labels[s] || 'Free';
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-tight ${cls}`}>
      {label}
    </span>
  );
}

/** Listing count chip — stands out when the user has listings, muted at zero. */
function ListingCountBadge({ count }) {
  const n = typeof count === 'number' && Number.isFinite(count) ? count : 0;
  const hasListings = n > 0;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold tabular-nums ${
        hasListings
          ? 'border-emerald-200/90 bg-gradient-to-br from-emerald-50 to-teal-50/80 text-emerald-900 shadow-sm shadow-emerald-900/5'
          : 'border-slate-100 bg-slate-50 text-slate-400'
      }`}
      title={hasListings ? `${n} listing${n !== 1 ? 's' : ''}` : 'No listings yet'}
    >
      <LayoutList
        className={`h-3.5 w-3.5 shrink-0 ${hasListings ? 'text-emerald-700' : 'text-slate-400'}`}
        aria-hidden
      />
      {n}
    </span>
  );
}

function formatLastActive(iso) {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return '—';
  }
}

function authUserId(user) {
  if (!user) return '';
  return String(user.id || user._id || '');
}

export function AdminUsersSection() {
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  const myId = authUserId(authUser);

  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [membershipFilter, setMembershipFilter] = useState('all');
  const [sortField, setSortField] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [selectedIds, setSelectedIds] = useState([]);
  const [emailOpen, setEmailOpen] = useState(false);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [emailSending, setEmailSending] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [singleDeleteOpen, setSingleDeleteOpen] = useState(false);
  const [singleDeleteTarget, setSingleDeleteTarget] = useState(null);
  const [singleDeleteEmail, setSingleDeleteEmail] = useState('');
  const [singleNotifyBeforeDelete, setSingleNotifyBeforeDelete] = useState(false);
  const [singleDeleteSubject, setSingleDeleteSubject] = useState('');
  const [singleDeleteContent, setSingleDeleteContent] = useState('');
  const [singleDeleteLoading, setSingleDeleteLoading] = useState(false);

  const headerCheckboxRef = useRef(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(searchInput.trim()), 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [debouncedQ, roleFilter, membershipFilter, pageSize]);

  useEffect(() => {
    setSelectedIds([]);
  }, [page, debouncedQ, roleFilter, membershipFilter, sortField, sortOrder, pageSize]);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await adminAPI.users({
        page,
        limit: pageSize,
        ...(debouncedQ ? { q: debouncedQ } : {}),
        roleFilter,
        membershipFilter,
        sort: sortField,
        order: sortOrder,
      });
      const list = Array.isArray(data?.users) ? data.users : [];
      setUsers(list);
      setTotal(typeof data?.total === 'number' ? data.total : list.length);
      setTotalPages(
        typeof data?.totalPages === 'number' ? data.totalPages : 1
      );
    } catch {
      setUsers([]);
      setTotal(0);
      setTotalPages(1);
      toast.error('Could not load users.');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, debouncedQ, roleFilter, membershipFilter, sortField, sortOrder]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    setPage((p) => (p > totalPages ? totalPages : p));
  }, [totalPages]);

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  const pageIds = useMemo(() => users.map(userRowId).filter(Boolean), [users]);

  const allPageSelected =
    pageIds.length > 0 && pageIds.every((id) => selectedSet.has(id));
  const somePageSelected = pageIds.some((id) => selectedSet.has(id));

  useEffect(() => {
    const el = headerCheckboxRef.current;
    if (el) el.indeterminate = somePageSelected && !allPageSelected;
  }, [somePageSelected, allPageSelected]);

  const toggleSort = (key) => {
    if (sortField === key) {
      setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(key);
      setSortOrder('asc');
    }
  };

  const toggleRow = (id) => {
    if (!id) return;
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAllPage = () => {
    if (allPageSelected) {
      setSelectedIds((prev) => prev.filter((id) => !pageIds.includes(id)));
    } else {
      setSelectedIds((prev) => [...new Set([...prev, ...pageIds])]);
    }
  };

  const rowDeleteDisabled = (u) => {
    const id = userRowId(u);
    if (!id) return true;
    if (id === myId) return true;
    if (String(u.role || '').toLowerCase() === 'admin') return true;
    return false;
  };

  const openSingleDelete = (u) => {
    setSingleDeleteTarget(u);
    setSingleDeleteEmail(String(u.email || '').trim());
    setSingleNotifyBeforeDelete(false);
    setSingleDeleteSubject('Notice regarding your Hey Alberta account');
    setSingleDeleteContent('');
    setSingleDeleteOpen(true);
  };

  const closeSingleDelete = () => {
    setSingleDeleteOpen(false);
    setSingleDeleteTarget(null);
    setSingleDeleteLoading(false);
  };

  const confirmSingleDelete = async () => {
    if (!singleDeleteTarget) return;
    const id = userRowId(singleDeleteTarget);
    if (!id) return;

    if (singleNotifyBeforeDelete) {
      const sub = singleDeleteSubject.trim();
      const body = singleDeleteContent.trim();
      if (!sub || !body) {
        toast.error('Add subject and message to send the notification email.');
        return;
      }
    }

    setSingleDeleteLoading(true);
    try {
      if (singleNotifyBeforeDelete) {
        await adminAPI.emailUsers({
          userIds: [id],
          subject: singleDeleteSubject.trim(),
          text: singleDeleteContent.trim(),
        });
      }

      const { data } = await adminAPI.bulkDeleteUsers({ userIds: [id] });
      const { deleted = 0, skipped = [], errors = [] } = data || {};
      if (deleted) {
        toast.success('User deleted.');
      } else if (skipped.length) {
        toast.error(
          skipped[0]?.reason === 'cannot_delete_admin'
            ? 'Admin accounts cannot be deleted.'
            : skipped[0]?.reason === 'cannot_delete_self'
              ? 'You cannot delete your own account.'
              : 'Could not delete this user.'
        );
      } else if (errors.length) {
        toast.error(errors[0]?.message || 'Delete failed.');
      }
      closeSingleDelete();
      await loadUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete user.');
    } finally {
      setSingleDeleteLoading(false);
    }
  };

  const openEmail = () => {
    if (!selectedIds.length) {
      toast.error('Select at least one user.');
      return;
    }
    setEmailSubject('');
    setEmailBody('');
    setEmailOpen(true);
  };

  const sendEmail = async () => {
    const subject = emailSubject.trim();
    const text = emailBody.trim();
    if (!subject) {
      toast.error('Add a subject.');
      return;
    }
    if (!text) {
      toast.error('Add message content.');
      return;
    }
    setEmailSending(true);
    try {
      const { data } = await adminAPI.emailUsers({
        userIds: selectedIds,
        subject,
        text,
      });
      toast.success(
        data?.message ||
          `Sent ${data?.sent ?? 0} email(s).${data?.failed ? ` ${data.failed} failed.` : ''}`
      );
      setEmailOpen(false);
      setSelectedIds([]);
      await loadUsers();
    } catch (err) {
      toast.error(
        err.response?.data?.message || 'Failed to send email.'
      );
    } finally {
      setEmailSending(false);
    }
  };

  const confirmBulkDelete = async () => {
    setDeleteLoading(true);
    try {
      const { data } = await adminAPI.bulkDeleteUsers({
        userIds: selectedIds,
      });
      const { deleted = 0, skipped = [], errors = [] } = data || {};
      if (deleted) {
        toast.success(`Deleted ${deleted} user(s).`);
      }
      if (skipped.length) {
        toast.message(
          `${skipped.length} skipped (e.g. admin accounts or yourself).`
        );
      }
      if (errors.length) {
        toast.error(
          errors[0]?.message || 'Some deletions failed.'
        );
      }
      setDeleteOpen(false);
      setSelectedIds([]);
      await loadUsers();
    } catch (err) {
      toast.error(
        err.response?.data?.message || 'Failed to delete users.'
      );
    } finally {
      setDeleteLoading(false);
    }
  };

  const roleFilterLabel =
    ROLE_FILTER_OPTIONS.find((o) => o.value === roleFilter)?.label || 'All';
  const membershipFilterLabel =
    MEMBERSHIP_FILTER_OPTIONS.find((o) => o.value === membershipFilter)?.label ||
    'All';

  const rangeStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, total);

  return (
    <div className="space-y-6" data-testid="admin-users-section">
      <div className="flex flex-col gap-4 xl:flex-row xl:flex-wrap xl:items-end">
        <div className="w-full max-w-[16rem] sm:max-w-xs shrink-0">
          <Label className="text-xs text-slate-500 mb-1 block">Search</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <Input
              placeholder="Search name or email…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-9 h-10 bg-white w-full"
            />
          </div>
        </div>
        <div className="w-full sm:w-44 shrink-0">
          <Label className="text-xs text-slate-500 mb-1 block">User status</Label>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="h-10 bg-white">
              <SelectValue placeholder="Filter">{roleFilterLabel}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {ROLE_FILTER_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-full sm:w-44 shrink-0">
          <Label className="text-xs text-slate-500 mb-1 block">Membership</Label>
          <Select value={membershipFilter} onValueChange={setMembershipFilter}>
            <SelectTrigger className="h-10 bg-white">
              <SelectValue placeholder="Membership">{membershipFilterLabel}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {MEMBERSHIP_FILTER_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-full sm:w-36 shrink-0">
          <Label className="text-xs text-slate-500 mb-1 block">Rows / page</Label>
          <Select
            value={String(pageSize)}
            onValueChange={(v) => setPageSize(Number(v))}
          >
            <SelectTrigger className="h-10 bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZE_OPTIONS.map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            className="gap-2"
            disabled={!selectedIds.length}
            onClick={openEmail}
          >
            <Mail className="h-4 w-4" />
            Send Email
          </Button>
          <Button
            type="button"
            variant="outline"
            className="gap-2 border-adminDanger-200 text-adminDanger-700 hover:bg-adminDanger-50"
            disabled={!selectedIds.length}
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </div>
        <p className="text-sm text-slate-500 xl:ml-auto">
          {total} user{total !== 1 ? 's' : ''}
          {selectedIds.length > 0 ? ` · ${selectedIds.length} selected` : ''}
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-admin-600" />
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[1000px]">
              <thead className="border-b border-slate-200">
                <tr>
                  <th className="w-12 px-2 py-2">
                    <input
                      ref={headerCheckboxRef}
                      type="checkbox"
                      className="h-4 w-4 rounded border-slate-300"
                      checked={allPageSelected && pageIds.length > 0}
                      onChange={toggleSelectAllPage}
                      aria-label="Select all users on this page"
                    />
                  </th>
                  <th className="text-left px-2 py-2 w-12"> </th>
                  <th className="text-left px-3 py-2">
                    <SortHeaderButton
                      label="Name"
                      sortKey={SORT_KEYS.name}
                      activeKey={sortField}
                      order={sortOrder}
                      onSort={toggleSort}
                    />
                  </th>
                  <th className="text-left px-3 py-2 font-semibold text-slate-700">
                    Email
                  </th>
                  <th className="text-left px-3 py-2">
                    <SortHeaderButton
                      label="Role"
                      sortKey={SORT_KEYS.role}
                      activeKey={sortField}
                      order={sortOrder}
                      onSort={toggleSort}
                    />
                  </th>
                  <th className="text-left px-3 py-2 font-semibold text-slate-700 w-[6.5rem]">
                    Membership
                  </th>
                  <th className="text-left px-3 py-2 font-semibold text-slate-700">
                    Joined
                  </th>
                  <th className="text-left px-3 py-2 font-semibold text-slate-700">
                    Last active
                  </th>
                  <th className="text-left px-3 py-2 font-semibold text-slate-700 w-[7rem]">
                    Listings
                  </th>
                  <th className="px-2 py-2 w-[6.25rem] text-center font-semibold text-slate-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const id = userRowId(u);
                  const joined = u.createdAt || u.created_at;
                  const disabledDel = rowDeleteDisabled(u);
                  const listingsCount =
                    typeof u.listingsCount === 'number' ? u.listingsCount : 0;
                  return (
                    <tr
                      key={id}
                      className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50"
                      data-testid={`admin-user-${id}`}
                    >
                      <td className="px-2 py-1.5 align-middle">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-slate-300"
                          checked={selectedSet.has(id)}
                          onChange={() => toggleRow(id)}
                          aria-label={`Select ${u.name || u.email}`}
                        />
                      </td>
                      <td className="px-2 py-1.5 align-middle">
                        <UserAvatar user={u} />
                      </td>
                      <td className="px-3 py-1.5 font-medium text-slate-900">
                        {u.name}
                      </td>
                      <td className="px-3 py-1.5 text-slate-600">{u.email}</td>
                      <td className="px-3 py-1.5">
                        <RolePill role={u.role} />
                      </td>
                      <td className="px-3 py-1.5 align-middle">
                        <MembershipStatusPill status={u.membershipStatus} />
                      </td>
                      <td className="px-3 py-1.5 text-slate-500">
                        {joined
                          ? new Date(joined).toLocaleDateString()
                          : '—'}
                      </td>
                      <td className="px-3 py-1.5 text-slate-500 whitespace-nowrap text-[13px]">
                        {formatLastActive(u.lastActiveAt)}
                      </td>
                      <td className="px-3 py-1.5 align-middle">
                        <ListingCountBadge count={listingsCount} />
                      </td>
                      <td className="px-2 py-1.5 align-middle">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-admin-600 text-white shadow-sm shadow-admin-700/15 transition hover:bg-admin-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-admin-500 focus-visible:ring-offset-2"
                            aria-label={`View listings for ${u.name || u.email}`}
                            title="View listings for this user"
                            onClick={() =>
                              navigate(
                                `${ROUTES.ADMIN}?section=listings&userId=${encodeURIComponent(id)}`
                              )
                            }
                          >
                            <Eye className="h-3.5 w-3.5 shrink-0" strokeWidth={2.25} aria-hidden />
                          </button>
                          <button
                            type="button"
                            className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-white shadow-sm shadow-red-500/20 transition hover:bg-red-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-35 disabled:shadow-none"
                            aria-label={`Delete user ${u.name || u.email}`}
                            disabled={disabledDel}
                            onClick={() => openSingleDelete(u)}
                            title={
                              disabledDel
                                ? id === myId
                                  ? 'You cannot delete your own account'
                                  : String(u.role || '').toLowerCase() === 'admin'
                                    ? 'Admin accounts cannot be deleted here'
                                    : 'Cannot delete'
                                : 'Delete user'
                            }
                          >
                            <Trash2 className="h-3.5 w-3.5 shrink-0" strokeWidth={2.25} aria-hidden />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {users.length === 0 && (
            <div className="p-12 text-center text-slate-500">
              {debouncedQ || roleFilter !== 'all' || membershipFilter !== 'all'
                ? 'No users match your filters.'
                : 'No users yet.'}
            </div>
          )}

          {total > 0 && (
            <div className="flex flex-col gap-3 border-t border-slate-100 px-4 py-3 bg-slate-50/80 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
              <p className="text-sm text-slate-600">
                Showing{' '}
                <span className="font-medium text-slate-800">
                  {rangeStart}–{rangeEnd}
                </span>{' '}
                of <span className="font-medium text-slate-800">{total}</span>
                <span className="text-slate-400 mx-1.5">·</span>
                Page{' '}
                <span className="font-medium text-slate-800">
                  {page}
                </span>{' '}
                of {totalPages}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1"
                  disabled={page >= totalPages}
                  onClick={() =>
                    setPage((p) => Math.min(totalPages, p + 1))
                  }
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      <Dialog open={emailOpen} onOpenChange={setEmailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Email {selectedIds.length} user(s)</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="admin-user-email-subject">Subject</Label>
              <Input
                id="admin-user-email-subject"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                placeholder="Subject line"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-user-email-body">Message</Label>
              <Textarea
                id="admin-user-email-body"
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                rows={8}
                placeholder="Plain text message…"
                className="resize-y min-h-[160px]"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEmailOpen(false)}
                disabled={emailSending}
              >
                Cancel
              </Button>
              <Button
                type="button"
                className="gap-2 bg-admin-700 hover:bg-admin-800"
                onClick={sendEmail}
                disabled={emailSending}
              >
                {emailSending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Mail className="h-4 w-4" />
                )}
                Send
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={singleDeleteOpen} onOpenChange={(open) => !open && closeSingleDelete()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Delete {singleDeleteTarget?.name || 'user'}?
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-1 text-sm text-slate-600">
            <p>
              This removes the account and, for vendors, their listings and reviews.
            </p>
            <div className="space-y-2">
              <Label htmlFor="single-delete-email">Account email</Label>
              <Input
                id="single-delete-email"
                value={singleDeleteEmail}
                onChange={(e) => setSingleDeleteEmail(e.target.value)}
                readOnly
                className="bg-slate-50 text-slate-800"
              />
              <p className="text-xs text-slate-500">
                Notifications are sent to this address.
              </p>
            </div>
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 rounded border-slate-300"
                checked={singleNotifyBeforeDelete}
                onChange={(e) => setSingleNotifyBeforeDelete(e.target.checked)}
              />
              <span>
                <span className="font-medium text-slate-800">
                  Send email before deleting
                </span>
                <span className="block text-slate-500 text-xs mt-0.5">
                  Requires subject and message below. Uses your server SMTP settings.
                </span>
              </span>
            </label>
            {singleNotifyBeforeDelete && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="single-delete-subject">Email subject</Label>
                  <Input
                    id="single-delete-subject"
                    value={singleDeleteSubject}
                    onChange={(e) => setSingleDeleteSubject(e.target.value)}
                    placeholder="Subject"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="single-delete-content">Email content</Label>
                  <Textarea
                    id="single-delete-content"
                    value={singleDeleteContent}
                    onChange={(e) => setSingleDeleteContent(e.target.value)}
                    rows={5}
                    placeholder="Message to send to this user…"
                    className="resize-y min-h-[120px]"
                  />
                </div>
              </>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={closeSingleDelete}
                disabled={singleDeleteLoading}
              >
                Cancel
              </Button>
              <Button
                type="button"
                className="gap-2 bg-red-600 hover:bg-red-700 text-white"
                onClick={confirmSingleDelete}
                disabled={singleDeleteLoading}
              >
                {singleDeleteLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                Delete user
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmActionModal
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        variant="danger"
        title={`Delete ${selectedIds.length} user(s)?`}
        description={
          <span>
            This cannot be undone. Vendor accounts will have their listings and
            reviews removed first. Admin accounts and your own account cannot be
            deleted here.
          </span>
        }
        confirmLabel="Delete users"
        onConfirm={confirmBulkDelete}
        loading={deleteLoading}
        data-testid="admin-users-bulk-delete-modal"
      />
    </div>
  );
}
