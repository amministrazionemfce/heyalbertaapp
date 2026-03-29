/**
 * Application route pathnames — single source of truth.
 * Keep in sync with <Route path={...}> in App.js.
 */
export const ROUTES = Object.freeze({
  HOME: '/',
  /** News & articles (public) */
  NEWS: '/news',
  /** @deprecated Use NEWS — kept for redirects */
  RESOURCES: '/resources',
  ABOUT: '/about',
  CONTACT: '/contact',
  REGISTER: '/register',
  LOGIN: '/login',
  /** Pre-Stripe subscription review (split layout like login) */
  CHECKOUT: '/checkout',
  CHECKOUT_RETURN: '/checkout/return',
  PROFILE: '/profile',
  DASHBOARD: '/dashboard',
  ADMIN: '/admin',
  /** Base segments for dynamic paths */
  LISTINGS: '/listings',
  VENDORS: '/vendors',
});

/** React Router patterns with params */
export const ROUTE_PATTERNS = Object.freeze({
  VENDOR_DETAIL: '/vendors/:id',
  LISTING_DETAIL: '/listings/:id',
  /** Admin-only vendor management */
  ADMIN_VENDOR: '/admin/vendors/:vendorId',
});

/** Vendor dashboard — add listing tab (query string) */
export const DASHBOARD_ADD_LISTING = `${ROUTES.DASHBOARD}?tab=add-listing`;

export function listingPath(id) {
  return `${ROUTES.LISTINGS}/${id}`;
}

export function vendorPath(id) {
  return `${ROUTES.VENDORS}/${id}`;
}

/** Admin dashboard — single vendor review / actions */
export function adminVendorPath(id) {
  return `${ROUTES.ADMIN}/vendors/${id}`;
}

export function directoryCategoryQuery(categoryId) {
  return `${ROUTES.LISTINGS}?category=${encodeURIComponent(categoryId)}`;
}

export function directoryCityQuery(cityName) {
  return `${ROUTES.LISTINGS}?city=${encodeURIComponent(cityName)}`;
}

export function directorySearchQuery(search) {
  return `${ROUTES.LISTINGS}?search=${encodeURIComponent(search)}`;
}
