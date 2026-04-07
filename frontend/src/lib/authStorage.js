/** Token + profile persistence. Normal login uses localStorage (shared, survives refresh). */
export const AUTH_TOKEN_KEY = 'hey_alberta_token';
export const AUTH_USER_KEY = 'hey_alberta_user';

/** One-time payload from admin “preview as user” before redirect (cross-tab handoff). */
export const IMPERSONATION_HANDOFF_PREFIX = 'hey_alberta_imp_handoff_';

/** @returns {'session' | 'local' | null} */
export function getAuthPersistenceScope() {
  if (typeof window === 'undefined') return null;
  try {
    if (sessionStorage.getItem(AUTH_TOKEN_KEY)) return 'session';
    if (localStorage.getItem(AUTH_TOKEN_KEY)) return 'local';
    return null;
  } catch {
    return localStorage.getItem(AUTH_TOKEN_KEY) ? 'local' : null;
  }
}

/** Tab-only preview session wins over persisted login so admin tabs keep their token in localStorage. */
export function getStoredAuthToken() {
  if (typeof window === 'undefined') return null;
  try {
    return (
      sessionStorage.getItem(AUTH_TOKEN_KEY) ||
      localStorage.getItem(AUTH_TOKEN_KEY) ||
      null
    );
  } catch {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  }
}

/** User JSON for whichever store currently holds the active token. */
export function getStoredUserJson() {
  const scope = getAuthPersistenceScope();
  if (scope === 'session') {
    try {
      return sessionStorage.getItem(AUTH_USER_KEY);
    } catch {
      return null;
    }
  }
  if (scope === 'local') {
    try {
      return localStorage.getItem(AUTH_USER_KEY);
    } catch {
      return null;
    }
  }
  return null;
}

export function clearSessionAuth() {
  try {
    sessionStorage.removeItem(AUTH_TOKEN_KEY);
    sessionStorage.removeItem(AUTH_USER_KEY);
  } catch {
    /* ignore */
  }
}

export function clearLocalAuth() {
  try {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
  } catch {
    /* ignore */
  }
}

export function clearAllAuthStorage() {
  clearSessionAuth();
  clearLocalAuth();
}

/**
 * Clear whichever store was used for the current request token (avoids wiping admin localStorage on preview-tab 401).
 */
export function clearAuthForCurrentScope() {
  const scope = getAuthPersistenceScope();
  if (scope === 'session') clearSessionAuth();
  else if (scope === 'local') clearLocalAuth();
  else clearAllAuthStorage();
}
