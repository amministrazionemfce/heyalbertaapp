/**
 * Application route pathnames — single source of truth.
 * Keep in sync with <Route path={...}> in App.js.
 */
export const ROUTES = Object.freeze({
  HOME: '/',
  DIRECTORY: '/directory',
  RESOURCES: '/resources',
  ABOUT: '/about',
  CONTACT: '/contact',
  REGISTER: '/register',
  LOGIN: '/login',
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
});

/** Vendor dashboard — add listing tab (query string) */
export const DASHBOARD_ADD_LISTING = `${ROUTES.DASHBOARD}?tab=add-listing`;

export function listingPath(id) {
  return `${ROUTES.LISTINGS}/${id}`;
}

export function vendorPath(id) {
  return `${ROUTES.VENDORS}/${id}`;
}

export function directoryCategoryQuery(categoryId) {
  return `${ROUTES.DIRECTORY}?category=${encodeURIComponent(categoryId)}`;
}

export function directoryCityQuery(cityName) {
  return `${ROUTES.DIRECTORY}?city=${encodeURIComponent(cityName)}`;
}

export function directorySearchQuery(search) {
  return `${ROUTES.DIRECTORY}?search=${encodeURIComponent(search)}`;
}
