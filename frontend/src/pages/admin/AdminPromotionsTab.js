import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, Loader2, Mail, Pencil, Plus, Send, Tag, Trash2, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { adminAPI } from '../../lib/api';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import ConfirmActionModal from '../../components/ConfirmActionModal';

const PLACEHOLDER_NAME = '{{name}}';
const PLACEHOLDER_CODE = '{{code}}';
const PLACEHOLDER_DURATION = '{{durationDays}}';
const PLACEHOLDER_URL = '{{redeemUrl}}';

const DEFAULT_PROMO_SUBJECT = 'Your Hey Alberta promotion';
const DEFAULT_PROMO_BODY = `Hi {{name}},

You have a promotion for Standard membership on Hey Alberta for {{durationDays}} days (the clock starts when you apply the code on your profile).

Your code: {{code}}

Redeem here: {{redeemUrl}}

Thank you,
Hey Alberta`;

function insertAtCaret(el, currentValue, insert, setValue) {
  if (!el) {
    setValue(`${currentValue}${insert}`);
    return;
  }
  const start = typeof el.selectionStart === 'number' ? el.selectionStart : currentValue.length;
  const end = typeof el.selectionEnd === 'number' ? el.selectionEnd : start;
  const next = currentValue.slice(0, start) + insert + currentValue.slice(end);
  setValue(next);
  const caret = start + insert.length;
  requestAnimationFrame(() => {
    try {
      el.focus();
      el.setSelectionRange(caret, caret);
    } catch {
      /* ignore */
    }
  });
}

