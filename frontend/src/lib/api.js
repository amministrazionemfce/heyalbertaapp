import axios from 'axios';
import {
  clearAuthForCurrentScope,
  getStoredAuthToken,
} from './authStorage';

/**
 * If REACT_APP_BACKEND_URL has no `http://` or `https://`, axios treats it as a path on the
 * current site (e.g. https://heyalberta.com/your-api.up.railway.app/api/...) → 404.
 */
function normalizeBackendUrl(raw) {
  const fallback = 'http://localhost:8000';
  let u = String(raw ?? '').trim();
  if (!u) return fallback;
  if (u.startsWith('//')) {
    u = `https:${u}`;
  } else if (!/^https?:\/\//i.test(u)) {
    const hostStart = u.replace(/^\/+/, '');
    const isLocal = /^localhost\b/i.test(hostStart) || /^127\.0\.0\.1\b/.test(hostStart);
    u = `${isLocal ? 'http' : 'https'}://${hostStart}`;
  }
  try {
    return new URL(u).origin;
  } catch {
    return fallback;
  }
}

function hostnameIsLocal(host) {
  if (!host) return false;
  const h = String(host).toLowerCase();
  return h === 'localhost' || h === '127.0.0.1' || h === '[::1]' || h === '0.0.0.0';
}

/**
 * CRA dev: if you open the app on localhost but REACT_APP_BACKEND_URL points at production
 * (Railway, etc.), use the local API anyway so `npm start` always hits localhost:8000.
 * Production builds keep whatever URL was set at build time.
 */
function resolveBackendUrl() {
  const raw = process.env.REACT_APP_BACKEND_URL;
  let origin = normalizeBackendUrl(raw);

  if (process.env.NODE_ENV !== 'development' || typeof window === 'undefined') {
    return origin;
  }

  const pageHost = window.location.hostname;
  if (!hostnameIsLocal(pageHost)) {
    return origin;
  }

  try {
    const apiHost = new URL(origin).hostname;
    if (!hostnameIsLocal(apiHost)) {
      return 'http://localhost:8000';
    }
  } catch {
    return 'http://localhost:8000';
  }

  return origin;
}

export const BACKEND_URL = resolveBackendUrl();

/** Ngrok free tier serves a browser warning HTML page unless this header is sent; that page has no CORS headers, so the browser reports a CORS failure. */
function isNgrokBackendUrl(url) {
  try {
    const h = new URL(url).hostname;
    return h === 'ngrok-free.app' || h.endsWith('.ngrok-free.app') || h.endsWith('.ngrok.io');
  } catch {
    return false;
  }
}

const NGROK_SKIP_WARNING = isNgrokBackendUrl(BACKEND_URL);

/** Merge into `fetch(..., { headers })` when calling BACKEND_URL through ngrok free. */
export const BACKEND_EXTRA_FETCH_HEADERS = NGROK_SKIP_WARNING
  ? { 'ngrok-skip-browser-warning': 'true' }
  : {};

