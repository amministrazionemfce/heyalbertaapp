import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { adminAPI } from '../lib/api';
import { Loader2, Megaphone, CreditCard, Settings } from 'lucide-react';
import { ADMIN_SECTIONS } from './admin/adminConfig';
import { AdminSidebar } from './admin/AdminSidebar';
import { AdminStatsSection } from './admin/AdminStatsSection';
import { AdminPlaceholder } from './admin/AdminPlaceholder';
import { AdminVendorsSection } from './admin/AdminVendorsSection';
import { AdminListingsSection } from './admin/AdminListingsSection';
import { AdminUsersSection } from './admin/AdminUsersSection';
import { AdminResourcesSection } from './admin/AdminResourcesSection';
import { ROUTES } from '../constants';

export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const sectionParam = searchParams.get('section');
  const validSection = ADMIN_SECTIONS.some((s) => s.id === sectionParam) ? sectionParam : 'statistics';
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) {
      return;
    }
    if (!user || user.role !== 'admin') {
      navigate(ROUTES.LOGIN);
      return;
    }
    adminAPI
      .stats()
      .then((r) => setStats(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user, authLoading, navigate]);

  const refreshStats = () => {
    adminAPI.stats().then((r) => setStats(r.data)).catch(() => {});
  };

  const setSection = (id) => {
    setSearchParams(id === 'statistics' ? {} : { section: id });
  };

  const activeSectionId = validSection;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center" data-testid="admin-dashboard">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-spruce-700 mx-auto mb-4" />
          <p className="text-slate-500">Loading dashboard…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-50" data-testid="admin-dashboard">
      <AdminSidebar stats={stats} activeSectionId={activeSectionId} onSelectSection={setSection} />

      {/* Main content */}
      <main className="flex-1 min-w-0 py-6 px-4 md:px-6">
        <div className="max-w-5xl">
          {validSection === 'statistics' && <AdminStatsSection stats={stats} />}
          {validSection === 'users' && <AdminUsersSection />}
          {validSection === 'vendors' && <AdminVendorsSection onUpdate={refreshStats} />}
          {validSection === 'listings' && <AdminListingsSection onUpdate={refreshStats} />}
          {validSection === 'resources' && <AdminResourcesSection onUpdate={refreshStats} />}
          {validSection === 'marketings' && (
            <AdminPlaceholder icon={Megaphone} title="Marketings" description="Campaigns and promotions. Coming soon." />
          )}
          {validSection === 'memberships' && (
            <AdminPlaceholder icon={CreditCard} title="Memberships" description="Tiers and billing. Coming soon." />
          )}
          {validSection === 'general' && (
            <AdminPlaceholder icon={Settings} title="General" description="Site settings and preferences. Coming soon." />
          )}
        </div>
      </main>
    </div>
  );
}
