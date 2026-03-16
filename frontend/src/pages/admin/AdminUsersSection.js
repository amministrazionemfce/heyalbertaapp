import { useEffect, useMemo, useState } from 'react';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { adminAPI } from '../../lib/api';
import { Loader2, Search } from 'lucide-react';

export function AdminUsersSection() {
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

  const filteredUsers = useMemo(() => {
    if (!search) return users;
    const q = search.toLowerCase();
    return users.filter(
      (u) => (u.name || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q)
    );
  }, [users, search]);

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
        <p className="text-sm text-slate-500">
          {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''}
        </p>
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
                        <Badge className={role.class}>
                          <span className="text-xs p-0.5">{role.label}</span>
                        </Badge>
                      </td>
                      <td className="p-4 text-slate-500">{date ? new Date(date).toLocaleDateString() : '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filteredUsers.length === 0 && (
            <div className="p-12 text-center text-slate-500">{search ? 'No users match your search.' : 'No users yet.'}</div>
          )}
        </div>
      )}
    </div>
  );
}

