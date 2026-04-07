import { useSearchParams } from 'react-router-dom';
import { Settings, Quote } from 'lucide-react';
import { AdminPlatformReviewsSection } from './AdminPlatformReviewsSection';
import { AdminListingReviewsSection } from './AdminListingReviewsSection';

const SETTINGS_TABS = [
  { id: 'overview', label: 'Listings reviews', icon: Settings },
  { id: 'reviews', label: 'Platform reviews', icon: Quote },
];

export function AdminSettingsSection({ onUpdate }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const legacyReviews = searchParams.get('section') === 'platform-reviews';
  const tab = tabParam || (legacyReviews ? 'reviews' : 'overview');
  const activeTab = SETTINGS_TABS.some((t) => t.id === tab) ? tab : 'overview';

  const setTab = (id) => {
    setSearchParams({ section: 'reviews', tab: id }, { replace: true });
  };

  return (
    <div className="space-y-6" data-testid="admin-settings-section">
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        {SETTINGS_TABS.map(({ id, label, icon: Icon }) => {
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
              data-testid={`admin-settings-tab-${id}`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </button>
          );
        })}
      </div>

      {activeTab === 'overview' && (
        <AdminListingReviewsSection onUpdate={onUpdate} />
      )}
      {activeTab === 'reviews' && <AdminPlatformReviewsSection onUpdate={onUpdate} />}
    </div>
  );
}
