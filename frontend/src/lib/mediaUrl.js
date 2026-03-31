import { BACKEND_URL } from './api';

const DEV_HOSTS = new Set(['localhost', '127.0.0.1']);

/**
 * Absolute URL to media served by this app’s API (/uploads/...).
 * Always uses REACT_APP_BACKEND_URL — do not use a relative /uploads path here:
 * the CRA dev proxy often breaks MP4 streaming (Range requests).
 */
export function resolveMediaUrl(url) {
  if (!url || typeof url !== 'string') return '';
  let trimmed = url.trim();
  // Normalize bare "uploads/..." so we join to API base (detail pages break on relative paths).
  if (!trimmed.startsWith('http') && !trimmed.startsWith('/') && trimmed.startsWith('uploads')) {
    trimmed = `/${trimmed}`;
  }
  const apiBase = (BACKEND_URL || '').replace(/\/$/, '');
  if (!apiBase) return trimmed;

  try {
    const api = new URL(apiBase);
    if (trimmed.startsWith('http')) {
      const u = new URL(trimmed);
      if (!u.pathname.startsWith('/uploads')) return trimmed;

      const sameOrigin = u.origin === api.origin;
      const loopbackSamePort =
        DEV_HOSTS.has(u.hostname) &&
        DEV_HOSTS.has(api.hostname) &&
        u.port === api.port;

      if (sameOrigin || loopbackSamePort) {
        return `${apiBase}${u.pathname}${u.search}${u.hash}`;
      }
      // DB or older code may store full site URLs like https://heyalberta.com/uploads/...
      // Files are always served by the API (Railway), not the static frontend host.
      return `${apiBase}${u.pathname}${u.search}${u.hash}`;
    }
    if (trimmed.startsWith('/uploads')) {
      return `${apiBase}${trimmed}`;
    }
  } catch {
    return trimmed;
  }
  return trimmed;
}
