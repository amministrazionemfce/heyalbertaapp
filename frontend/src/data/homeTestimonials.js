/** Default home page “What People Say” cards — used when SiteSettings has none saved. */
export const DEFAULT_TESTIMONIALS_HEADING = 'What People Say About Us';

/** YYYY-MM-DD stored in DB; shown on site as a friendly local date. */
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function formatTestimonialTimeLabel(time) {
  if (time == null || !String(time).trim()) return '';
  const s = String(time).trim();
  if (ISO_DATE_RE.test(s)) {
    const d = new Date(`${s}T12:00:00`);
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    }
  }
  return s;
}

/** Value for <input type="date" /> — only when time is already YYYY-MM-DD. */
export function testimonialTimeToDateInputValue(time) {
  if (time == null || !String(time).trim()) return '';
  const s = String(time).trim();
  return ISO_DATE_RE.test(s) ? s : '';
}

export const DEFAULT_HOME_TESTIMONIALS = Object.freeze([
  {
    id: '1',
    name: 'Priya K.',
    time: '2026-03-26',
    text:
      'Hey Alberta made finding a realtor and movers so simple. Everything was clear and the vendors actually responded!',
    rating: 5,
  },
  {
    id: '2',
    name: 'Marcus T.',
    time: '2026-03-20',
    text:
      'We relocated from Ontario and used the guides plus the directory. Saved us hours of googling random companies.',
    rating: 5,
  },
  {
    id: '3',
    name: 'Elena R.',
    time: '2026-03-14',
    text:
      'Loved how easy it was to compare childcare and healthcare providers for our family in one place.',
    rating: 5,
  },
  {
    id: '4',
    name: 'James W.',
    time: '2026-03-07',
    text:
      'Clean layout, easy filters by city. Found a great home services company in Calgary within a day.',
    rating: 5,
  },
]);

function clampRating(n) {
  const x = Number.parseInt(String(n), 10);
  if (Number.isNaN(x)) return 5;
  return Math.min(5, Math.max(1, x));
}

export function normalizeHomeTestimonial(raw, index) {
  const id = String(raw?.id ?? '').trim() || `t-${index}`;
  return {
    id,
    name: String(raw?.name ?? '').trim(),
    time: String(raw?.time ?? '').trim(),
    text: String(raw?.text ?? '').trim(),
    rating: clampRating(raw?.rating),
  };
}

/**
 * @param {Record<string, unknown> | null | undefined} settings
 * @returns {typeof DEFAULT_HOME_TESTIMONIALS}
 */
export function mergeHomeTestimonialsFromSettings(settings) {
  const raw = settings?.homeTestimonials;
  if (!Array.isArray(raw) || raw.length === 0) {
    return DEFAULT_HOME_TESTIMONIALS.map((t) => ({ ...t }));
  }
  const list = raw.map((x, i) => normalizeHomeTestimonial(x, i)).filter((t) => t.name && t.text);
  if (!list.length) return DEFAULT_HOME_TESTIMONIALS.map((t) => ({ ...t }));
  return list;
}

export function homeTestimonialsHeadingFromSettings(settings) {
  const h = settings?.homeTestimonialsHeading;
  if (h != null && String(h).trim()) return String(h).trim();
  return DEFAULT_TESTIMONIALS_HEADING;
}

/**
 * Admin form merge: saved site settings + defaults (prepopulate).
 */
export function mergeApiHomeTestimonialsForm(apiData) {
  const baseHeading = DEFAULT_TESTIMONIALS_HEADING;
  const baseList = DEFAULT_HOME_TESTIMONIALS.map((t) => ({ ...t }));
  const d = apiData || {};
  const heading =
    d.homeTestimonialsHeading != null && String(d.homeTestimonialsHeading).trim()
      ? String(d.homeTestimonialsHeading).trim()
      : baseHeading;
  let homeTestimonials = baseList;
  if (Array.isArray(d.homeTestimonials) && d.homeTestimonials.length > 0) {
    const parsed = d.homeTestimonials.map((x, i) => normalizeHomeTestimonial(x, i)).filter((t) => t.name && t.text);
    if (parsed.length > 0) homeTestimonials = parsed;
  }
  return { homeTestimonialsHeading: heading, homeTestimonials };
}
