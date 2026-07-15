/**
 * Session management for AmnesiaIP auth state.
 * Uses sessionStorage — cleared when browser tab closes.
 */

const SESSION_KEY = 'amnesia_auth';
const REMEMBER_KEY = 'amnesia_remember_email';

/**
 * @returns {boolean}
 */
export function isAuthenticated() {
  return getSession() !== null;
}

/**
 * @returns {{ role: string, name: string, email?: string } | null}
 */
export function getSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * @param {{ role: string, name: string, email?: string }} data
 */
export function setSession(data) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(data));
}

export function clearSession() {
  sessionStorage.removeItem(SESSION_KEY);
}

/**
 * @returns {string | null}
 */
export function getRememberedEmail() {
  return localStorage.getItem(REMEMBER_KEY);
}

/**
 * @param {string} email
 */
export function setRememberedEmail(email) {
  localStorage.setItem(REMEMBER_KEY, email);
}

export function clearRememberedEmail() {
  localStorage.removeItem(REMEMBER_KEY);
}