export default function AdminPromotionsTab() {
  const [loading, setLoading] = useState(true);
  const [promotions, setPromotions] = useState([]);
  const [creating, setCreating] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newCode, setNewCode] = useState('');
  const [newDuration, setNewDuration] = useState('30');
  const [newRedeemBy, setNewRedeemBy] = useState('');
  const [newSysNotifEnabled, setNewSysNotifEnabled] = useState(false);
  const [newSysNotifTitle, setNewSysNotifTitle] = useState('');
  const [newSysNotifMessage, setNewSysNotifMessage] = useState('');
  const [newSysNotifVariant, setNewSysNotifVariant] = useState('info');

  const [expandedId, setExpandedId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editLabel, setEditLabel] = useState('');
  const [editDuration, setEditDuration] = useState('30');
  const [editRedeemBy, setEditRedeemBy] = useState('');
  const [editActive, setEditActive] = useState(true);
  const [editSysNotifEnabled, setEditSysNotifEnabled] = useState(false);
  const [editSysNotifTitle, setEditSysNotifTitle] = useState('');
  const [editSysNotifMessage, setEditSysNotifMessage] = useState('');
  const [editSysNotifVariant, setEditSysNotifVariant] = useState('info');
  const [saveEditBusy, setSaveEditBusy] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deactivateModalOpen, setDeactivateModalOpen] = useState(false);
  const [deactivateTarget, setDeactivateTarget] = useState(null);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [historyTarget, setHistoryTarget] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyData, setHistoryData] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [emailSubject, setEmailSubject] = useState(DEFAULT_PROMO_SUBJECT);
  const [emailBody, setEmailBody] = useState(DEFAULT_PROMO_BODY);
  const [sending, setSending] = useState(false);

  const subjectRef = useRef(null);
  const bodyRef = useRef(null);

  const loadPromotions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminAPI.promotions();
      setPromotions(Array.isArray(res.data) ? res.data : []);
    } catch {
      toast.error('Could not load promotions.');
      setPromotions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPromotions();
  }, [loadPromotions]);

  const loadUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const res = await adminAPI.users({ page: 1, limit: 100, q: userSearch || undefined });
      setUsers(res.data?.users ?? []);
    } catch {
      toast.error('Could not load users.');
      setUsers([]);
    } finally {
      setUsersLoading(false);
    }
  }, [userSearch]);

  useEffect(() => {
    if (!expandedId) return undefined;
    loadUsers();
  }, [expandedId, loadUsers]);

  useEffect(() => {
    if (!expandedId) return undefined;
    const t = setTimeout(() => loadUsers(), 400);
    return () => clearTimeout(t);
  }, [userSearch, expandedId, loadUsers]);

  const toggleUser = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const createPromotion = async () => {
    const durationDays = Math.floor(Number(newDuration));
    if (!Number.isFinite(durationDays) || durationDays < 1) {
      toast.error('Enter a valid duration in days (1+).');
      return;
    }
    setCreating(true);
    try {
      const payload = {
        label: newLabel.trim(),
        durationDays,
        code: newCode.trim() || undefined,
        redeemBy: newRedeemBy.trim() ? newRedeemBy.trim() : undefined,
        systemNotification: newSysNotifEnabled
          ? {
              enabled: true,
              title: String(newSysNotifTitle || '').trim(),
              message: String(newSysNotifMessage || '').trim(),
              variant: newSysNotifVariant,
            }
          : { enabled: false },
      };
      const res = await adminAPI.createPromotion(payload);
      setPromotions((prev) => [res.data, ...prev]);
      setNewLabel('');
      setNewCode('');
      setNewDuration('30');
      setNewRedeemBy('');
      setNewSysNotifEnabled(false);
      setNewSysNotifTitle('');
      setNewSysNotifMessage('');
      setNewSysNotifVariant('info');
      toast.success(`Promotion created: ${res.data?.code || 'OK'}`);
      try {
        window.dispatchEvent(new Event('system-notification-updated'));
      } catch {
        /* ignore */
      }
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Could not create promotion.');
    } finally {
      setCreating(false);
    }
  };

  const patchPromotion = async (id, body) => {
    try {
      const res = await adminAPI.updatePromotion(id, body);
      setPromotions((prev) => prev.map((p) => (String(p._id) === String(id) ? { ...p, ...res.data } : p)));
      toast.success('Updated.');
      try {
        window.dispatchEvent(new Event('system-notification-updated'));
      } catch {
        /* ignore */
      }
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Update failed.');
    }
  };

  const beginEdit = (p) => {
    setEditingId(p._id);
    setEditLabel(String(p.label || ''));
    setEditDuration(String(p.durationDays ?? '30'));
    setEditRedeemBy(p.redeemBy ? String(p.redeemBy).slice(0, 16) : '');
    setEditActive(Boolean(p.active));
    setEditSysNotifEnabled(Boolean(p.systemNotification?.enabled));
    setEditSysNotifTitle(String(p.systemNotification?.title || ''));
    setEditSysNotifMessage(String(p.systemNotification?.message || ''));
    setEditSysNotifVariant(String(p.systemNotification?.variant || 'info'));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setSaveEditBusy(false);
  };

  const saveEdit = async () => {
    if (!editingId) return;
    const durationDays = Math.floor(Number(editDuration));
    if (!Number.isFinite(durationDays) || durationDays < 1) {
      toast.error('Enter a valid duration in days (1+).');
      return;
    }
    if (editSysNotifEnabled && !String(editSysNotifMessage || '').trim()) {
      toast.error('System notification message is required when enabled.');
      return;
    }
    setSaveEditBusy(true);
    try {
      await patchPromotion(editingId, {
        label: String(editLabel || '').trim(),
        durationDays,
        redeemBy: editRedeemBy ? new Date(editRedeemBy).toISOString() : null,
        active: Boolean(editActive),
        systemNotification: {
          enabled: Boolean(editSysNotifEnabled),
          title: String(editSysNotifTitle || '').trim(),
          message: String(editSysNotifMessage || '').trim(),
          variant: editSysNotifVariant,
        },
      });
      cancelEdit();
    } finally {
      setSaveEditBusy(false);
    }
  };

  const sendEmails = async (promotionId) => {
    const ids = [...selectedIds];
    if (!ids.length) {
      toast.error('Select at least one user.');
      return;
    }
    setSending(true);
    try {
      const res = await adminAPI.sendPromotionEmail(promotionId, {
        userIds: ids,
        subject: emailSubject.trim(),
        body: emailBody.trim(),
      });
      toast.success(res.data?.message || 'Sent.');
      setSelectedIds(new Set());
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Send failed.');
    } finally {
      setSending(false);
    }
  };

  const loadHistory = async (promoId) => {
    setHistoryLoading(true);
    try {
      const res = await adminAPI.promotionHistory(promoId);
      setHistoryData(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Could not load history.');
      setHistoryData([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleDeactivate = (promo) => {
    setDeactivateTarget(promo);
    setDeactivateModalOpen(true);
    setExpandedId(null);
  };

  const confirmDeactivate = async () => {
    if (!deactivateTarget) return;
    const newActive = !deactivateTarget.active;
    try {
      await patchPromotion(deactivateTarget._id, { active: newActive });
      setDeactivateModalOpen(false);
      setDeactivateTarget(null);
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Could not update promotion.');
    }
  };

  const expandedPromo = useMemo(
    () => promotions.find((p) => String(p._id) === String(expandedId)),
    [promotions, expandedId]
  );

  return (
    <div className="space-y-8" data-testid="admin-promotions-tab">
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <Tag className="h-5 w-5 text-spruce-700" aria-hidden />
          <h2 className="font-heading text-lg font-semibold text-slate-900">Create promotion</h2>
        </div>
        <p className="text-sm text-slate-500">
          Codes grant <strong className="font-medium text-slate-700">Standard</strong> membership for the number of
          days you set, starting when the user applies the code on their profile. Leave code blank to auto-generate.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="promo-label">Label (internal)</Label>
            <Input
              id="promo-label"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="Spring vendor offer"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="promo-code">Code (optional)</Label>
            <Input
              id="promo-code"
              value={newCode}
              onChange={(e) => setNewCode(e.target.value.toUpperCase())}
              placeholder="Auto if empty"
              className="font-mono uppercase"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="promo-duration">Duration (days)</Label>
            <Input
              id="promo-duration"
              type="number"
              min={1}
              max={3650}
              value={newDuration}
              onChange={(e) => setNewDuration(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="promo-redeem-by">Redeem by (optional)</Label>
            <Input
              id="promo-redeem-by"
              type="datetime-local"
              value={newRedeemBy}
              onChange={(e) => setNewRedeemBy(e.target.value)}
            />
            <p className="text-[11px] text-slate-500">After this moment, new redemptions are blocked.</p>
          </div>
        </div>

        <div className="rounded-lg border border-slate-100 p-4 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900">System notification (optional)</p>
              <p className="text-xs text-slate-500">
                If enabled, this promotion can also post a banner at the top of the navbar.
              </p>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300"
                checked={newSysNotifEnabled}
                onChange={(e) => setNewSysNotifEnabled(e.target.checked)}
              />
              Show
            </label>
          </div>
          {newSysNotifEnabled ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="promo-sysnotif-title">Title (optional)</Label>
                <Input
                  id="promo-sysnotif-title"
                  value={newSysNotifTitle}
                  onChange={(e) => setNewSysNotifTitle(e.target.value)}
                  placeholder="Great opportunity"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="promo-sysnotif-variant">Variant</Label>
                <select
                  id="promo-sysnotif-variant"
                  value={newSysNotifVariant}
                  onChange={(e) => setNewSysNotifVariant(e.target.value)}
                  className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
                >
                  <option value="info">Info</option>
                  <option value="warning">Warning</option>
                  <option value="danger">Danger</option>
                </select>
              </div>
              <div className="sm:col-span-2 space-y-2">
                <Label htmlFor="promo-sysnotif-message">Banner message</Label>
                <Textarea
                  id="promo-sysnotif-message"
                  value={newSysNotifMessage}
                  onChange={(e) => setNewSysNotifMessage(e.target.value)}
                  placeholder="New promotion period"
                  className="min-h-[80px]"
                />
              </div>
            </div>
          ) : null}
        </div>
        <Button
          type="button"
          onClick={createPromotion}
          disabled={creating}
          className="bg-spruce-700 hover:bg-spruce-800 gap-2"
          data-testid="admin-promo-create"
        >
          {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Create promotion
        </Button>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <h2 className="font-heading text-lg font-semibold text-slate-900">Promotions</h2>
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-spruce-800" />
          </div>
        ) : promotions.length === 0 ? (
          <p className="text-sm text-slate-500">No promotions yet.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {promotions.map((p) => (
              <li key={p._id} className="py-4 first:pt-0">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-sm font-semibold text-slate-900">{p.code}</p>
                    {p.label ? <p className="text-xs text-slate-500">{p.label}</p> : null}
                    <p className="mt-1 text-xs text-slate-600">
                      {p.durationDays} days Standard ·{' '}
                      {p.active ? <span className="text-emerald-700">Active</span> : <span className="text-slate-400">Inactive</span>}
                      {p.redeemBy ? (
                        <>
                          {' '}
                          · Redeem by {new Date(p.redeemBy).toLocaleString()}
                        </>
                      ) : null}
                      {p.systemNotification?.enabled ? (
                        <>
                          {' '}
                          ·{' '}
                          <span className="inline-flex items-center gap-1 text-emerald-700">
                            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                            Navbar banner
                          </span>
                        </>
                      ) : null}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="gap-1"
                      onClick={() => {
                        beginEdit(p);
                        setExpandedId(null);
                      }}
                      data-testid={`admin-promo-edit-${p.code}`}
                    >
                      <Pencil className="h-3.5 w-3.5" aria-hidden />
                      Edit
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="gap-1 border-rose-200 text-rose-700 hover:bg-rose-50"
                      onClick={() => {
                        setDeleteTarget(p);
                        setDeleteModalOpen(true);
                        setExpandedId(null);
                      }}
                      data-testid={`admin-promo-delete-${p.code}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden />
                      Delete
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        handleDeactivate(p);
                      }}
                    >
                      {p.active ? 'Deactivate' : 'Activate'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="gap-1"
                      onClick={() => {
                        setHistoryTarget(p);
                        setHistoryModalOpen(true);
                        loadHistory(p._id);
                        setExpandedId(null);
                      }}
                      data-testid={`admin-promo-history-${p.code}`}
                    >
                      <Clock className="h-3.5 w-3.5" aria-hidden />
                      History
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="gap-1"
                      onClick={() => {
                        setExpandedId((id) => (String(id) === String(p._id) ? null : p._id));
                        setSelectedIds(new Set());
                      }}
                      data-testid={`admin-promo-email-toggle-${p.code}`}
                    >
                      <Mail className="h-3.5 w-3.5" aria-hidden />
                      Email users
                    </Button>
                  </div>
                </div>

                {expandedId && String(expandedId) === String(p._id) ? (
                  <div className="mt-4 space-y-4 rounded-lg border border-slate-100 p-4">
                    <div className="space-y-2">
                      <Label htmlFor={`promo-email-subj-${p._id}`}>Email subject</Label>
                      <Input
                        ref={subjectRef}
                        id={`promo-email-subj-${p._id}`}
                        value={emailSubject}
                        onChange={(e) => setEmailSubject(e.target.value)}
                      />
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="text-xs h-8"
                          onClick={() =>
                            insertAtCaret(subjectRef.current, emailSubject, PLACEHOLDER_NAME, setEmailSubject)
                          }
                        >
                          Add name
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="text-xs h-8"
                          onClick={() =>
                            insertAtCaret(subjectRef.current, emailSubject, PLACEHOLDER_CODE, setEmailSubject)
                          }
                        >
                          Add code
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`promo-email-body-${p._id}`}>Email body (plain text)</Label>
                      <Textarea
                        ref={bodyRef}
                        id={`promo-email-body-${p._id}`}
                        value={emailBody}
                        onChange={(e) => setEmailBody(e.target.value)}
                        className="min-h-[250px] font-mono text-xs"
                      />
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="text-xs h-8"
                          onClick={() =>
                            insertAtCaret(bodyRef.current, emailBody, PLACEHOLDER_NAME, setEmailBody)
                          }
                        >
                          Add name
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="text-xs h-8"
                          onClick={() =>
                            insertAtCaret(bodyRef.current, emailBody, PLACEHOLDER_CODE, setEmailBody)
                          }
                        >
                          Add code
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="text-xs h-8"
                          onClick={() =>
                            insertAtCaret(bodyRef.current, emailBody, PLACEHOLDER_DURATION, setEmailBody)
                          }
                        >
                          Add duration
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="text-xs h-8"
                          onClick={() =>
                            insertAtCaret(bodyRef.current, emailBody, PLACEHOLDER_URL, setEmailBody)
                          }
                        >
                          Add redeem URL
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex flex-wrap items-end gap-2">
                        <div className="min-w-[12rem] flex-1 space-y-1">
                          <Label htmlFor="promo-user-search">Find users</Label>
                          <Input
                            id="promo-user-search"
                            value={userSearch}
                            onChange={(e) => setUserSearch(e.target.value)}
                            placeholder="Name or email"
                          />
                        </div>
                        <Button type="button" variant="outline" size="sm" onClick={() => loadUsers()}>
                          Refresh list
                        </Button>
                      </div>
                      <div className="max-h-48 overflow-y-auto rounded-md border border-slate-200 bg-white p-2">
                        {usersLoading ? (
                          <div className="flex justify-center py-6">
                            <Loader2 className="h-6 w-6 animate-spin text-spruce-700" />
                          </div>
                        ) : (
                          <ul className="space-y-1">
                            {users.map((u) => {
                              const id = String(u._id);
                              return (
                                <li key={id}>
                                  <label className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-slate-50">
                                    <input
                                      type="checkbox"
                                      checked={selectedIds.has(id)}
                                      onChange={() => toggleUser(id)}
                                      className="rounded border-slate-300"
                                    />
                                    <span className="min-w-0 flex-1 truncate">
                                      <span className="font-medium text-slate-800">{u.name}</span>{' '}
                                      <span className="text-slate-500">{u.email}</span>
                                    </span>
                                  </label>
                                </li>
                              );
                            })}
                          </ul>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500">{selectedIds.size} selected</p>
                    </div>

                    <Button
                      type="button"
                      disabled={sending || !expandedPromo}
                      onClick={() => sendEmails(p._id)}
                      className="bg-spruce-700 hover:bg-spruce-800 gap-2"
                      data-testid="admin-promo-send-email"
                    >
                      {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      Send emails
                    </Button>
                  </div>
                ) : null}

                {editingId && String(editingId) === String(p._id) ? (
                  <div className="mt-4 space-y-4 rounded-lg border border-spruce-200 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-sm font-semibold text-slate-900">Edit promotion</h3>
                      <div className="flex gap-2">
                        <Button type="button" size="sm" variant="outline" onClick={cancelEdit} disabled={saveEditBusy}>
                          Cancel
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          className="bg-spruce-700 hover:bg-spruce-800"
                          onClick={saveEdit}
                          disabled={saveEditBusy}
                        >
                          {saveEditBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
                        </Button>
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Label (internal)</Label>
                        <Input value={editLabel} onChange={(e) => setEditLabel(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Duration (days)</Label>
                        <Input
                          type="number"
                          min={1}
                          max={3650}
                          value={editDuration}
                          onChange={(e) => setEditDuration(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Redeem by (optional)</Label>
                        <Input
                          type="datetime-local"
                          value={editRedeemBy}
                          onChange={(e) => setEditRedeemBy(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Active</Label>
                        <select
                          value={editActive ? 'yes' : 'no'}
                          onChange={(e) => setEditActive(e.target.value === 'yes')}
                          className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
                        >
                          <option value="yes">Yes</option>
                          <option value="no">No</option>
                        </select>
                      </div>
                    </div>

                    <div className="rounded-lg border border-slate-100 bg-white p-4 space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900">System notification</p>
                          <p className="text-xs text-slate-500">Show this promotion in the top navbar banner.</p>
                        </div>
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-slate-300"
                            checked={editSysNotifEnabled}
                            onChange={(e) => setEditSysNotifEnabled(e.target.checked)}
                          />
                          Show
                        </label>
                      </div>
                      {editSysNotifEnabled ? (
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="space-y-2">
                            <Label>Title (optional)</Label>
                            <Input
                              value={editSysNotifTitle}
                              onChange={(e) => setEditSysNotifTitle(e.target.value)}
                              placeholder="Great opportunity"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Variant</Label>
                            <select
                              value={editSysNotifVariant}
                              onChange={(e) => setEditSysNotifVariant(e.target.value)}
                              className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
                            >
                              <option value="info">Info</option>
                              <option value="warning">Warning</option>
                              <option value="danger">Danger</option>
                            </select>
                          </div>
                          <div className="sm:col-span-2 space-y-2">
                            <Label>Banner message</Label>
                            <Textarea
                              value={editSysNotifMessage}
                              onChange={(e) => setEditSysNotifMessage(e.target.value)}
                              className="min-h-[80px]"
                            />
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>

      <ConfirmActionModal
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        variant="danger"
        title="Delete promotion?"
        description={
          <span>
            This will permanently delete{' '}
            <strong className="font-semibold text-slate-900">{deleteTarget?.code || 'this promotion'}</strong> and remove
            its linked system notification (if any).
          </span>
        }
        icon={Trash2}
        confirmLabel="Delete"
        loading={creating}
        onConfirm={async () => {
          if (!deleteTarget?._id) return;
          try {
            await adminAPI.deletePromotion(deleteTarget._id);
            toast.success('Promotion deleted.');
            setPromotions((prev) => prev.filter((p) => String(p._id) !== String(deleteTarget._id)));
            if (String(editingId) === String(deleteTarget._id)) cancelEdit();
            setDeleteModalOpen(false);
            setDeleteTarget(null);
            try {
              window.dispatchEvent(new Event('system-notification-updated'));
            } catch {
              /* ignore */
            }
          } catch (e) {
            toast.error(e?.response?.data?.message || 'Could not delete promotion.');
          }
        }}
      />

      <ConfirmActionModal
        open={deactivateModalOpen}
        onOpenChange={setDeactivateModalOpen}
        variant="warning"
        title={deactivateTarget?.active ? 'Deactivate promotion?' : 'Activate promotion?'}
        description={
          <span>
            {deactivateTarget?.active
              ? `This will deactivate ${deactivateTarget?.code || 'this promotion'} and prevent new code redemptions.`
              : `This will activate ${deactivateTarget?.code || 'this promotion'} and allow code redemptions.`}
          </span>
        }
        confirmLabel={deactivateTarget?.active ? 'Deactivate' : 'Activate'}
        loading={creating}
        onConfirm={confirmDeactivate}
      />

      <ConfirmActionModal
        open={historyModalOpen}
        onOpenChange={setHistoryModalOpen}
        title={`Promotion History: ${historyTarget?.code}`}
        description=""
        confirmLabel="Close"
        onConfirm={() => setHistoryModalOpen(false)}
      >
        <div className="mt-4 space-y-4">
          {historyLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-spruce-800" />
            </div>
          ) : historyData.length === 0 ? (
            <p className="text-sm text-slate-500">No redemption history yet.</p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {historyData.map((item, idx) => (
                <div key={idx} className="border border-slate-200 rounded-lg p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-sm text-slate-900">{item.userName || 'Unknown user'}</p>
                      <p className="text-xs text-slate-500">{item.userEmail}</p>
                    </div>
                    <div className="text-right">
                      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold ${
                        item.redeemedAt
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {item.redeemedAt ? (
                          <>
                            <CheckCircle2 className="w-3 h-3" aria-hidden />
                            Applied
                          </>
                        ) : (
                          'Sent'
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-slate-600 space-y-1">
                    <p>Sent: {new Date(item.sentAt).toLocaleString()}</p>
                    {item.redeemedAt && (
                      <p>Applied: {new Date(item.redeemedAt).toLocaleString()}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </ConfirmActionModal>
    </div>
  );
}
