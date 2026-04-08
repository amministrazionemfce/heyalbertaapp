import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Loader2, Save, Download, Wrench, CheckCircle2, Trash2, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';

import { adminAPI } from '../../lib/api';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import ConfirmActionModal from '../../components/ConfirmActionModal';
import {
  DEFAULT_EMAIL_VERIFICATION_BODY,
  DEFAULT_EMAIL_VERIFICATION_SUBJECT,
  effectiveEmailVerificationBody,
  effectiveEmailVerificationSubject,
} from '../../constants/emailVerificationDefaults';
import AdminPromotionsTab from './AdminPromotionsTab';

const PLACEHOLDER_NAME = '{{name}}';
const PLACEHOLDER_VERIFY_URL = '{{verifyUrl}}';

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

const TABS = [
  { id: 'emails', label: 'Emails' },
  { id: 'system-notification', label: 'System notification' },
  { id: 'promotions', label: 'Promotions' },
  { id: 'theme', label: 'Theme' },
  { id: 'backup', label: 'Backup' },
  { id: 'maintenance', label: 'Maintenance' },
];

export function AdminGeneralSection({ onUpdate }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const activeTab = TABS.some((t) => t.id === tabParam) ? tabParam : 'emails';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState(null);

  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');

  const [reviewNotifSubject, setReviewNotifSubject] = useState('');
  const [reviewNotifBody, setReviewNotifBody] = useState('');

  const [expandedEmailSection, setExpandedEmailSection] = useState('verification');

  const [backupPassword, setBackupPassword] = useState('');
  const [backupBusy, setBackupBusy] = useState(false);

  const [maintPassword, setMaintPassword] = useState('');
  const [maintMessage, setMaintMessage] = useState('');
  const [maintBusy, setMaintBusy] = useState(false);

  const [themeColors, setThemeColors] = useState({
    primary: '#16a34a',
    primaryDark: '#166534',
    accent: '#ea580c',
    text: '#1e293b',
    border: '#e2e8f0',
  });
  const [themeDirty, setThemeDirty] = useState(false);
  const [themeSaving, setThemeSaving] = useState(false);

  const [notifLoading, setNotifLoading] = useState(false);
  const [notifs, setNotifs] = useState([]);
  const [notifDraft, setNotifDraft] = useState({
    id: null,
    title: '',
    message: '',
    variant: 'info',
    enabled: true,
    startsAt: '',
    endsAt: '',
  });
  const [notifSaving, setNotifSaving] = useState(false);
  const [deleteNotifModalOpen, setDeleteNotifModalOpen] = useState(false);
  const [deleteNotifTarget, setDeleteNotifTarget] = useState(null);

  const subjectInputRef = useRef(null);
  const bodyTextareaRef = useRef(null);

  const loadNotifications = async () => {
    setNotifLoading(true);
    try {
      const res = await adminAPI.systemNotifications();
      setNotifs(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Could not load system notifications.');
    } finally {
      setNotifLoading(false);
    }
  };

  const load = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.siteSettings();
      const s = res.data || {};
      setSettings(s);
      setEmailSubject(effectiveEmailVerificationSubject(s));
      setEmailBody(effectiveEmailVerificationBody(s));
      setReviewNotifSubject(String(s.reviewNotificationEmailSubject || '').trim());
      setReviewNotifBody(String(s.reviewNotificationEmailBody || '').trim());
      setMaintMessage(String(s.maintenanceMessage || '').trim());
      if (s.themeColors) {
        setThemeColors(s.themeColors);
      }
    } catch {
      toast.error('Could not load general settings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (activeTab !== 'system-notification') return;
    loadNotifications();
  }, [activeTab]);

  const setTab = (id) => {
    setSearchParams({ section: 'general', tab: id }, { replace: true });
  };

  const dirty = useMemo(() => {
    if (!settings) return false;
    return (
      effectiveEmailVerificationSubject(settings) !== String(emailSubject || '').trim() ||
      effectiveEmailVerificationBody(settings) !== String(emailBody || '').trim() ||
      String(settings.reviewNotificationEmailSubject || '').trim() !== String(reviewNotifSubject || '').trim() ||
      String(settings.reviewNotificationEmailBody || '').trim() !== String(reviewNotifBody || '').trim()
    );
  }, [settings, emailSubject, emailBody, reviewNotifSubject, reviewNotifBody]);

  const save = async () => {
    setSaving(true);
    try {
      const payload = {
        emailVerificationEmailSubject: String(emailSubject || ''),
        emailVerificationEmailBody: String(emailBody || ''),
        reviewNotificationEmailSubject: String(reviewNotifSubject || ''),
        reviewNotificationEmailBody: String(reviewNotifBody || ''),
      };
      const res = await adminAPI.updateSiteSettings(payload);
      setSettings(res.data || { ...settings, ...payload });
      toast.success('Saved.');
      onUpdate?.();
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Could not save settings.');
    } finally {
      setSaving(false);
    }
  };

  const downloadBackup = async () => {
    const pw = String(backupPassword || '').trim();
    if (!pw) {
      toast.error('Enter your admin password to download a backup.');
      return;
    }
    setBackupBusy(true);
    try {
      const res = await adminAPI.downloadMongoBackup({ adminPassword: pw });
      let filename = `hey-alberta-mongodb-backup-${Date.now()}.json`;
      const dispo = res.headers['content-disposition'];
      if (dispo && /filename=/i.test(dispo)) {
        const m = dispo.match(/filename\*?=(?:UTF-8'')?["']?([^"';]+)["']?/i);
        if (m?.[1]) filename = decodeURIComponent(m[1].trim());
      }
      const blob = new Blob([res.data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Backup downloaded.');
      setBackupPassword('');
    } catch (e) {
      const data = e?.response?.data;
      if (data instanceof Blob) {
        try {
          const text = await data.text();
          const j = JSON.parse(text);
          toast.error(j.message || 'Backup failed.');
        } catch {
          toast.error('Backup failed.');
        }
      } else {
        toast.error(e?.response?.data?.message || 'Backup failed.');
      }
    } finally {
      setBackupBusy(false);
    }
  };

  const setMaintenance = async (enabled) => {
    const pw = String(maintPassword || '').trim();
    if (!pw) {
      toast.error('Enter your admin password.');
      return;
    }
    setMaintBusy(true);
    try {
      const res = await adminAPI.setMaintenanceMode({
        adminPassword: pw,
        maintenanceMode: enabled,
        maintenanceMessage: enabled ? String(maintMessage || '').trim() : undefined,
      });
      const next = res.data || {};
      setSettings((prev) => ({ ...(prev || {}), ...next }));
      if (!enabled) setMaintMessage('');
      else if (next.maintenanceMessage) setMaintMessage(next.maintenanceMessage);
      toast.success(enabled ? 'Maintenance mode is on.' : 'Maintenance mode is off.');
      setMaintPassword('');
      onUpdate?.();
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Could not update maintenance mode.');
    } finally {
      setMaintBusy(false);
    }
  };

  const saveTheme = async () => {
    setThemeSaving(true);
    try {
      const payload = {
        themeColors: themeColors,
      };
      const res = await adminAPI.updateSiteSettings(payload);
      setSettings(res.data || { ...settings, ...payload });
      setThemeDirty(false);
      toast.success('Theme saved.');
      onUpdate?.();
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Could not save theme.');
    } finally {
      setThemeSaving(false);
    }
  };

  const handleThemeColorChange = (key, value) => {
    setThemeColors((prev) => ({ ...prev, [key]: value }));
    setThemeDirty(true);
  };

  return (
    <div className="space-y-6" data-testid="admin-general-section">
      <div className="flex flex-wrap gap-2 pb-3">
        {TABS.map(({ id, label }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-spruce-800 text-white shadow-sm'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
              data-testid={`admin-general-tab-${id}`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {loading && activeTab !== 'promotions' && activeTab !== 'emails' ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-spruce-800" />
        </div>
      ) : null}

      {activeTab === 'promotions' && <AdminPromotionsTab />}

      {activeTab === 'theme' ? (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-5">
          <div>
            <h2 className="font-heading text-lg font-semibold text-slate-900">System color theme</h2>
            <p className="text-sm text-slate-500 mt-1">
              Customize the system colors used throughout the platform.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
              { key: 'primary', label: 'Primary Color' },
              { key: 'primaryDark', label: 'Primary Dark' },
              { key: 'accent', label: 'Accent Color' },
              { key: 'text', label: 'Text Color' },
              { key: 'border', label: 'Border Color' },
            ].map(({ key, label }) => (
              <div key={key} className="space-y-2">
                <Label htmlFor={`theme-${key}`}>{label}</Label>
                <div className="flex gap-2">
                  <input
                    id={`theme-${key}`}
                    type="color"
                    value={themeColors[key]}
                    onChange={(e) => handleThemeColorChange(key, e.target.value)}
                    className="h-10 w-14 rounded-md border border-slate-200 cursor-pointer"
                    data-testid={`admin-theme-color-${key}`}
                  />
                  <Input
                    type="text"
                    value={themeColors[key]}
                    onChange={(e) => handleThemeColorChange(key, e.target.value)}
                    placeholder="#000000"
                    className="flex-1"
                    data-testid={`admin-theme-input-${key}`}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setThemeColors({
                  primary: '#16a34a',
                  primaryDark: '#166534',
                  accent: '#ea580c',
                  text: '#1e293b',
                  border: '#e2e8f0',
                });
                setThemeDirty(false);
              }}
              disabled={themeSaving}
              data-testid="admin-theme-reset"
            >
              Reset to defaults
            </Button>
            <Button
              type="button"
              onClick={saveTheme}
              disabled={!themeDirty || themeSaving}
              className="bg-spruce-700 hover:bg-spruce-800 gap-2"
              data-testid="admin-theme-save"
            >
              {themeSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save theme
            </Button>
          </div>
        </div>
      ) : null}
      {activeTab === 'system-notification' && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-5">
          <div>
            <h2 className="font-heading text-lg font-semibold text-slate-900">System notification</h2>
            <p className="text-sm text-slate-500 mt-1">
              This message appears at the top of the public site navigation bar.
            </p>
          </div>

          {notifLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-7 h-7 animate-spin text-spruce-800" />
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-lg border border-slate-100 p-4 space-y-3">
                <h3 className="text-sm font-semibold text-slate-900">
                  {notifDraft.id ? 'Edit notification' : 'New notification'}
                </h3>
                <div className="space-y-2">
                  <Label htmlFor="sysnotif-title">Title (optional)</Label>
                  <Input
                    id="sysnotif-title"
                    value={notifDraft.title}
                    onChange={(e) => setNotifDraft((p) => ({ ...p, title: e.target.value }))}
                    placeholder="Short heading"
                    data-testid="admin-sysnotif-title"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sysnotif-message">Message</Label>
                  <Textarea
                    id="sysnotif-message"
                    value={notifDraft.message}
                    onChange={(e) => setNotifDraft((p) => ({ ...p, message: e.target.value }))}
                    placeholder="What do you want everyone to see?"
                    className="min-h-[110px]"
                    data-testid="admin-sysnotif-message"
                  />
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="sysnotif-variant">Variant</Label>
                    <select
                      id="sysnotif-variant"
                      value={notifDraft.variant}
                      onChange={(e) => setNotifDraft((p) => ({ ...p, variant: e.target.value }))}
                      className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
                      data-testid="admin-sysnotif-variant"
                    >
                      <option value="info">Info</option>
                      <option value="warning">Warning</option>
                      <option value="danger">Danger</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sysnotif-enabled">Enabled</Label>
                    <select
                      id="sysnotif-enabled"
                      value={notifDraft.enabled ? 'yes' : 'no'}
                      onChange={(e) => setNotifDraft((p) => ({ ...p, enabled: e.target.value === 'yes' }))}
                      className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
                      data-testid="admin-sysnotif-enabled"
                    >
                      <option value="yes">Yes</option>
                      <option value="no">No</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="sysnotif-start">Starts at (optional)</Label>
                    <Input
                      id="sysnotif-start"
                      type="datetime-local"
                      value={notifDraft.startsAt}
                      onChange={(e) => setNotifDraft((p) => ({ ...p, startsAt: e.target.value }))}
                      data-testid="admin-sysnotif-start"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sysnotif-end">Ends at (optional)</Label>
                    <Input
                      id="sysnotif-end"
                      type="datetime-local"
                      value={notifDraft.endsAt}
                      onChange={(e) => setNotifDraft((p) => ({ ...p, endsAt: e.target.value }))}
                      data-testid="admin-sysnotif-end"
                    />
                  </div>
                </div>
                <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={notifSaving}
                    onClick={() =>
                      setNotifDraft({
                        id: null,
                        title: '',
                        message: '',
                        variant: 'info',
                        enabled: true,
                        startsAt: '',
                        endsAt: '',
                      })
                    }
                    data-testid="admin-sysnotif-clear"
                  >
                    Clear
                  </Button>
                  <Button
                    type="button"
                    disabled={notifSaving}
                    className="bg-spruce-700 hover:bg-spruce-800 gap-2"
                    onClick={async () => {
                      const msg = String(notifDraft.message || '').trim();
                      if (!msg) {
                        toast.error('Message is required.');
                        return;
                      }
                      setNotifSaving(true);
                      try {
                        const payload = {
                          title: String(notifDraft.title || '').trim(),
                          message: msg,
                          variant: notifDraft.variant,
                          enabled: Boolean(notifDraft.enabled),
                          startsAt: notifDraft.startsAt ? new Date(notifDraft.startsAt).toISOString() : null,
                          endsAt: notifDraft.endsAt ? new Date(notifDraft.endsAt).toISOString() : null,
                        };
                        if (notifDraft.id) {
                          await adminAPI.updateSystemNotification(notifDraft.id, payload);
                          toast.success('Notification updated.');
                        } else {
                          await adminAPI.createSystemNotification(payload);
                          toast.success('Notification created.');
                        }
                        await loadNotifications();
                        onUpdate?.();
                        try {
                          window.dispatchEvent(new Event('system-notification-updated'));
                        } catch {
                          /* ignore */
                        }
                      } catch (e) {
                        toast.error(e?.response?.data?.message || 'Could not save notification.');
                      } finally {
                        setNotifSaving(false);
                      }
                    }}
                    data-testid="admin-sysnotif-save"
                  >
                    {notifSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save
                  </Button>
                </div>
              </div>

              <div className="rounded-lg border border-slate-100 p-4">
                <h3 className="text-sm font-semibold text-slate-900 mb-3">Existing</h3>
                {notifs.length === 0 ? (
                  <p className="text-sm text-slate-500">No notifications yet.</p>
                ) : (
                  <div className="space-y-3">
                    {notifs.map((n) => {
                      const title = String(n.title || '').trim();
                      const msg = String(n.message || '').trim();
                      const nid = n.id || n._id || null;
                      const isEditing = Boolean(nid && notifDraft.id && String(nid) === String(notifDraft.id));
                      return (
                        <div
                          key={nid}
                          className={`rounded-lg border p-3 transition-colors ${
                            isEditing
                              ? 'border-spruce-300 bg-spruce-50/50 ring-2 ring-spruce-100'
                              : 'border-slate-200 bg-white hover:bg-slate-50/60'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                <span className="inline-flex items-center gap-1.5">
                                  {n.enabled ? (
                                    <>
                                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" aria-hidden />
                                      Enabled
                                    </>
                                  ) : (
                                    'Disabled'
                                  )}
                                </span>{' '}
                                • {String(n.variant || 'info')}
                              </p>
                              {title ? (
                                <p className="mt-1 font-semibold text-slate-900 truncate">{title}</p>
                              ) : null}
                              <p className="mt-1 text-sm text-slate-700 break-words">{msg}</p>
                            </div>
                            <div className="flex shrink-0 flex-col gap-2">
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  setNotifDraft({
                                    id: nid,
                                    title: title,
                                    message: msg,
                                    variant: String(n.variant || 'info'),
                                    enabled: Boolean(n.enabled),
                                    startsAt: n.startsAt ? String(n.startsAt).slice(0, 16) : '',
                                    endsAt: n.endsAt ? String(n.endsAt).slice(0, 16) : '',
                                  })
                                }
                                data-testid={`admin-sysnotif-edit-${n.id || n._id}`}
                              >
                                Edit
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="border-rose-200 text-rose-700 hover:bg-rose-50"
                                onClick={async () => {
                                  if (!nid) return;
                                  setDeleteNotifTarget({ id: nid, title, message: msg });
                                  setDeleteNotifModalOpen(true);
                                }}
                                data-testid={`admin-sysnotif-delete-${n.id || n._id}`}
                              >
                                Delete
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
      <ConfirmActionModal
        open={deleteNotifModalOpen}
        onOpenChange={setDeleteNotifModalOpen}
        variant="danger"
        title="Delete system notification?"
        description={
          <span>
            This will permanently remove the notification{deleteNotifTarget?.title ? (
              <>
                {' '}
                <strong className="font-semibold text-slate-900">{deleteNotifTarget.title}</strong>
              </>
            ) : null}
            .
          </span>
        }
        icon={Trash2}
        confirmLabel="Delete"
        loading={notifSaving}
        onConfirm={async () => {
          if (!deleteNotifTarget?.id) return;
          setNotifSaving(true);
          try {
            await adminAPI.deleteSystemNotification(deleteNotifTarget.id);
            toast.success('Notification deleted.');
            setDeleteNotifModalOpen(false);
            setDeleteNotifTarget(null);
            await loadNotifications();
            onUpdate?.();
            try {
              window.dispatchEvent(new Event('system-notification-updated'));
            } catch {
              /* ignore */
            }
          } catch (e) {
            toast.error(e?.response?.data?.message || 'Could not delete notification.');
          } finally {
            setNotifSaving(false);
          }
        }}
      />

      {!loading && activeTab === 'emails' && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <div>
            <h2 className="font-heading text-lg font-semibold text-slate-900">Email templates</h2>
            <p className="text-sm text-slate-500 mt-1">
              Customize transactional email content sent to users and vendors.
            </p>
          </div>

          {/* Email verification accordion */}
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() =>
                setExpandedEmailSection(expandedEmailSection === 'verification' ? null : 'verification')
              }
              className="w-full flex items-center justify-between p-4 bg-spruce-700 hover:bg-spruce-700 text-white transition-colors"
              data-testid="admin-email-verify-toggle"
            >
              <span className="font-semibold text-white">Verification email</span>
              <ChevronDown
                className={`w-5 h-5 text-white transition-transform ${
                  expandedEmailSection === 'verification' ? 'rotate-180' : ''
                }`}
                aria-hidden
              />
            </button>
            {expandedEmailSection === 'verification' && (
              <div className="border-t border-slate-200 p-4 space-y-4">
                <p className="text-sm text-slate-600">
                  Write your email in plain language. Use the buttons below to drop in the person&apos;s name and the
                  verification link where you want them to appear—no need to type any codes yourself.
                </p>

                <div className="space-y-2">
                  <Label htmlFor="admin-email-verify-subject">Email subject</Label>
                  <Input
                    ref={subjectInputRef}
                    id="admin-email-verify-subject"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    placeholder="Verify your email"
                    data-testid="admin-email-verify-subject"
                  />
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span className="text-xs text-slate-500 w-full sm:w-auto">Subject line:</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-xs h-8"
                      onClick={() =>
                        insertAtCaret(subjectInputRef.current, emailSubject, PLACEHOLDER_NAME, setEmailSubject)
                      }
                      data-testid="admin-email-insert-name-subject"
                    >
                      Add recipient name
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="admin-email-verify-body">Email body (text)</Label>
                  <Textarea
                    ref={bodyTextareaRef}
                    id="admin-email-verify-body"
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                    placeholder="Click the link below to verify your email..."
                    className="min-h-[180px] font-mono text-xs"
                    data-testid="admin-email-verify-body"
                  />
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-xs h-8"
                      onClick={() =>
                        insertAtCaret(bodyTextareaRef.current, emailBody, PLACEHOLDER_NAME, setEmailBody)
                      }
                      data-testid="admin-email-insert-name-body"
                    >
                      Add recipient name
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-xs h-8"
                      onClick={() =>
                        insertAtCaret(bodyTextareaRef.current, emailBody, PLACEHOLDER_VERIFY_URL, setEmailBody)
                      }
                      data-testid="admin-email-insert-verify-url"
                    >
                      Add verification link
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Review notification accordion */}
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() =>
                setExpandedEmailSection(expandedEmailSection === 'review' ? null : 'review')
              }
              className="w-full flex items-center justify-between p-4 bg-spruce-700 hover:bg-spruce-700 transition-colors"
              data-testid="admin-email-review-toggle"
            >
              <span className="font-semibold text-white">Review notification email</span>
              <ChevronDown
                className={`w-5 h-5 text-white transition-transform ${
                  expandedEmailSection === 'review' ? 'rotate-180' : ''
                }`}
                aria-hidden
              />
            </button>
            {expandedEmailSection === 'review' && (
              <div className="border-t border-slate-200 p-4 space-y-4">
                <p className="text-sm text-slate-600">
                  Email sent to vendors when their listing receives a new review. Customize the notification content below.
                </p>

                <div className="space-y-2">
                  <Label htmlFor="admin-email-review-subject">Email subject</Label>
                  <Input
                    id="admin-email-review-subject"
                    value={reviewNotifSubject}
                    onChange={(e) => setReviewNotifSubject(e.target.value)}
                    placeholder="You received a new review"
                    data-testid="admin-email-review-subject"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="admin-email-review-body">Email body (text)</Label>
                  <Textarea
                    id="admin-email-review-body"
                    value={reviewNotifBody}
                    onChange={(e) => setReviewNotifBody(e.target.value)}
                    placeholder="Someone left a review on your listing..."
                    className="min-h-[180px] font-mono text-xs"
                    data-testid="admin-email-review-body"
                  />
                  <p className="text-xs text-slate-500 pt-1">
                    Available placeholders: {'{'}vendorName{'}'},  {'{'}listingTitle{'}'},  {'{'}reviewerName{'}'},  {'{'}reviewText{'}'},  {'{'}reviewRating{'}'},  {'{'}listingUrl{'}'}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 pt-4">
            <Button
              type="button"
              onClick={save}
              disabled={!dirty || saving}
              className="bg-spruce-700 hover:bg-spruce-800 gap-2"
              data-testid="admin-emails-save"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save all emails
            </Button>
          </div>
        </div>
      )}

      {!loading && activeTab === 'backup' && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-5">
          <div>
            <h2 className="font-heading text-lg font-semibold text-slate-900 flex items-center gap-2">
              <Download className="w-5 h-5 text-spruce-700" aria-hidden />
              Database backup
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              This app uses <strong className="font-medium text-slate-700">MongoDB</strong>, not SQL. Enter your{' '}
              <strong className="font-medium text-slate-700">admin account password</strong>, then download a JSON
              export of all collections (password hashes in the users collection are redacted).
            </p>
          </div>

          <div className="space-y-2 max-w-md">
            <Label htmlFor="admin-backup-password">Admin password</Label>
            <Input
              id="admin-backup-password"
              type="password"
              autoComplete="off"
              value={backupPassword}
              onChange={(e) => setBackupPassword(e.target.value)}
              placeholder="Your admin login password"
              data-testid="admin-backup-password"
            />
          </div>

          <Button
            type="button"
            onClick={downloadBackup}
            disabled={backupBusy}
            className="bg-spruce-700 hover:bg-spruce-800 gap-2"
            data-testid="admin-backup-download"
          >
            {backupBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Download backup
          </Button>
        </div>
      )}

      {!loading && activeTab === 'maintenance' && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-5">
          <div>
            <h2 className="font-heading text-lg font-semibold text-slate-900 flex items-center gap-2">
              <Wrench className="w-5 h-5 text-spruce-700" aria-hidden />
              Maintenance mode
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Visitors see a maintenance page and most API calls return unavailable.{' '}
              <strong className="font-medium text-slate-700">Admins</strong> can still use the site and this panel to turn
              maintenance off.
            </p>
          </div>

          <div className="rounded-lg border border-slate-100 px-4 py-3 text-sm">
            <p className="text-slate-700">
              Status:{' '}
              <span className={settings?.maintenanceMode ? 'font-semibold text-amber-800' : 'font-semibold text-emerald-800'}>
                {settings?.maintenanceMode ? 'On' : 'Off'}
              </span>
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="admin-maint-message">Message for visitors (optional)</Label>
            <Textarea
              id="admin-maint-message"
              value={maintMessage}
              onChange={(e) => setMaintMessage(e.target.value)}
              placeholder="We are upgrading the site and will be back shortly."
              className="min-h-[100px]"
              data-testid="admin-maint-message"
            />
          </div>

          <div className="space-y-2 max-w-md">
            <Label htmlFor="admin-maint-password">Admin password</Label>
            <Input
              id="admin-maint-password"
              type="password"
              autoComplete="off"
              value={maintPassword}
              onChange={(e) => setMaintPassword(e.target.value)}
              placeholder="Your admin login password"
              data-testid="admin-maint-password"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={maintBusy || Boolean(settings?.maintenanceMode)}
              className="border-amber-200"
              onClick={() => setMaintenance(true)}
              data-testid="admin-maint-enable"
            >
              {maintBusy && settings?.maintenanceMode === false ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Enable maintenance
            </Button>
            {settings?.maintenanceMode ? (
              <Button
                type="button"
                variant="outline"
                disabled={maintBusy}
                className="border-slate-200"
                onClick={() => setMaintenance(true)}
                data-testid="admin-maint-update-message"
              >
                Update visitor message
              </Button>
            ) : null}
            <Button
              type="button"
              disabled={maintBusy || !settings?.maintenanceMode}
              className="bg-spruce-700 hover:bg-spruce-800"
              onClick={() => setMaintenance(false)}
              data-testid="admin-maint-disable"
            >
              {maintBusy && settings?.maintenanceMode ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Disable maintenance
            </Button>
          </div>
        </div>
      )}

    </div>
  );
}
