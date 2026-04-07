import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';

import { adminAPI } from '../../lib/api';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';

const TABS = [{ id: 'email-verification', label: 'Email verification' }];

export function AdminGeneralSection({ onUpdate }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const activeTab = TABS.some((t) => t.id === tabParam) ? tabParam : 'email-verification';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState(null);

  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.siteSettings();
      const s = res.data || {};
      setSettings(s);
      setEmailSubject(String(s.emailVerificationEmailSubject || '').trim());
      setEmailBody(String(s.emailVerificationEmailBody || '').trim());
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
      String(settings.emailVerificationEmailSubject || '').trim() !== String(emailSubject || '').trim() ||
      String(settings.emailVerificationEmailBody || '').trim() !== String(emailBody || '').trim()
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
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-5">
          <div>
            <h2 className="font-heading text-lg font-semibold text-slate-900">Verification email content</h2>
            <p className="text-sm text-slate-500 mt-1">
              You can use placeholders: <span className="font-mono text-xs">{'{{name}}'}</span>,{' '}
              <span className="font-mono text-xs">{'{{verifyUrl}}'}</span>.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="admin-email-verify-subject">Email subject</Label>
            <Input
              id="admin-email-verify-subject"
              value={emailSubject}
              onChange={(e) => setEmailSubject(e.target.value)}
              placeholder="Verify your Hey Alberta email"
              data-testid="admin-email-verify-subject"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="admin-email-verify-body">Email body (text)</Label>
            <Textarea
              id="admin-email-verify-body"
              value={emailBody}
              onChange={(e) => setEmailBody(e.target.value)}
              placeholder={'Hi {{name}},\n\nPlease verify your email:\n{{verifyUrl}}\n\nThis link expires in 48 hours.\n'}
              className="min-h-[220px] font-mono text-xs"
              data-testid="admin-email-verify-body"
            />
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
    </div>
  );
}

