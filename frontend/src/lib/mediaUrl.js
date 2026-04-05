import { BACKEND_URL } from './api';

/**
 * Static files live at `{origin}/uploads/...`, while the REST API is `{origin}/api/...`.
 * `REACT_APP_BACKEND_URL` should be the origin only, but if it ends with `/api`, strip it
 * so `/uploads` URLs resolve correctly.
 */
function backendOriginForUploads() {
  let base = String(BACKEND_URL || '')
    .trim()
    .replace(/\/$/, '');
  if (!base) return '';
  if (base.endsWith('/api')) {
    base = base.slice(0, -4).replace(/\/$/, '');
  }
  return base;
}

/**
 * Absolute URL to media served by this app’s API (/uploads/...).
 * Always uses REACT_APP_BACKEND_URL — do not use a relative /uploads path here:
 * the browser would request the static frontend host (404).
 */
export function resolveMediaUrl(url) {
  if (!url || typeof url !== 'string') return '';
  let trimmed = url.trim();
  // Normalize bare "uploads/..." so we join to API base (not under /api).
  if (!trimmed.startsWith('http') && !trimmed.startsWith('/') && trimmed.startsWith('uploads')) {
    trimmed = `/${trimmed}`;
  }
  const originBase = backendOriginForUploads();
  if (!originBase) return trimmed;

  try {
    if (trimmed.startsWith('http')) {
      const u = new URL(trimmed);
      if (!u.pathname.startsWith('/uploads')) return trimmed;
      // DB may store full URLs on the marketing domain; files are always on the API host.
      return `${originBase}${u.pathname}${u.search}${u.hash}`;
    }
    if (trimmed.startsWith('/uploads')) {
      return `${originBase}${trimmed}`;
    }
  } catch {
    return trimmed;
  }
  return trimmed;
}
