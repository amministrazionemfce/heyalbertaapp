import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { adminAPI } from '../../lib/api';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import ConfirmActionModal from '../../components/ConfirmActionModal';
import { ChevronLeft, ChevronRight, Loader2, Pencil, Search, Star, Trash2 } from 'lucide-react';

const PAGE_SIZE = 20;

function reviewRowId(r) {
  return r?.id || r?._id || '';
}

function fmtWhen(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return String(iso);
  }
}

function Stars({ rating }) {
  const r = Math.max(1, Math.min(5, Number(rating) || 5));
  return (
    <div className="inline-flex items-center gap-0.5" aria-label={`${r} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${
            i <= r ? 'text-amber-500 fill-amber-400' : 'text-slate-200 fill-slate-200'
          }`}
          strokeWidth={0}
          aria-hidden
        />
      ))}
    </div>
  );
}

function StarPicker({ value, onChange }) {
  const v = Math.max(1, Math.min(5, Number(value) || 5));
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((i) => {
        const active = i <= v;
        return (
          <button
            key={i}
            type="button"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-spruce-500"
            onClick={() => onChange(i)}
            aria-label={`${i} star${i === 1 ? '' : 's'}`}
          >
            <Star
              className={`h-5 w-5 ${active ? 'text-amber-500 fill-amber-400' : 'text-slate-200 fill-slate-200'}`}
              strokeWidth={0}
              aria-hidden
            />
          </button>
        );
      })}
      <span className="ml-2 text-sm text-slate-500 tabular-nums">{v}/5</span>
    </div>
  );
}

