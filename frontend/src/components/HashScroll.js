import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Ensure in-app navigation to `/#hash` scrolls to the element.
 * React Router doesn't automatically scroll to hash targets.
 */
export function HashScroll() {
  const location = useLocation();

  useEffect(() => {
    const raw = location.hash || '';
    const id = raw.startsWith('#') ? raw.slice(1) : raw;
    if (!id) return;

    // Defer until after the next paint so the target section exists.
    const t = window.setTimeout(() => {
      const el = document.getElementById(id);
      if (el && typeof el.scrollIntoView === 'function') {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 0);

    return () => window.clearTimeout(t);
  }, [location.pathname, location.search, location.hash]);

  return null;
}

