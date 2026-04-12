/**
 * Site-wide copy and contact — footer, meta, etc.
 * Adjust branding and legal placeholders in one place.
 */
import { ROUTES } from './routes';

export const SITE_CONTACT = Object.freeze({
  email: 'hello@heyalberta.ca',
  phoneDisplay: '(403) 555-0100',
  phoneHref: 'tel:+14035550100',
});

export const SITE_TAGLINE = Object.freeze({
  FOOTER:
    'Your trusted companion for relocating to Alberta. Find local services and everything you need for a smooth transition.',
});

export const SITE_LEGAL = Object.freeze({
  COPYRIGHT_LINE: '2026 Hey Alberta. All rights reserved.',
  PRIVACY_LABEL: 'Privacy Policy',
  PRIVACY_HREF: ROUTES.PRIVACY_POLICY,
  TERMS_LABEL: 'Terms of Service',
  TERMS_HREF: ROUTES.TERMS_OF_SERVICE,
});