export function AdminListingReviewsSection({ onUpdate }) {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [qDebounced, setQDebounced] = useState('');

  const [editOpen, setEditOpen] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const [editRating, setEditRating] = useState(5);
  const [editComment, setEditComment] = useState('');
  const [editReply, setEditReply] = useState('');
  const [saving, setSaving] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteRow, setDeleteRow] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setQDebounced(q.trim()), 300);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    setPage(1);
  }, [qDebounced]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await adminAPI.listingReviews({
        page,
        limit: PAGE_SIZE,
        ...(qDebounced ? { q: qDebounced } : {}),
      });
      const list = Array.isArray(data?.reviews) ? data.reviews : [];
      setRows(list);
      setTotal(typeof data?.total === 'number' ? data.total : list.length);
    } catch (e) {
      setRows([]);
      setTotal(0);
      toast.error(e.response?.data?.message || 'Could not load reviews.');
    } finally {
      setLoading(false);
    }
  }, [page, qDebounced]);

  useEffect(() => {
    load();
  }, [load]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  useEffect(() => {
    setPage((p) => Math.min(p, totalPages));
  }, [totalPages]);

  const rangeStart = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * PAGE_SIZE, total);

  const openEdit = (r) => {
    setEditRow(r);
    setEditRating(Math.max(1, Math.min(5, Number(r?.rating) || 5)));
    setEditComment(String(r?.comment || '').trim());
    setEditReply(String(r?.reply || '').trim());
    setEditOpen(true);
  };

  const closeEdit = () => {
    setEditOpen(false);
    setEditRow(null);
    setSaving(false);
  };

  const saveEdit = async () => {
    if (!editRow) return;
    const id = reviewRowId(editRow);
    if (!id) return;
    const comment = editComment.trim();
    if (!comment) {
      toast.error('Comment cannot be empty.');
      return;
    }
    setSaving(true);
    try {
      await adminAPI.updateListingReview(id, {
        rating: Math.max(1, Math.min(5, Number(editRating) || 5)),
        comment,
        reply: editReply.trim(),
      });
      toast.success('Review updated.');
      closeEdit();
      await load();
      onUpdate?.();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to update review.');
    } finally {
      setSaving(false);
    }
  };

  const askDelete = (r) => {
    setDeleteRow(r);
    setDeleteOpen(true);
  };

  const doDelete = async () => {
    if (!deleteRow) return;
    const id = reviewRowId(deleteRow);
    if (!id) return;
    setDeleting(true);
    try {
      await adminAPI.deleteListingReview(id);
      toast.success('Review deleted.');
      setDeleteOpen(false);
      setDeleteRow(null);
      await load();
      onUpdate?.();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to delete review.');
    } finally {
      setDeleting(false);
    }
  };

  const emptyState = useMemo(() => !loading && rows.length === 0, [loading, rows.length]);

  return (
    <div className="space-y-6" data-testid="admin-listing-reviews-section">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div className="w-full max-w-md">
          <Label className="text-xs text-slate-500 mb-1 block">Search</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <Input
              type="search"
              autoComplete="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by listing title, reviewer, comment, or reply…"
              className="pl-9 h-10 bg-white"
              data-testid="admin-listing-reviews-search"
            />
          </div>
        </div>
        <p className="text-sm text-slate-500">
          {total} review{total !== 1 ? 's' : ''}
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-spruce-800" />
        </div>
      ) : emptyState ? (
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-slate-600">
          No reviews found.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[920px]">
              <thead className="border-b border-slate-200">
                <tr>
                  <th className="text-left p-4 font-semibold text-slate-700">Listing</th>
                  <th className="text-left p-4 font-semibold text-slate-700">Reviewer</th>
                  <th className="text-left p-4 font-semibold text-slate-700">Rating</th>
                  <th className="text-left p-4 font-semibold text-slate-700">Comment</th>
                  <th className="text-left p-4 font-semibold text-slate-700">Reply</th>
                  <th className="text-left p-4 font-semibold text-slate-700 whitespace-nowrap">Created</th>
                  <th className="text-right p-4 font-semibold text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const id = reviewRowId(r);
                  const listingLabel =
                    String(r.listingTitle || '').trim() ||
                    String(r.listingId || '').trim() ||
                    '—';
                  const reviewer = String(r.userName || '').trim() || '—';
                  const rating = Math.max(1, Math.min(5, Number(r.rating) || 5));
                  return (
                    <tr
                      key={id}
                      className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50"
                      data-testid={`admin-listing-review-${id}`}
                    >
                      <td className="p-2 text-slate-900 font-medium max-w-[220px] truncate" title={listingLabel}>
                        {listingLabel}
                      </td>
                      <td className="p-2 text-slate-600 max-w-[160px] truncate" title={reviewer}>
                        {reviewer}
                      </td>
                      <td className="p-2">
                        <Stars rating={rating} />
                      </td>
                      <td className="p-2 text-slate-600 max-w-[320px] truncate" title={r.comment || ''}>
                        {r.comment || '—'}
                      </td>
                      <td className="p-2 text-slate-600 max-w-[240px] truncate" title={r.reply || ''}>
                        {r.reply || '—'}
                      </td>
                      <td className="p-2 text-slate-600 whitespace-nowrap tabular-nums">{fmtWhen(r.createdAt)}</td>
                      <td className="p-2">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="gap-1"
                            onClick={() => openEdit(r)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="gap-1 text-adminDanger-700 hover:bg-adminDanger-50"
                            onClick={() => askDelete(r)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {total > 0 && (
            <div className="flex flex-col gap-3 border-t border-slate-100 px-4 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
              <p className="text-sm text-slate-600">
                Showing{' '}
                <span className="font-medium text-slate-800">
                  {rangeStart}–{rangeEnd}
                </span>{' '}
                of <span className="font-medium text-slate-800">{total}</span>
                <span className="text-slate-400 mx-1.5">·</span>
                Page <span className="font-medium text-slate-800">{page}</span> of {totalPages}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      <Dialog open={editOpen} onOpenChange={(o) => !o && closeEdit()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit listing review</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-1">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="sm:col-span-1">
                <Label htmlFor="lr-rating">Rating (1–5)</Label>
                  <div className="mt-2">
                    <StarPicker value={editRating} onChange={setEditRating} />
                  </div>
              </div>
            </div>
            <div>
              <Label htmlFor="lr-comment">Comment</Label>
              <Textarea
                id="lr-comment"
                rows={4}
                value={editComment}
                onChange={(e) => setEditComment(e.target.value)}
                className="mt-1 resize-y"
              />
            </div>
            <div>
              <Label htmlFor="lr-reply">Reply (optional)</Label>
              <Textarea
                id="lr-reply"
                rows={3}
                value={editReply}
                onChange={(e) => setEditReply(e.target.value)}
                className="mt-1 resize-y"
                placeholder="Admin reply shown under the review"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={closeEdit} disabled={saving}>
                Cancel
              </Button>
              <Button
                type="button"
                className="gap-2 bg-spruce-700 hover:bg-spruce-800 text-white"
                onClick={saveEdit}
                disabled={saving}
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmActionModal
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        variant="danger"
        title="Delete this review?"
        description={
          <span>
            This will permanently remove the review from the listing page.
          </span>
        }
        confirmLabel="Delete review"
        onConfirm={doDelete}
        loading={deleting}
        data-testid="admin-listing-review-delete-modal"
      />
    </div>
  );
}

