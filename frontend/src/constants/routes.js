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
  /** Email verification landing (query: token) */
  VERIFY_EMAIL: '/verify-email',
  /** Pre-Stripe subscription review (split layout like login) */
  CHECKOUT: '/checkout',
  CHECKOUT_RETURN: '/checkout/return',
  PROFILE: '/profile',
  DASHBOARD: '/dashboard',
  ADMIN: '/admin',
  /** Base segments for dynamic paths */
  LISTINGS: '/listings',
  /** @deprecated Public browse uses listings only; `/vendors` redirects to `/listings`. */
  VENDORS: '/vendors',
});

/** React Router patterns with params */
export const ROUTE_PATTERNS = Object.freeze({
  VENDOR_DETAIL: '/vendors/:id',
  LISTING_DETAIL: '/listings/:id',
  /** @deprecated Listings-only admin; use admin listings. Kept for old bookmarks. */
  ADMIN_VENDOR: '/admin/vendors/:vendorId',
});

/** Vendor dashboard — add listing tab (query string) */
export const DASHBOARD_ADD_LISTING = `${ROUTES.DASHBOARD}?tab=add-listing`;

/** Home page — public membership / pricing section (`<section id="membership">`) */
export const MEMBERSHIP_PLANS_URL = `${ROUTES.HOME}#membership`;

export function listingPath(id) {
  return `${ROUTES.LISTINGS}/${id}`;
}

/** All public seller links go to the listings directory filtered by account (userId). */
export function vendorPath(userId) {
  if (userId == null || userId === '') return ROUTES.LISTINGS;
  return `${ROUTES.LISTINGS}?userId=${encodeURIComponent(String(userId))}`;
}

/** @deprecated Vendors admin removed; opens admin home. */
export function adminVendorPath(_userId) {
  return ROUTES.ADMIN;
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
