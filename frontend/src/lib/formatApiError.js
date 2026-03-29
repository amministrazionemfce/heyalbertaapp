/**
 * Turn axios/API errors into readable lines for inline form messages.
 * Supports Express `{ message }`, FastAPI `{ detail }`, and common variants.
 *
 * @param {unknown} err - Caught error (typically axios error)
 * @returns {string[]} Non-empty lines to show the user
 */
export function getApiErrorLines(err) {
  const res = err?.response;
  const status = res?.status;
  const data = res?.data;

  if (!res) {
    if (err?.code === 'ECONNABORTED' || err?.message?.includes?.('timeout')) {
      return ['The request timed out. Please try again.'];
    }
    if (err?.message === 'Network Error' || !navigator.onLine) {
      return [
        'Unable to reach the server. Check your internet connection and that the API is running, then try again.',
      ];
    }
    if (typeof err?.message === 'string' && err.message.trim()) {
      return [err.message.trim()];
    }
    return ['Something went wrong. Please try again.'];
  }

  if (typeof data === 'string' && data.trim()) {
    return [data.trim()];
  }

  if (data && typeof data === 'object') {
    if (typeof data.message === 'string' && data.message.trim()) {
      return [data.message.trim()];
    }
    if (Array.isArray(data.message)) {
      const lines = data.message.map((m) => (typeof m === 'string' ? m : JSON.stringify(m))).filter(Boolean);
      if (lines.length) return lines;
    }

    // FastAPI-style validation / errors
    if (typeof data.detail === 'string' && data.detail.trim()) {
      return [data.detail.trim()];
    }
    if (Array.isArray(data.detail)) {
      const lines = data.detail
        .map((item) => {
          if (typeof item === 'string') return item;
          if (item?.msg) {
            const loc = Array.isArray(item.loc) ? item.loc.filter((p) => p !== 'body').join('.') : '';
            return loc ? `${loc}: ${item.msg}` : item.msg;
          }
          try {
            return JSON.stringify(item);
          } catch {
            return String(item);
          }
        })
        .filter(Boolean);
      if (lines.length) return lines;
    }

    // Mongoose-style or generic field map
    if (data.errors && typeof data.errors === 'object') {
      const lines = Object.entries(data.errors).map(([key, val]) => {
        if (typeof val === 'string') return `${key}: ${val}`;
        if (val?.message) return `${key}: ${val.message}`;
        return `${key}: ${String(val)}`;
      });
      if (lines.length) return lines;
    }

    if (data.error && typeof data.error === 'string' && data.error.trim()) {
      return [data.error.trim()];
    }
  }

  if (status === 401) {
    return ['Invalid email or password.'];
  }
  if (status === 403) {
    return ["You don't have permission to do that."];
  }
  if (status === 404) {
    return ['The requested resource was not found.'];
  }
  if (status >= 500) {
    return ['The server had a problem. Please try again in a moment.'];
  }

  return [`Request failed (${status || 'error'}). Please try again.`];
}
