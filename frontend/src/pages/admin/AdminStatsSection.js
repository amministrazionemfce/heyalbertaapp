import { Users, List, Wallet } from 'lucide-react';
import { SimpleLineChart } from '../../components/SimpleLineChart';

const CHART_COLOR = '#0ea5e9';
const FINANCE_COLOR = '#16a34a';

function formatMoney(amount, currency) {
  const n = Number(amount);
  if (!Number.isFinite(n)) return '—';
  const cur = String(currency || '').trim();
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: cur || 'USD',
      maximumFractionDigits: 0,
    }).format(n);
  } catch {
    return `${n.toFixed(0)}${cur ? ` ${cur}` : ''}`;
  }
}

function SectorCardHeader({ icon: Icon, iconBg, title, total, totalMuted }) {
  return (
    <div className="flex items-center justify-between gap-3 text-slate-800">
      <div className="flex items-center gap-2 min-w-0">
        <div className={`rounded-full ${iconBg} p-2.5 text-white shrink-0`}>
          <Icon className="w-5 h-5" />
        </div>
        <h2 className="font-heading text-lg font-semibold truncate">{title}</h2>
      </div>
      <p
        className={`text-2xl sm:text-3xl font-bold font-heading tabular-nums shrink-0 leading-none ${
          totalMuted ? 'text-slate-300' : 'text-slate-900'
        }`}
      >
        {total}
      </p>
    </div>
  );
}

export function AdminStatsSection({ stats }) {
  const trends = stats?.trends || {};
  const labels = Array.isArray(trends.labels) ? trends.labels : [];
  const finance = stats?.finance || {};
  const financeLabels = labels;
  const financeValues = Array.isArray(finance.revenueLast6MonthsByMonth)
    ? finance.revenueLast6MonthsByMonth
    : [];

  return (
    <section className="space-y-10" data-testid="admin-stats">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4 min-h-[180px] flex flex-col">
          <SectorCardHeader
            icon={Users}
            iconBg="bg-admin-500"
            title="Users"
            total={stats?.totalUsers ?? 0}
          />
          <ul className="text-sm text-slate-600 space-y-3 border-t border-slate-100 pt-4 flex-1">
            <li className="flex justify-between gap-2">
              <span>Vendor role</span>
              <span className="font-semibold text-slate-800 tabular-nums">{stats?.usersByRole?.vendor ?? 0}</span>
            </li>
            <li className="flex justify-between gap-2">
              <span>User role</span>
              <span className="font-semibold text-slate-800 tabular-nums">{stats?.usersByRole?.user ?? 0}</span>
            </li>
          </ul>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4 min-h-[180px] flex flex-col">
          <SectorCardHeader
            icon={List}
            iconBg="bg-violet-600"
            title="Listings"
            total={stats?.totalListings ?? 0}
          />
          <ul className="text-sm text-slate-600 space-y-2 border-t border-slate-100 pt-4 flex-1">
            <li className="flex justify-between gap-2">
              <span>Published</span>
              <span className="font-semibold text-slate-800 tabular-nums">{stats?.listingsPublished ?? 0}</span>
            </li>
            <li className="flex justify-between gap-2">
              <span>Draft</span>
              <span className="font-semibold text-slate-800 tabular-nums">{stats?.listingsDraft ?? 0}</span>
            </li>
            <li className="flex justify-between gap-2">
              <span>Featured</span>
              <span className="font-semibold text-amber-700 tabular-nums">{stats?.listingsFeatured ?? 0}</span>
            </li>
          </ul>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm min-h-[180px] flex flex-col">
          <SectorCardHeader
            icon={Wallet}
            iconBg="bg-slate-400"
            title="Finance"
            total={finance?.stripeConnected ? formatMoney(finance?.revenueLast30Days, finance?.currency) : '—'}
            totalMuted={!finance?.stripeConnected}
          />
          <ul className="text-sm text-slate-600 space-y-3 border-t border-slate-100 pt-4 flex-1">
            <li className="flex justify-between gap-2">
              <span>Available</span>
              <span className="font-semibold text-slate-800 tabular-nums">
                {finance?.stripeConnected ? formatMoney(finance?.availableBalance, finance?.currency) : '—'}
              </span>
            </li>
            <li className="flex justify-between gap-2">
              <span>Pending</span>
              <span className="font-semibold text-slate-800 tabular-nums">
                {finance?.stripeConnected ? formatMoney(finance?.pendingBalance, finance?.currency) : '—'}
              </span>
            </li>
            <li className="flex justify-between gap-2">
              <span>Last 30 days</span>
              <span className="font-semibold text-emerald-700 tabular-nums">
                {finance?.stripeConnected ? formatMoney(finance?.revenueLast30Days, finance?.currency) : '—'}
              </span>
            </li>
          </ul>
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Growth (last 6 months)</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SimpleLineChart title="New users" labels={labels} values={trends.newUsers} color={CHART_COLOR} />
          <SimpleLineChart title="New listings" labels={labels} values={trends.newListings} color={CHART_COLOR} />
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Finance (last 6 months)</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SimpleLineChart
            title={finance?.stripeConnected ? `Revenue (${String(finance?.currency || '').toUpperCase() || '—'})` : 'Revenue'}
            labels={financeLabels}
            values={financeValues}
            color={FINANCE_COLOR}
          />
        </div>
      </div>
    </section>
  );
}
