/**
 * Format dates for admin tables/grids (joined, registered).
 * Falls back to Mongo ObjectId creation time when no explicit date exists.
 */

function fromObjectId(id) {
  const s = id != null ? String(id) : '';
  if (!/^[a-f0-9]{24}$/i.test(s)) return null;
  const ts = parseInt(s.slice(0, 8), 16) * 1000;
  const d = new Date(ts);
  return Number.isNaN(d.getTime()) ? null : d;
}

function coerceDate(value) {
  if (value == null || value === '') return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  const t = Date.parse(String(value));
  if (!Number.isNaN(t)) return new Date(t);
  return null;
}

/**
 * @param {{ id?: string, _id?: string, createdAt?: unknown }} record
 */
export function formatAdminJoinedAt(record) {
  if (!record) return '—';
  const explicit = coerceDate(record.createdAt);
  const d = explicit || fromObjectId(record.id || record._id);
  if (!d) return '—';
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

/**
 * @param {{ id?: string, createdAt?: unknown }} record
 */
export function formatListingRegisteredAt(record) {
  if (!record) return '—';
  const d = coerceDate(record.createdAt) || fromObjectId(record.id);
  if (!d) return '—';
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}
