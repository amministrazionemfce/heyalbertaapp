import { useCallback, useEffect, useMemo, useState } from 'react';
import { Loader2, Mail, Send } from 'lucide-react';
import { toast } from 'sonner';
import { adminAPI } from '../../lib/api';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';

function mergePoolEmails(pools, toggles) {
  const set = new Set();
  if (toggles.allUsers && pools?.allUsers?.emails) {
    pools.allUsers.emails.forEach((e) => set.add(e));
  }
  if (toggles.vendorBusinesses && pools?.vendorBusinesses?.emails) {
    pools.vendorBusinesses.emails.forEach((e) => set.add(e));
  }
  return [...set].sort();
}

export function AdminMarketingSection() {
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [pools, setPools] = useState(null);
  const [poolToggles, setPoolToggles] = useState({
    allUsers: false,
    vendorBusinesses: false,
  });
  const [emailChecked, setEmailChecked] = useState({});
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminAPI.marketingRecipientPools();
      setPools(res.data);
    } catch {
      toast.error('Could not load recipient lists.');
      setPools(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const mergedEmails = useMemo(() => mergePoolEmails(pools, poolToggles), [pools, poolToggles]);

  useEffect(() => {
    const next = {};
    mergedEmails.forEach((e) => {
      next[e] = true;
    });
    setEmailChecked(next);
  }, [mergedEmails]);

  const selectedCount = useMemo(
    () => mergedEmails.filter((e) => emailChecked[e]).length,
    [mergedEmails, emailChecked]
  );

  const togglePool = (key) => {
    setPoolToggles((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const setAllRecipients = (checked) => {
    const next = {};
    mergedEmails.forEach((e) => {
      next[e] = checked;
    });
    setEmailChecked(next);
  };

  const toggleOneEmail = (email) => {
    setEmailChecked((prev) => ({ ...prev, [email]: !prev[email] }));
  };

  const handleSend = async () => {
    const recipients = mergedEmails.filter((e) => emailChecked[e]);
    if (!recipients.length) {
      toast.error('Select at least one recipient (enable a list and keep emails checked).');
      return;
    }
    if (!subject.trim()) {
      toast.error('Add an email subject.');
      return;
    }
    if (!body.trim()) {
      toast.error('Add message content.');
      return;
    }
    setSending(true);
    try {
      const res = await adminAPI.sendMarketingEmail({
        subject: subject.trim(),
        body: body.trim(),
        recipients,
      });
      const sent = res.data?.sent ?? 0;
      const failed = res.data?.failed ?? 0;
      toast.success(res.data?.message || `Sent ${sent} email(s).${failed ? ` ${failed} failed.` : ''}`);
      if (failed > 0 && res.data?.errors?.length) {
        console.warn('Marketing send errors', res.data.errors);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send.');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16" data-testid="admin-marketing-section">
        <Loader2 className="w-8 h-8 animate-spin text-spruce-800" />
      </div>
    );
  }

  const poolRows = pools
    ? [
        { key: 'allUsers', meta: pools.allUsers },
        { key: 'vendorBusinesses', meta: pools.vendorBusinesses },
      ]
    : [];

  return (
    <div className="w-full max-w-none space-y-8" data-testid="admin-marketing-section">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:items-start">
        <div className="space-y-8 min-w-0">
          <div className="rounded-xl border border-slate-200 bg-white p-5 md:p-6 shadow-sm space-y-4">
            <h3 className="font-semibold text-slate-900">Recipient lists</h3>
            <p className="text-sm text-slate-600">Turn on one or more groups, then refine individual addresses below.</p>
            <div className="space-y-3">
              {poolRows.map(({ key, meta }) => (
                <label
                  key={key}
                  className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-100 p-3 hover:bg-slate-50"
                >
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-spruce-700 focus:ring-spruce-500"
                    checked={!!poolToggles[key]}
                    onChange={() => togglePool(key)}
                    data-testid={`marketing-pool-${key}`}
                  />
                  <div className="min-w-0 flex-1">
                    <span className="font-medium text-slate-900">{meta?.label}</span>
                    <p className="text-xs text-slate-500 mt-0.5">{meta?.description}</p>
                    <p className="text-xs text-slate-600 mt-1">
                      <span className="font-semibold tabular-nums">{meta?.emails?.length ?? 0}</span> addresses
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-8 min-w-0">
          <div className="rounded-xl border border-slate-200 bg-white p-5 md:p-6 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-semibold text-slate-900">
                Recipients <span className="text-slate-500 font-normal">({selectedCount} selected)</span>
              </h3>
              {mergedEmails.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => setAllRecipients(true)}>
                    Select all
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => setAllRecipients(false)}>
                    Deselect all
                  </Button>
                </div>
              )}
            </div>
            {mergedEmails.length === 0 ? (
              <p className="text-sm text-slate-500 py-4">Enable at least one list above to load addresses.</p>
            ) : (
              <div className="max-h-72 lg:max-h-[min(28rem,calc(100vh-20rem))] overflow-y-auto rounded-lg border border-slate-100 divide-y divide-slate-100">
                {mergedEmails.map((email) => (
                  <label
                    key={email}
                    className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50 cursor-pointer text-sm"
                  >
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-slate-300 text-spruce-700 focus:ring-spruce-500 shrink-0"
                      checked={!!emailChecked[email]}
                      onChange={() => toggleOneEmail(email)}
                    />
                    <span className="font-mono text-slate-800 truncate">{email}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 md:p-6 shadow-sm space-y-4">
            <h3 className="font-semibold text-slate-900">Message</h3>
            <div>
              <Label htmlFor="mkt-subject">Subject</Label>
              <Input
                id="mkt-subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="March update from Hey Alberta"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="mkt-body">Content (plain text)</Label>
              <Textarea
                id="mkt-body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={10}
                placeholder="Write your marketing message…"
                className="mt-1 resize-y font-sans"
              />
            </div>
            <Button
              type="button"
              className="bg-spruce-700 hover:bg-spruce-800 text-white gap-2"
              disabled={sending}
              onClick={handleSend}
              data-testid="marketing-send-btn"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Send to {selectedCount} recipient{selectedCount === 1 ? '' : 's'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
