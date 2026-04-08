import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Loader2, Save, Download, Wrench } from 'lucide-react';
import { toast } from 'sonner';

import { adminAPI } from '../../lib/api';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import {
  DEFAULT_EMAIL_VERIFICATION_BODY,
  DEFAULT_EMAIL_VERIFICATION_SUBJECT,
  effectiveEmailVerificationBody,
  effectiveEmailVerificationSubject,
} from '../../constants/emailVerificationDefaults';

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
  { id: 'email-verification', label: 'Email verification' },
  { id: 'backup', label: 'Backup' },
  { id: 'maintenance', label: 'Maintenance' },
];

export function AdminGeneralSection({ onUpdate }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const activeTab = TABS.some((t) => t.id === tabParam) ? tabParam : 'email-verification';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState(null);

  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');

  const [backupPassword, setBackupPassword] = useState('');
  const [backupBusy, setBackupBusy] = useState(false);

  const [maintPassword, setMaintPassword] = useState('');
  const [maintMessage, setMaintMessage] = useState('');
  const [maintBusy, setMaintBusy] = useState(false);

  const subjectInputRef = useRef(null);
  const bodyTextareaRef = useRef(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.siteSettings();
      const s = res.data || {};
      setSettings(s);
      setEmailSubject(effectiveEmailVerificationSubject(s));
      setEmailBody(effectiveEmailVerificationBody(s));
      setMaintMessage(String(s.maintenanceMessage || '').trim());
    } catch {
      toast.error('Could not load general settings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const setTab = (id) => {
    setSearchParams({ section: 'general', tab: id }, { replace: true });
  };

  const dirty = useMemo(() => {
    if (!settings) return false;
    return (
      effectiveEmailVerificationSubject(settings) !== String(emailSubject || '').trim() ||
      effectiveEmailVerificationBody(settings) !== String(emailBody || '').trim()
    );
  }, [settings, emailSubject, emailBody]);

  const save = async () => {
    setSaving(true);
    try {
      const payload = {
        emailVerificationEmailSubject: String(emailSubject || ''),
        emailVerificationEmailBody: String(emailBody || ''),
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

  return (
    <div className="space-y-6" data-testid="admin-general-section">
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
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

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-spruce-800" />
        </div>
      ) : null}

      {!loading && activeTab === 'email-verification' && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-5">
          <div>
            <h2 className="font-heading text-lg font-semibold text-slate-900">Verification email content</h2>
            <p className="text-sm text-slate-500 mt-1">
              Write your email in plain language. Use the buttons below to drop in the person&apos;s name and the
              verification link where you want them to appear—no need to type any codes yourself.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="admin-email-verify-subject">Email subject</Label>
            <Input
              ref={subjectInputRef}
              id="admin-email-verify-subject"
              value={emailSubject}
              onChange={(e) => setEmailSubject(e.target.value)}
              placeholder={DEFAULT_EMAIL_VERIFICATION_SUBJECT}
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
              placeholder={DEFAULT_EMAIL_VERIFICATION_BODY}
              className="min-h-[220px] font-mono text-xs"
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
                  insertAtCaret(
                    bodyTextareaRef.current,
                    emailBody,
                    PLACEHOLDER_VERIFY_URL,
                    setEmailBody
                  )
                }
                data-testid="admin-email-insert-verify-url"
              >
                Add verification link
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              onClick={save}
              disabled={!dirty || saving}
              className="bg-spruce-700 hover:bg-spruce-800 gap-2"
              data-testid="admin-email-verify-save"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save
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
