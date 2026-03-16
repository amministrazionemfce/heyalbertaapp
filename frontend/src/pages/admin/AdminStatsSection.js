import { STAT_CARDS } from './adminConfig';

export function AdminStatsSection({ stats }) {
  return (
    <section className="space-y-6" data-testid="admin-stats">
      <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Overview</h2>
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {STAT_CARDS.map((s) => (
          <div
            key={s.label}
            className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow"
            data-testid={`stat-${s.label.toLowerCase().replace(/\s+/g, '-')}`}
          >
            <div className={`w-10 h-10 rounded-full ${s.iconBg} flex items-center justify-center mb-3 shadow-sm`}>
              <s.icon className="w-5 h-5 text-white" />
            </div>
            <p className="text-2xl font-bold font-heading text-slate-900">{stats?.[s.key] ?? stats?.[s.altKey] ?? 0}</p>
            <p className="text-sm text-slate-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

