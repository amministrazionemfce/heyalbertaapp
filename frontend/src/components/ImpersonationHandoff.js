import { useLayoutEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '../lib/auth';
import { IMPERSONATION_HANDOFF_PREFIX } from '../lib/authStorage';

export { IMPERSONATION_HANDOFF_PREFIX };

/**
 * Consumes `?impersonate=<nonce>` + matching localStorage payload (written by admin “preview as user”).
 * Uses sessionStorage for the preview JWT so other tabs keep the admin’s localStorage session.
 * useLayoutEffect runs before AuthProvider’s useEffect loadUser, avoiding a flash of the wrong account.
 */
export function ImpersonationHandoff() {
  const location = useLocation();
  const navigate = useNavigate();
  const { applySession } = useAuth();

  useLayoutEffect(() => {
    const params = new URLSearchParams(location.search);
    const id = params.get('impersonate');
    if (!id) return;

    params.delete('impersonate');
    const nextSearch = params.toString();
    const nextPath = `${location.pathname}${nextSearch ? `?${nextSearch}` : ''}${location.hash || ''}`;

    const key = `${IMPERSONATION_HANDOFF_PREFIX}${id}`;
    let raw;
    try {
      raw = localStorage.getItem(key);
      if (raw) localStorage.removeItem(key);
    } catch {
      navigate(nextPath, { replace: true });
      return;
    }

    if (!raw) {
      navigate(nextPath, { replace: true });
      return;
    }

    try {
      const data = JSON.parse(raw);
      if (data.exp && data.exp < Date.now()) {
        toast.error('Preview link expired.');
      } else if (!data.token || !data.user) {
        toast.error('Preview link invalid.');
      } else {
        applySession(data.token, data.user, { scope: 'session' });
        const label = data.user.name || data.user.email || 'user';
        toast.success(`Signed in as ${label} for preview.`);
      }
    } catch {
      toast.error('Could not complete preview sign-in.');
    } finally {
      navigate(nextPath, { replace: true });
    }
  }, [location.search, location.pathname, location.hash, navigate, applySession]);
}
