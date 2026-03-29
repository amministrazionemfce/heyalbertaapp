import axios from 'axios';

// Use REACT_APP_BACKEND_URL from .env, or fallback for local dev (e.g. backend on port 8000)
export const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';
const API = axios.create({
  baseURL: `${BACKEND_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('hey_alberta_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('hey_alberta_token');
      localStorage.removeItem('hey_alberta_user');
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
};

/** Stripe: backend creates Checkout / Customer Portal sessions (requires auth). */
export const billingAPI = {
  createCheckoutSession: (body) => API.post('/billing/checkout-session', body),
  getCheckoutSessionStatus: (sessionId) =>
    API.get('/billing/checkout-session-status', { params: { session_id: sessionId } }),
  createPortalSession: () => API.post('/billing/portal-session', {}),
  /** Refresh Vendor.tier from Stripe (after checkout or if webhook missed). */
  syncSubscription: () => API.post('/billing/sync-subscription', {}),
};

/** Upload a promotional video (auth required). Returns `{ url }` for storing on vendor.videoUrl. */
export function uploadVendorVideo(file) {
  const form = new FormData();
  form.append('video', file);
  const token = localStorage.getItem('hey_alberta_token');
  return axios.post(`${BACKEND_URL}/api/uploads/video`, form, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

/** Profile avatar (auth). Returns `{ url }` for storing on user.avatar_url. */
export function uploadAvatar(file) {
  const form = new FormData();
  form.append('avatar', file);
  const token = localStorage.getItem('hey_alberta_token');
  return axios.post(`${BACKEND_URL}/api/uploads/avatar`, form, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

/** Admin-only generic image upload (city/category hero overrides). Returns `{ url }`. */
export function uploadAdminImage(file) {
  const form = new FormData();
  form.append('image', file);
  const token = localStorage.getItem('hey_alberta_token');
  return axios.post(`${BACKEND_URL}/api/uploads/image`, form, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

// Vendors
export const vendorAPI = {
  list: (params) => API.get('/vendors', { params }),
  count: () => API.get('/vendors/count'),
  get: (id) => API.get(`/vendors/${id}`),
  create: (data) => API.post('/vendors', data),
  update: (id, data) => API.put(`/vendors/${id}`, data),
  delete: (id) => API.delete(`/vendors/${id}`),
  myVendors: () => API.get('/my-vendors'),
};

// Reviews (backend: /reviews/vendors/:vendorId)
export const reviewAPI = {
  list: (vendorId) => API.get(`/reviews/vendors/${vendorId}`),
  create: (vendorId, data) => API.post(`/reviews/vendors/${vendorId}`, data),
  reply: (reviewId, data) => API.put(`/reviews/${reviewId}/reply`, data),
};

// Listings (per-vendor listings, not the Vendor/business)
export const listingAPI = {
  get: (id) => API.get(`/listings/${id}`),
  myListings: () => API.get('/listings/my-listings'),
  listByVendor: (vendorId) => API.get('/listings/listByVendor', { params: { vendorId } }),
  countsByCategory: () => API.get('/listings/counts-by-category'),
  countsByCity: () => API.get('/listings/counts-by-city'),
  cityImages: () => API.get('/listings/city-images'),
  categoryImages: () => API.get('/listings/category-images'),
  directory: (params) => API.get('/listings', { params }),
  create: (data) => API.post('/listings', data),
  update: (id, data) => API.put(`/listings/${id}`, data),
  delete: (id) => API.delete(`/listings/${id}`),
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

// Admin
export const adminAPI = {
  vendors: (params) => API.get('/admin/vendors', { params }),
  getVendor: (id) => API.get(`/admin/vendors/${id}`),
  updateVendor: (id, data) => API.put(`/admin/vendors/${id}`, data),
  approveVendor: (id) => API.put(`/admin/vendors/${id}/approve`),
  rejectVendor: (id) => API.put(`/admin/vendors/${id}/reject`),
  featureVendor: (id, featured) => API.put(`/admin/vendors/${id}/feature`, { featured }),
  /** Cascade: deletes all listings & reviews for this vendor, then the vendor. */
  deleteVendor: (id, body) => API.delete(`/admin/vendors/${id}`, { data: body || {} }),
  listings: (params) => API.get('/admin/listings', { params }),
  featureListing: (id, featured) => API.put(`/admin/listings/${id}/feature`, { featured }),
  stats: () => API.get('/admin/stats'),
  users: () => API.get('/admin/users'),
  cityImages: () => API.get('/admin/city-images'),
  updateCityImages: (cities) => API.put('/admin/city-images', { cities }),
  categoryImages: () => API.get('/admin/category-images'),
  updateCategoryImages: (categories) => API.put('/admin/category-images', { categories }),
  siteSettings: () => API.get('/admin/site-settings'),
  updateSiteSettings: (data) => API.put('/admin/site-settings', data),
  contactMessages: (params) => API.get('/admin/contact-messages', { params }),
  markContactMessageRead: (id) => API.patch(`/admin/contact-messages/${id}/read`),
};

export default API;