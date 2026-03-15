import axios from 'axios';

// Use REACT_APP_BACKEND_URL from .env, or fallback for local dev (e.g. backend on port 8000)
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';
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

// Vendors
export const vendorAPI = {
  list: (params) => API.get('/vendors', { params }),
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
  directory: (params) => API.get('/listings', { params }),
  create: (data) => API.post('/listings', data),
  update: (id, data) => API.put(`/listings/${id}`, data),
  delete: (id) => API.delete(`/listings/${id}`),
};

// Categories
export const categoryAPI = {
  list: () => API.get('/categories'),
};

// Resources
export const resourceAPI = {
  list: (params) => API.get('/resources', { params }),
  create: (data) => API.post('/resources', data),
  delete: (id) => API.delete(`/resources/${id}`),
};

// Admin
export const adminAPI = {
  vendors: (params) => API.get('/admin/vendors', { params }),
  approveVendor: (id) => API.put(`/admin/vendors/${id}/approve`),
  rejectVendor: (id) => API.put(`/admin/vendors/${id}/reject`),
  featureVendor: (id, featured) => API.put(`/admin/vendors/${id}/feature`, { featured }),
  stats: () => API.get('/admin/stats'),
  users: () => API.get('/admin/users'),
};

export default API;