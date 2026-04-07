import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { adminAPI } from '../lib/api';
import { Loader2 } from 'lucide-react';
import { ADMIN_SECTIONS } from './admin/adminConfig';
import { AdminSidebar } from './admin/AdminSidebar';
import { AdminStatsSection } from './admin/AdminStatsSection';
import { AdminListingsSection } from './admin/AdminListingsSection';
import { AdminUsersSection } from './admin/AdminUsersSection';
import { AdminNewsSection } from './admin/AdminNewsSection';
import { AdminCityImagesSection } from './admin/AdminCityImagesSection';
import { AdminSupportSection } from './admin/AdminSupportSection';
import { AdminMembershipsSection } from './admin/AdminMembershipsSection';
import { AdminSettingsSection } from './admin/AdminSettingsSection';
import { AdminMarketingSection } from './admin/AdminMarketingSection';
import { AdminNotificationsSection } from './admin/AdminNotificationsSection';
import { AdminGeneralSection } from './admin/AdminGeneralSection';
import { ROUTES } from '../constants';

export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const sectionParam = searchParams.get('section');
  const normalizedSection =
    sectionParam === 'resources'
      ? 'news'
      : sectionParam === 'platform-reviews'
        ? 'reviews'
        : sectionParam;
  const validSection = ADMIN_SECTIONS.some((s) => s.id === normalizedSection) ? normalizedSection : 'statistics';
  const [stats, setStats] = useState(null);
  const [unreadContactMessages, setUnreadContactMessages] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    const [unreadResult, statsResult] = await Promise.allSettled([
      adminAPI.contactMessages({ read: 'false', limit: 200 }),
      adminAPI.stats(),
    ]);

    let unreadCount = unreadContactMessages;
    if (unreadResult.status === 'fulfilled') {
      const unreadList = Array.isArray(unreadResult.value?.data) ? unreadResult.value.data : [];
      unreadCount = unreadList.length;
      setUnreadContactMessages(unreadCount);
    }

    if (statsResult.status === 'fulfilled') {
      const baseStats = statsResult.value?.data || {};
      setStats({ ...baseStats, unreadContactMessages: unreadCount });
    }
  };

  useEffect(() => {
    if (authLoading) {
      return;
    }
    if (!user || user.role !== 'admin') {
      navigate(ROUTES.LOGIN);
      return;
    }
    fetchStats().finally(() => setLoading(false));
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (searchParams.get('section') === 'platform-reviews') {
      setSearchParams({ section: 'reviews', tab: 'reviews' }, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const refreshStats = () => {
    fetchStats();
  };

  const setSection = (id) => {
    setSearchParams(id === 'statistics' ? {} : { section: id });
  };

  const activeSectionId = validSection;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" data-testid="admin-dashboard">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-spruce-800 mx-auto mb-4" />
          <p className="text-slate-500">Loading dashboard…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row" data-testid="admin-dashboard">
      <AdminSidebar
        stats={stats}
        unreadContactMessages={unreadContactMessages}
        activeSectionId={activeSectionId}
        onSelectSection={setSection}
      />

      {/* Main content */}
      <main className="flex-1 min-w-0 py-6 px-4 md:px-6">
        <div className="w-full max-w-none">
          {validSection === 'statistics' && <AdminStatsSection stats={stats} />}
          {validSection === 'users' && <AdminUsersSection />}
          {validSection === 'listings' && <AdminListingsSection onUpdate={refreshStats} />}
          {validSection === 'news' && <AdminNewsSection onUpdate={refreshStats} />}
          {validSection === 'support' && <AdminSupportSection onUpdate={refreshStats} />}
          {validSection === 'city-images' && <AdminCityImagesSection />}
          {validSection === 'marketings' && <AdminMarketingSection />}
          {validSection === 'memberships' && <AdminMembershipsSection onUpdate={refreshStats} />}
          {validSection === 'reviews' && <AdminSettingsSection onUpdate={refreshStats} />}
          {validSection === 'general' && <AdminGeneralSection onUpdate={refreshStats} />}
          {validSection === 'notifications' && <AdminNotificationsSection onUpdate={refreshStats} />}
        </div>
      </main>
    </div>
  );
}
