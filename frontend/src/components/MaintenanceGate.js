import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { siteAPI } from '../lib/api';
import MaintenancePage from '../pages/MaintenancePage';
import { ROUTES } from '../constants';

/**
 * When the API reports maintenance mode, block the public SPA for everyone except admins.
 */
export function MaintenanceGate({ children }) {
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    let cancelled = false;
    siteAPI
      .settings()
      .then((r) => {
        if (!cancelled) setSettings(r.data || {});
      })
      .catch(() => {
        if (!cancelled) setSettings({});
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const onFocus = () => {
      siteAPI
        .settings()
        .then((r) => setSettings(r.data || {}))
        .catch(() => {});
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  if (authLoading || settings === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50" data-testid="maintenance-gate-loading">
        <Loader2 className="w-10 h-10 animate-spin text-spruce-800" aria-hidden />
      </div>
    );
  }

  if (user?.role === 'admin') {
    return children;
  }

  const path = location.pathname;
  const allowDuringMaintenance = path === ROUTES.LOGIN || path === ROUTES.ADMIN;

  if (settings?.maintenanceMode && !allowDuringMaintenance) {
    return <MaintenancePage message={settings.maintenanceMessage} />;
  }

  return children;
}
