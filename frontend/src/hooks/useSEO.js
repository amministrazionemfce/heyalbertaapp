import { useEffect } from 'react';

/**
 * Hook to manage page title, meta description, and Open Graph tags
 * @param {Object} meta
 * @param {string} meta.title - Page title (appended with " - Hey Alberta" if not already)
 * @param {string} meta.description - Meta description for SEO
 * @param {Object} [meta.og] - Open Graph tags
 * @param {string} [meta.og.image] - OG image URL
 * @param {string} [meta.og.url] - OG URL
 * @param {string} [meta.og.type] - OG type (default: "website")
 */
export function useSEO({
  title,
  description,
  og = {},
} = {}) {
  useEffect(() => {
    const metas = {
      'description': description || 'Connecting newcomers with trusted local businesses across Alberta.',
      'og:title': title || 'Hey Alberta',
      'og:description': description || 'Connecting newcomers with trusted local businesses across Alberta.',
      'og:type': og.type || 'website',
      'og:image': og.image || 'https://heyalberta.com/og-image.png',
      'og:url': og.url || typeof window !== 'undefined' ? window.location.href : 'https://heyalberta.com',
      'twitter:card': 'summary_large_image',
      'twitter:title': title || 'Hey Alberta',
      'twitter:description': description || 'Connecting newcomers with trusted local businesses across Alberta.',
      'twitter:image': og.image || 'https://heyalberta.com/og-image.png',
    };

    // Update title
    const fullTitle = title && !title.includes('Hey Alberta')
      ? `${title} - Hey Alberta`
      : title || 'Hey Alberta';
    document.title = fullTitle;

    // Update meta tags
    for (const [name, content] of Object.entries(metas)) {
      let element = document.querySelector(`meta[name="${name}"], meta[property="${name}"]`);
      if (!element) {
        element = document.createElement('meta');
        const isProperty = name.startsWith('og:') || name.startsWith('twitter:');
        if (isProperty) {
          element.setAttribute('property', name);
        } else {
          element.setAttribute('name', name);
        }
        document.head.appendChild(element);
      }
      element.content = content;
    }

    // Update canonical URL if provided
    if (og.url) {
      let canonical = document.querySelector('link[rel="canonical"]');
      if (!canonical) {
        canonical = document.createElement('link');
        canonical.rel = 'canonical';
        document.head.appendChild(canonical);
      }
      canonical.href = og.url;
    }
  }, [title, description, og]);
}
