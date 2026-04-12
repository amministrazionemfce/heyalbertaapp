import { Badge } from '../../components/ui/badge';
import { ADMIN_SECTIONS } from './adminConfig';

export function AdminSidebar({ stats, unreadContactMessages = null, activeSectionId, onSelectSection }) {
  return (
    <aside className="lg:w-48 flex-shrink-0 bg-white border-b lg:border-b-0 lg:border-r border-slate-200  lg:min-h-screen lg:sticky lg:top-0 z-40">
      <div className="flex flex-col lg:block">
        <nav className="p-2 lg:p-3 flex flex-row lg:flex-col flex-wrap gap-1.5 lg:gap-2.5">
          {ADMIN_SECTIONS.map((item) => {
            const Icon = item.icon;
            const active = activeSectionId === item.id;
            const unreadSupport =
              unreadContactMessages != null
                ? Number(unreadContactMessages) || 0
                : Number(stats?.unreadContactMessages ?? 0) || 0;
            const pendingBadge = item.id === 'listings' && (stats?.pendingVendors ?? stats?.pending_vendors) > 0;
            const supportBadge = item.id === 'support' && unreadSupport > 0;
            const notificationsBadge = item.id === 'notifications' && unreadSupport > 0;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectSection(item.id)}
                className={`flex items-center gap-3 px-3 py-2.5 lg:py-3 rounded-lg text-sm font-medium transition-colors lg:w-full ${
                  active ? 'bg-spruce-700 text-white shadow-sm hover:bg-spruce-700' : 'text-slate-600 hover:bg-admin-50'
                }`}
                data-testid={item.testId}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{item.label}</span>
                {pendingBadge && (
                  <Badge variant="counter" className="ml-auto shrink-0 min-w-[1.5rem] justify-center px-2 py-0.5 text-xs">
                    {stats.pendingVendors ?? stats.pending_vendors}
                  </Badge>
                )}
                {supportBadge && (
                  <Badge variant="counter" className="ml-auto shrink-0 min-w-[1.5rem] justify-center px-2 py-0.5 text-xs">
                    {unreadSupport > 99 ? '99+' : unreadSupport}
                  </Badge>
                )}
                {notificationsBadge && (
                  <Badge variant="counter" className="ml-auto shrink-0 min-w-[1.5rem] justify-center px-2 py-0.5 text-xs">
                    {unreadSupport > 99 ? '99+' : unreadSupport}
                  </Badge>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}

