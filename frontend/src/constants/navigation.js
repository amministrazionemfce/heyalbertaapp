import { ROUTES, MEMBERSHIP_PLANS_URL } from './routes';

/**
 * Primary header navigation (desktop + mobile sheet).
 * Edit labels or paths here only.
 */
export const MAIN_NAV_LINKS = Object.freeze([
  { to: ROUTES.HOME, label: 'Home' },
  { to: ROUTES.LISTINGS, label: 'Listings' },
  { to: ROUTES.NEWS, label: 'News' },
  { to: ROUTES.ABOUT, label: 'About' },
  { to: ROUTES.CONTACT, label: 'Contact' },
]);

/** Footer — “Quick Links” column */
export const FOOTER_QUICK_LINKS = Object.freeze([
  { to: ROUTES.LISTINGS, label: 'Browse listings' },
  { to: ROUTES.NEWS, label: 'News' },
  { to: ROUTES.ABOUT, label: 'About Us' },
  { to: ROUTES.CONTACT, label: 'Contact' },
  { to: ROUTES.REGISTER, label: 'List Your Business' },
]);

/** Footer — “For Vendors” column */
export const FOOTER_VENDOR_LINKS = Object.freeze([
  { to: ROUTES.REGISTER, label: 'Create Free Listing' },
  { to: MEMBERSHIP_PLANS_URL, label: 'Membership Tiers' },
  { to: ROUTES.LOGIN, label: 'Vendor Login' },
  { to: ROUTES.CONTACT, label: 'Partner With Us' },
]);

/** Footer column headings */
export const FOOTER_HEADINGS = Object.freeze({
  QUICK_LINKS: 'Quick Links',
  CATEGORIES: 'Categories',
  FOR_VENDORS: 'For Vendors',
});
