import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { adminAPI } from '../../lib/api';
import { Bell, Loader2, MailOpen, Users } from 'lucide-react';

function msgId(m) {
  return m?.id || m?._id || '';
}

function formatWhen(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return String(iso);
  }
}

const TABS = [
  { id: 'support', label: 'Support', Icon: Bell },
  { id: 'users', label: 'Users', Icon: Users },
];

const LAST_SEEN_USER_KEY = 'hey_alberta_admin_notifications_last_seen_user_id';

export function AdminNotificationsSection({ onUpdate }) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const activeTab = TABS.some((t) => t.id === tabParam) ? tabParam : 'support';

  const [loading, setLoading] = useState(true);
  const [unread, setUnread] = useState([]);
  const [detail, setDetail] = useState(null);
  const [newUsers, setNewUsers] = useState([]);
  const [userDetail, setUserDetail] = useState(null);

  const unreadCount = unread.length;
  const newUsersCount = newUsers.length;
  // Badges are shown in the left sidebar; keep the page header clean.

  const loadUnread = async () => {
    const res = await adminAPI.contactMessages({ read: 'false' });
    const list = Array.isArray(res.data) ? res.data : [];
    setUnread(list);
    return list.length;
  };

  const loadNewUsers = async () => {
    let sinceId = '';
    try {
      sinceId = localStorage.getItem(LAST_SEEN_USER_KEY) || '';
    } catch {
      sinceId = '';
    }
    const res = await adminAPI.notificationUsers({ sinceId, limit: 25 });
    const list = Array.isArray(res.data?.users) ? res.data.users : [];
    setNewUsers(list);
    return list.length;
  };

  useEffect(() => {
    // One refresh on mount so sidebar badge matches current unread counts.
    onUpdate?.();
  }, [onUpdate]);

  useEffect(() => {
    let mounted = true;
    let prevSupport = null;
    let prevUsers = null;

    const tick = async () => {
      try {
        if (!mounted) return;
        const [nextSupport, nextUsers] = await Promise.all([loadUnread(), loadNewUsers()]);
        setLoading(false);
        if (prevSupport != null && nextSupport > prevSupport) {
          toast.message('New support message received.', {
            description: `${nextSupport} unread message${nextSupport === 1 ? '' : 's'}.`,
          });
          onUpdate?.(); // refresh sidebar badge counts
        }
        if (prevUsers != null && nextUsers > prevUsers) {
          toast.message('New user registered.', {
            description: `${nextUsers} new user${nextUsers === 1 ? '' : 's'}.`,
          });
        }
        if (prevSupport != null && nextSupport !== prevSupport) {
          onUpdate?.(); // keep sidebar badge in sync when support notifications change
        }
        prevSupport = nextSupport;
        prevUsers = nextUsers;
      } catch {
        setLoading(false);
      }
    };

    // Initial + poll
    tick();
    const i = window.setInterval(tick, 15000);
    return () => {
      mounted = false;
      window.clearInterval(i);
    };
  }, []);

  const setTab = (id) => {
    setSearchParams({ section: 'notifications', tab: id }, { replace: true });
  };

  const markAllUsersSeen = () => {
    if (!newUsers.length) return;
    const newestId = String(newUsers[0]._id || newUsers[0].id || '').trim();
    if (!newestId) {
      setNewUsers([]);
      return;
    }
    try {
      localStorage.setItem(LAST_SEEN_USER_KEY, newestId);
    } catch {
      /* ignore */
    }
    setNewUsers([]);
  };

  const header = useMemo(
    () => (
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-heading text-xl font-bold text-slate-900">Notifications</h2>
          <p className="text-sm text-slate-500 mt-1">
            Alerts for new inbound messages and other events.
          </p>
        </div>
      </div>
    ),
    []
  );

  return (
    <div className="space-y-6" data-testid="admin-notifications-section">
      {header}

      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        {TABS.map(({ id, label, Icon }) => {
          const isActive = activeTab === id;
          const count = id === 'support' ? unreadCount : id === 'users' ? newUsersCount : 0;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-spruce-700 text-white shadow-sm'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
              data-testid={`admin-notifications-tab-${id}`}
            >
              <Icon className="w-4 h-4 shrink-0" aria-hidden />
              {label}
              {count > 0 ? (
                <Badge
                  variant="counter"
                  className={`ml-1 shrink-0 min-w-[1.5rem] justify-center px-2 py-0.5 text-xs ${
                    isActive ? '' : '!bg-spruce-800 !text-white border-spruce-900'
                  }`}
                >
                  {count > 99 ? '99+' : count}
                </Badge>
              ) : null}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-spruce-800" />
        </div>
      ) : activeTab === 'support' ? (
        unread.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white p-12 text-center text-slate-500">
          <MailOpen className="w-10 h-10 mx-auto mb-3 text-slate-300" />
          <p className="font-medium text-slate-700">No unread support messages</p>
          <p className="text-sm mt-1">When a new message arrives, you’ll see a badge and an alert.</p>
        </div>
        ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200">
                <tr>
                  <th className="text-left p-3 font-semibold text-slate-700">From</th>
                  <th className="text-left p-3 font-semibold text-slate-700">Subject</th>
                  <th className="text-left p-3 font-semibold text-slate-700 whitespace-nowrap">Received</th>
                  <th className="text-right p-3 font-semibold text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {unread.map((m) => {
                  const id = msgId(m);
                  return (
                    <tr key={id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
                      <td className="p-3">
                        <p className="font-medium text-slate-900">{m.name || '—'}</p>
                        <p className="text-xs text-slate-500 break-all">{m.email || ''}</p>
                      </td>
                      <td className="p-3 text-slate-800 max-w-xs truncate" title={m.subject}>
                        {m.subject}
                      </td>
                      <td className="p-3 text-slate-500 whitespace-nowrap text-xs">
                        {formatWhen(m.createdAt)}
                      </td>
                      <td className="p-3 text-right">
                        <Button type="button" variant="outline" size="sm" className="text-xs" onClick={() => setDetail(m)}>
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
        )
      ) : activeTab === 'users' ? (
        newUsers.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-white p-12 text-center text-slate-500">
            <Users className="w-10 h-10 mx-auto mb-3 text-slate-300" />
            <p className="font-medium text-slate-700">No new user registrations</p>
            <p className="text-sm mt-1">New signups will show here until you mark them as seen.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex justify-end">
              <Button type="button" variant="outline" size="sm" onClick={markAllUsersSeen} data-testid="admin-notifications-users-mark-seen">
                Mark all seen
              </Button>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-slate-200">
                    <tr>
                      <th className="text-left p-3 font-semibold text-slate-700">Name</th>
                      <th className="text-left p-3 font-semibold text-slate-700">Email</th>
                      <th className="text-left p-3 font-semibold text-slate-700">Role</th>
                      <th className="text-right p-3 font-semibold text-slate-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {newUsers.map((u) => {
                      const id = String(u.id || u._id || '').trim();
                      return (
                        <tr key={id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
                          <td className="p-3 font-medium text-slate-900">{u.name || '—'}</td>
                          <td className="p-3 text-slate-600">{u.email || '—'}</td>
                          <td className="p-3 text-slate-600 capitalize">{u.role || 'user'}</td>
                          <td className="p-3 text-right">
                            <Button type="button" variant="outline" size="sm" className="text-xs" onClick={() => setUserDetail(u)}>
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
          </div>
        )
      ) : null}

      <Dialog open={!!detail} onOpenChange={(v) => !v && setDetail(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {detail && (
            <>
              <DialogHeader>
                <DialogTitle className="pr-8">{detail.subject}</DialogTitle>
                <p className="text-xs text-slate-500">{formatWhen(detail.createdAt)}</p>
              </DialogHeader>

              <div className="space-y-4 text-sm">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-lg p-4 border border-slate-100">
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
                </div>

                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Message</p>
                  <div className="rounded-lg border border-slate-200 bg-white p-4 text-slate-800 whitespace-pre-wrap leading-relaxed">
                    {detail.message}
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    type="button"
                    className="bg-spruce-700 hover:bg-spruce-800 text-white"
                    onClick={() => {
                      const id = msgId(detail);
                      navigate(`?section=support&messageId=${encodeURIComponent(id)}`);
                      setDetail(null);
                    }}
                    data-testid="admin-notifications-support-check"
                  >
                    Check
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!userDetail} onOpenChange={(v) => !v && setUserDetail(null)}>
        <DialogContent className="max-w-lg">
          {userDetail && (
            <>
              <DialogHeader>
                <DialogTitle>New user registration</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 text-sm">
                <div className="rounded-lg border border-slate-100 bg-white p-4">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Name</p>
                  <p className="text-slate-900 mt-0.5">{userDetail.name || '—'}</p>
                  <p className="mt-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Email</p>
                  <p className="text-slate-900 mt-0.5 break-all">{userDetail.email || '—'}</p>
                  <p className="mt-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Role</p>
                  <p className="text-slate-900 mt-0.5 capitalize">{userDetail.role || 'user'}</p>
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <Button type="button" variant="outline" onClick={() => setUserDetail(null)}>
                    Close
                  </Button>
                  <Button
                    type="button"
                    className="bg-spruce-700 hover:bg-spruce-800 text-white"
                    onClick={() => {
                      const email = String(userDetail.email || '').trim();
                      navigate(`?section=users${email ? `&q=${encodeURIComponent(email)}` : ''}`);
                      setUserDetail(null);
                      markAllUsersSeen();
                    }}
                  >
                    Mark seen
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

