import { Badge } from '../../components/ui/badge';
import { ADMIN_SECTIONS } from './adminConfig';

export function AdminSidebar({ stats, activeSectionId, onSelectSection }) {
  return (
    <aside className="lg:w-56 flex-shrink-0 bg-white border-b lg:border-b-0 lg:border-r border-slate-200 lg:min-h-screen lg:sticky lg:top-0 z-40">
      <div className="flex flex-col lg:block">
        <nav className="p-2 flex flex-row lg:flex-col flex-wrap gap-1 lg:gap-0">
          {ADMIN_SECTIONS.map((item) => {
            const Icon = item.icon;
            const active = activeSectionId === item.id;
            const pendingBadge = item.id === 'vendors' && (stats?.pendingVendors ?? stats?.pending_vendors) > 0;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectSection(item.id)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors lg:w-full ${
                  active ? 'bg-spruce-700 text-white hover:bg-spruce-700' : 'text-slate-600 hover:bg-slate-100'
                }`}
                data-testid={item.testId}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{item.label}</span>
                {pendingBadge && (
                  <Badge className="ml-auto bg-amber-500 text-white text-xs shrink-0">
                    {stats.pendingVendors ?? stats.pending_vendors}
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

