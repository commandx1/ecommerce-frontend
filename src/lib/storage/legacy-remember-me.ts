/**
 * Cleans up the pre-"Keep me signed in" remember-me keys, which stored the shopper's password
 * (and email) in plaintext in `localStorage`. Removed from the login page on mount and from
 * logout so a browser that still carries them from before this fix never has them auto-fill or
 * linger. The browser's own password manager (driven by the `autocomplete` attributes on the
 * login fields) replaces this feature going forward - nothing is ever written to these keys again.
 */

const LEGACY_REMEMBER_ME_EMAIL_KEY = "remembered_email"
const LEGACY_REMEMBER_ME_PASSWORD_KEY = "remembered_password"

export const clearLegacyRememberMeStorage = (): void => {
  if (typeof window === "undefined") {
    return
  }

  try {
    localStorage.removeItem(LEGACY_REMEMBER_ME_EMAIL_KEY)
    localStorage.removeItem(LEGACY_REMEMBER_ME_PASSWORD_KEY)
  } catch {
    // Private mode / quota - nothing to clean up if localStorage is unavailable anyway.
  }
}