const API = axios.create({
  baseURL: `${BACKEND_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
    ...(NGROK_SKIP_WARNING ? { 'ngrok-skip-browser-warning': 'true' } : {}),
  },
});

API.interceptors.request.use((config) => {
  const token = getStoredAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (NGROK_SKIP_WARNING) {
    config.headers['ngrok-skip-browser-warning'] = 'true';
  }
  return config;
});

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearAuthForCurrentScope();
    }
    return Promise.reject(error);
  }
);

// Auth
export const authAPI = {
  register: (data) => API.post('/auth/register', data),
  login: (data) => API.post('/auth/login', data),
  me: () => API.get('/auth/me'),
  updateMe: (data) => API.patch('/auth/me', data),
  verifyEmail: (token) =>
    API.get('/auth/verify-email', { params: { token } }),
  resendVerification: (body) => API.post('/auth/resend-verification', body),
};

/** Stripe: backend creates Checkout / Customer Portal sessions (requires auth). */
export const billingAPI = {
  createCheckoutSession: (body) => API.post('/billing/checkout-session', body),
  getCheckoutSessionStatus: (sessionId) =>
    API.get('/billing/checkout-session-status', { params: { session_id: sessionId } }),
  createPortalSession: () => API.post('/billing/portal-session', {}),
  /** Refresh listing tiers from Stripe (after checkout or if webhook missed). */
  syncSubscription: () => API.post('/billing/sync-subscription', {}),
};

/** Upload a promotional video (auth required). Returns `{ url }` for storing on listing.videoUrl. */
function uploadHeaders(extra = {}) {
  const token = getStoredAuthToken();
  return {
    ...extra,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(NGROK_SKIP_WARNING ? { 'ngrok-skip-browser-warning': 'true' } : {}),
  };
}

export function uploadVendorVideo(file) {
  const form = new FormData();
  form.append('video', file);
  return axios.post(`${BACKEND_URL}/api/uploads/video`, form, {
    headers: uploadHeaders(),
  });
}

/** Profile avatar (auth). Returns `{ url }` for storing on user.avatar_url. */
export function uploadAvatar(file) {
  const form = new FormData();
  form.append('avatar', file);
  return axios.post(`${BACKEND_URL}/api/uploads/avatar`, form, {
    headers: uploadHeaders(),
  });
}

/** Admin-only generic image upload (city/category hero overrides). Returns `{ url }`. */
export function uploadAdminImage(file) {
  const form = new FormData();
  form.append('image', file);
  return axios.post(`${BACKEND_URL}/api/uploads/image`, form, {
    headers: uploadHeaders(),
  });
}

// Reviews (per listing)
export const reviewAPI = {
  list: (listingId) => API.get(`/reviews/listings/${listingId}`),
  create: (listingId, data) => API.post(`/reviews/listings/${listingId}`, data),
  reply: (reviewId, data) => API.put(`/reviews/${reviewId}/reply`, data),
};

export const listingAPI = {
  get: (id) => API.get(`/listings/${id}`),
  myListings: () => API.get('/listings/my-listings'),
  countsByCategory: () => API.get('/listings/counts-by-category'),
  countsByCity: () => API.get('/listings/counts-by-city'),
  cityImages: () => API.get('/listings/city-images'),
  categoryImages: () => API.get('/listings/category-images'),
  directory: (params, axiosConfig = {}) => {
    const { headers, ...rest } = axiosConfig;
    return API.get('/listings', {
      ...rest,
      params,
      headers: {
        'Cache-Control': 'no-store',
        Pragma: 'no-cache',
        ...(headers || {}),
      },
    });
  },
  create: (data) => API.post('/listings', data),
  update: (id, data) => API.put(`/listings/${id}`, data),
  delete: (id) => API.delete(`/listings/${id}`),
  deleteMine: () => API.delete('/listings/mine'),
};

// Categories
export const categoryAPI = {
  list: () => API.get('/categories'),
};

// Resources / News (articles & browse cards)
export const resourceAPI = {
  list: (params) => API.get('/resources', { params }),
  create: (data) => API.post('/resources', data),
  update: (id, data) => API.put(`/resources/${id}`, data),
  delete: (id) => API.delete(`/resources/${id}`),
};

/** Public site copy (News hero text, etc.) */
export const siteAPI = {
  settings: () => API.get('/site-settings'),
};

/** Public contact form — no auth */
export const contactAPI = {
  submit: (data) => API.post('/contact', data),
};

/** Public — subscribe email for new article notifications */
export const newsSubscribeAPI = {
  subscribe: (email) => API.post('/news-subscribe', { email }),
};

// Admin
export const adminAPI = {
  listings: (params) => API.get('/admin/listings', { params }),
  moderateListing: (listingId, body) => API.put(`/admin/listings/${listingId}/moderation`, body),
  stats: () => API.get('/admin/stats'),
  /** @param {Record<string, string|number>} [params] — page, limit, q, roleFilter, membershipFilter, sort, order */
  users: (params) => API.get('/admin/users', { params: params || {} }),
  /** @param {{ role: string, adminPassword: string }} body */
  switchUserRole: (userId, body) => API.patch(`/admin/users/${userId}/role`, body),
  /** @param {{ adminPassword: string }} body */
  impersonateUser: (userId, body) => API.post(`/admin/users/${userId}/impersonate`, body),
  emailUsers: (body) => API.post('/admin/users/email', body),
  bulkDeleteUsers: (body) => API.post('/admin/users/bulk-delete', body),
  cityImages: () => API.get('/admin/city-images'),
  updateCityImages: (cities) => API.put('/admin/city-images', { cities }),
  categoryImages: () => API.get('/admin/category-images'),
  updateCategoryImages: (categories) => API.put('/admin/category-images', { categories }),
  siteSettings: () => API.get('/admin/site-settings'),
  updateSiteSettings: (data) => API.put('/admin/site-settings', data),
  /** @param {{ adminPassword: string }} body — downloads MongoDB JSON backup */
  downloadMongoBackup: (body) =>
    API.post('/admin/backup/mongodb', body, { responseType: 'blob' }),
  /** @param {{ adminPassword: string, maintenanceMode: boolean, maintenanceMessage?: string }} body */
  setMaintenanceMode: (body) => API.post('/admin/maintenance', body),
  contactMessages: (params) => API.get('/admin/contact-messages', { params }),
  markContactMessageRead: (id) => API.patch(`/admin/contact-messages/${id}/read`),
  replyContactMessage: (id, body) => API.post(`/admin/contact-messages/${id}/reply`, body),
  /** Notifications */
  notificationUsers: (params) => API.get('/admin/notifications/users', { params: params || {} }),
  /** Listing reviews (admin) */
  listingReviews: (params) => API.get('/admin/reviews', { params: params || {} }),
  updateListingReview: (reviewId, body) => API.patch(`/admin/reviews/${reviewId}`, body),
  deleteListingReview: (reviewId) => API.delete(`/admin/reviews/${reviewId}`),
  marketingRecipientPools: () => API.get('/admin/marketing/recipient-pools'),
  sendMarketingEmail: (data) => API.post('/admin/marketing/send', data),
  newsSubscribers: () => API.get('/admin/news-subscribers'),
};

export default API;