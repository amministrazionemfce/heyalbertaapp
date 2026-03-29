/** Monday-first order for display (matches common business hours UIs). */
export const OPENING_DAY_ORDER = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];

export const OPENING_DAY_LABELS = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday',
};

const JS_DAY_TO_KEY = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

export function emptyOpeningHours() {
  return {
    monday: '',
    tuesday: '',
    wednesday: '',
    thursday: '',
    friday: '',
    saturday: '',
    sunday: '',
  };
}

function parseTimeToken(str, { endOfDayMidnight = false } = {}) {
  const m = String(str).trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!m) return null;
  let h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  const ap = m[3].toUpperCase();
  if (ap === 'PM' && h !== 12) h += 12;
  if (ap === 'AM' && h === 12) h = 0;
  let total = h * 60 + min;
  if (endOfDayMidnight && total === 0 && ap === 'AM') {
    return 24 * 60;
  }
  return total;
}

function parseHoursRange(line) {
  if (line == null || typeof line !== 'string') return null;
  const s = line.trim();
  if (!s) return null;
  const lower = s.toLowerCase();
  if (lower === 'closed' || lower === '—' || lower === '-') return { closed: true };

  const parts = s.split(/\s*[-–—]\s+/);
  if (parts.length < 2) return null;
  const open = parseTimeToken(parts[0], { endOfDayMidnight: false });
  const close = parseTimeToken(parts[1], { endOfDayMidnight: true });
  if (open === null || close === null) return null;
  const overnight = close < open;
  return { open, close, overnight };
}

export function isOpenFromHoursLine(line, now = new Date()) {
  const parsed = parseHoursRange(line);
  if (!parsed) return null;
  if (parsed.closed) return false;
  const { open, close, overnight } = parsed;
  const mins = now.getHours() * 60 + now.getMinutes();
  if (!overnight) {
    return mins >= open && mins < close;
  }
  return mins >= open || mins < close;
}

/**
 * @returns {{ known: boolean, open: boolean, dayKey: string }}
 */
export function getNowOpenStatus(openingHours, now = new Date()) {
  const dayKey = JS_DAY_TO_KEY[now.getDay()];
  const line = openingHours?.[dayKey];
  if (line == null || !String(line).trim()) {
    return { known: false, open: false, dayKey };
  }
  const lower = String(line).trim().toLowerCase();
  if (lower === 'closed' || lower === '—') {
    return { known: true, open: false, dayKey };
  }
  const o = isOpenFromHoursLine(String(line), now);
  if (o === null) {
    return { known: false, open: false, dayKey };
  }
  return { known: true, open: o, dayKey };
}

export function formatLocaleDateTime(d = new Date()) {
  return d.toLocaleString(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
