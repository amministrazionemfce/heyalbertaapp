/**
 * Resolve vendor logo from public online sources (favicons first — more reliable than Clearbit).
 * Order matters: Google / DuckDuckGo before Clearbit to reduce failed requests & console noise.
 */

export function getDomainFromWebsite(website) {
  if (!website || typeof website !== 'string') return '';
  const trimmed = website.trim();
  if (!trimmed) return '';
  try {
    const withProto = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    const url = new URL(withProto);
    const host = url.hostname.toLowerCase();
    return host.replace(/^www\./, '') || '';
  } catch {
    return '';
  }
}

/**
 * Ordered list of logo URLs to try (first = preferred online brand mark).
 */
export function getVendorLogoCandidates(vendor) {
  const domain = getDomainFromWebsite(vendor?.website);
  const uploaded = vendor?.images?.[0];

  const online = [];
  if (domain) {
    online.push(
      `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`
    );
    online.push(`https://icons.duckduckgo.com/ip3/${domain}.ico`);
    online.push(`https://logo.clearbit.com/${domain}`);
  }
  if (uploaded) online.push(uploaded);

  return [...new Set(online.filter(Boolean))];
}

/** Logo candidates for a known public domain (partner strip, marketing). */
export function getPartnerLogoCandidates(domain) {
  if (!domain || typeof domain !== 'string') return [];
  const d = domain.trim().toLowerCase().replace(/^www\./, '');
  return [
    `https://www.google.com/s2/favicons?domain=${encodeURIComponent(d)}&sz=128`,
    `https://icons.duckduckgo.com/ip3/${d}.ico`,
    `https://logo.clearbit.com/${d}`,
  ];
}
