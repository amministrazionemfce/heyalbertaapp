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
import { AdminNewsSection } from './admin/AdminNewsSection';
import { AdminCityImagesSection } from './admin/AdminCityImagesSection';
import { AdminSupportSection } from './admin/AdminSupportSection';
import { ROUTES } from '../constants';

export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const sectionParam = searchParams.get('section');
  const normalizedSection = sectionParam === 'resources' ? 'news' : sectionParam;
  const validSection = ADMIN_SECTIONS.some((s) => s.id === normalizedSection) ? normalizedSection : 'statistics';
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
      <div className="min-h-screen bg-admin-50 flex items-center justify-center" data-testid="admin-dashboard">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-admin-600 mx-auto mb-4" />
          <p className="text-slate-500">Loading dashboard…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-admin-50" data-testid="admin-dashboard">
      <AdminSidebar stats={stats} activeSectionId={activeSectionId} onSelectSection={setSection} />

      {/* Main content */}
      <main className="flex-1 min-w-0 py-6 px-4 md:px-6">
        <div className={validSection === 'support' ? 'max-w-6xl' : 'max-w-5xl'}>
          {validSection === 'statistics' && <AdminStatsSection stats={stats} />}
          {validSection === 'users' && <AdminUsersSection />}
          {validSection === 'vendors' && <AdminVendorsSection onUpdate={refreshStats} />}
          {validSection === 'listings' && <AdminListingsSection onUpdate={refreshStats} />}
          {validSection === 'news' && <AdminNewsSection onUpdate={refreshStats} />}
          {validSection === 'support' && <AdminSupportSection onUpdate={refreshStats} />}
          {validSection === 'city-images' && <AdminCityImagesSection />}
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
