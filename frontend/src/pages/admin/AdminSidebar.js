import { Badge } from '../../components/ui/badge';
import { ADMIN_SECTIONS } from './adminConfig';

export function AdminSidebar({ stats, activeSectionId, onSelectSection }) {
  return (
    <aside className="lg:w-48 flex-shrink-0 bg-white border-b lg:border-b-0 lg:border-r border-slate-200  lg:min-h-screen lg:sticky lg:top-0 z-40">
      <div className="flex flex-col lg:block">
        <nav className="p-2 flex flex-row lg:flex-col flex-wrap gap-1 lg:gap-0">
          {ADMIN_SECTIONS.map((item) => {
            const Icon = item.icon;
            const active = activeSectionId === item.id;
            const pendingBadge = item.id === 'vendors' && (stats?.pendingVendors ?? stats?.pending_vendors) > 0;
            const supportBadge = item.id === 'support' && (stats?.unreadContactMessages ?? 0) > 0;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectSection(item.id)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors lg:w-full ${
                  active ? 'bg-spruce-800 text-white shadow-sm hover:bg-spruce-700' : 'text-slate-600 hover:bg-admin-50'
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
                    {stats.unreadContactMessages > 99 ? '99+' : stats.unreadContactMessages}
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

