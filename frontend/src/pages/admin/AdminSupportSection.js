import { useEffect, useState } from 'react';
import { adminAPI } from '../../lib/api';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Loader2, MailOpen, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

function msgId(m) {
  return m?.id || m?._id || '';
}

function formatWhen(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return String(iso);
  }
}

export function AdminSupportSection({ onUpdate }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [detail, setDetail] = useState(null);

  const load = () => {
    setLoading(true);
    const params = {};
    if (filter === 'unread') params.read = 'false';
    if (filter === 'read') params.read = 'true';
    adminAPI
      .contactMessages(params)
      .then((r) => setMessages(Array.isArray(r.data) ? r.data : []))
      .catch(() => {
        setMessages([]);
        toast.error('Could not load messages.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [filter]);

  const markRead = async (id) => {
    if (!id) return;
    try {
      const res = await adminAPI.markContactMessageRead(id);
      const updated = res.data;
      setMessages((prev) =>
        prev.map((m) => (msgId(m) === id ? { ...m, ...updated, read: true } : m))
      );
      setDetail((d) => (d && msgId(d) === id ? { ...d, ...updated, read: true } : d));
      toast.success('Marked as read');
      onUpdate?.();
    } catch {
      toast.error('Could not update message.');
    }
  };

  return (
    <div className="space-y-6" data-testid="admin-support-section">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-heading text-xl font-bold text-slate-900">Support inbox</h2>
          <p className="text-sm text-slate-500 mt-1">
            Messages submitted from the public Contact page.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {(['all', 'unread', 'read']).map((f) => (
            <Button
              key={f}
              type="button"
              variant={filter === f ? 'default' : 'outline'}
              size="sm"
              className={filter === f ? 'bg-spruce-700 hover:bg-spruce-800 text-white' : ''}
              onClick={() => setFilter(f)}
              data-testid={`admin-support-filter-${f}`}
            >
              {f === 'all' ? 'All' : f === 'unread' ? 'Unread' : 'Read'}
            </Button>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => load()}
            className="gap-1.5"
            data-testid="admin-support-refresh"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-admin-600" />
        </div>
      ) : messages.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white p-12 text-center text-slate-500">
          <MailOpen className="w-10 h-10 mx-auto mb-3 text-slate-300" />
          <p className="font-medium text-slate-700">No messages in this view</p>
          <p className="text-sm mt-1">Submissions from /contact will appear here.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left p-3 font-semibold text-slate-700">Status</th>
                  <th className="text-left p-3 font-semibold text-slate-700">From</th>
                  <th className="text-left p-3 font-semibold text-slate-700">Type</th>
                  <th className="text-left p-3 font-semibold text-slate-700 min-w-[200px]">Subject</th>
                  <th className="text-left p-3 font-semibold text-slate-700 whitespace-nowrap">Received</th>
                  <th className="text-right p-3 font-semibold text-slate-700"> </th>
                </tr>
              </thead>
              <tbody>
                {messages.map((m) => {
                  const id = msgId(m);
                  const isRead = Boolean(m.read);
                  return (
                    <tr
                      key={id}
                      className="border-b border-slate-100 last:border-0 hover:bg-slate-50/80"
                      data-testid={`admin-support-row-${id}`}
                    >
                      <td className="p-3">
                        {isRead ? (
                          <Badge variant="secondary" className="font-normal bg-slate-100 text-slate-600">
                            Read
                          </Badge>
                        ) : (
                          <Badge className="font-normal bg-amber-100 text-amber-900 border-0">New</Badge>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="font-medium text-slate-900">{m.name}</div>
                        <div className="text-xs text-slate-500 truncate max-w-[200px]">{m.email}</div>
                      </td>
                      <td className="p-3 text-slate-600 capitalize">
                        {m.inquiryType === 'business' ? 'Business' : 'Newcomer'}
                      </td>
                      <td className="p-3 text-slate-800 max-w-xs truncate" title={m.subject}>
                        {m.subject}
                      </td>
                      <td className="p-3 text-slate-500 whitespace-nowrap text-xs">
                        {formatWhen(m.createdAt)}
                      </td>
                      <td className="p-3 text-right">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="text-xs"
                          onClick={() => setDetail(m)}
                          data-testid={`admin-support-open-${id}`}
                        >
                          Open
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Dialog open={!!detail} onOpenChange={(v) => !v && setDetail(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {detail && (
            <>
              <DialogHeader>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <DialogTitle className="pr-8">{detail.subject}</DialogTitle>
                  {detail.read ? (
                    <Badge variant="secondary" className="shrink-0">
                      Read
                    </Badge>
                  ) : (
                    <Badge className="shrink-0 bg-amber-100 text-amber-900 border-0">New</Badge>
                  )}
                </div>
                <p className="text-xs text-slate-500">{formatWhen(detail.createdAt)}</p>
              </DialogHeader>

              <div className="space-y-4 text-sm">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-lg bg-slate-50 p-4 border border-slate-100">
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Name</p>
                    <p className="text-slate-900 mt-0.5">{detail.name}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Email</p>
                    <a href={`mailto:${detail.email}`} className="text-spruce-700 hover:underline mt-0.5 block break-all">
                      {detail.email}
                    </a>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Inquiry type</p>
                    <p className="text-slate-900 mt-0.5 capitalize">
                      {detail.inquiryType === 'business' ? 'Local company / business' : 'Newcomer / user'}
                    </p>
                  </div>
                  {detail.inquiryType === 'business' && (
                    <>
                      <div className="sm:col-span-2">
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Business name</p>
                        <p className="text-slate-900 mt-0.5">{detail.businessName || '—'}</p>
                      </div>
                      <div className="sm:col-span-2">
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Business address</p>
                        <p className="text-slate-900 mt-0.5 whitespace-pre-wrap">{detail.businessAddress || '—'}</p>
                      </div>
                    </>
                  )}
                </div>

                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Message</p>
                  <div className="rounded-lg border border-slate-200 bg-white p-4 text-slate-800 whitespace-pre-wrap leading-relaxed">
                    {detail.message}
                  </div>
                </div>

                {!detail.read && (
                  <div className="flex justify-end pt-2">
                    <Button
                      type="button"
                      className="bg-spruce-700 hover:bg-spruce-800 text-white"
                      onClick={() => markRead(msgId(detail))}
                      data-testid="admin-support-mark-read"
                    >
                      Mark as read
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
