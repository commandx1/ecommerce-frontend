import type { AccountUser } from "@/lib/api/account"
import { cookieStorage } from "@/lib/storage/cookie-storage"
import { makeAccountUser } from "@/test/factories/user.factory"

/**
 * Faz 8.1 - shared helper for building a real `auth-storage` cookie for
 * Playwright's `context.addCookies()`, WITHOUT hand-writing the cookie JSON
 * inline in every test (see the pre-migration inline block in
 * `tests/e2e/buyer-orders.smoke.spec.ts` around the `addCookies` call).
 *
 * The cookie NAME/encoding/attributes come from the real, imported
 * `cookieStorage` object in `src/lib/storage/cookie-storage.ts` - we do not
 * reimplement `encodeURIComponent`/cookie-string assembly here. `cookieStorage`
 * only works client-side (`document.cookie`), so to drive it from Node (the
 * Playwright test process) we stub a minimal `document` for the duration of
 * one `setItem` call and read back what it wrote. If cookie-storage.ts ever
 * changes its cookie name handling or encoding, this file (and anything using
 * it) breaks loudly instead of silently drifting from the real app.
 *
 * The `{ state, version }` envelope and the `roleName === "Vendor"` guard are
 * owned by `src/stores/authStore.ts` (zustand `persist`, storage key
 * "auth-storage") and `src/app/vendor-dashboard/layout.tsx` /
 * `src/app/buyer-dashboard/layout.tsx` respectively - they cannot be
 * "imported" the same way (persist's serialize step and the layout guards
 * aren't exported units), so they are mirrored here manually. Keep in sync
 * if authStore.ts's `persist` config or the layout role checks change.
 */

export const AUTH_COOKIE_NAME = "auth-storage"

/** zustand persist's default `version` when the option isn't set. */
const ZUSTAND_PERSIST_VERSION = 0

export interface PersistedAuthState {
  user: AccountUser | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isAdminImpersonating: boolean
}

/**
 * Runs the real `cookieStorage.setItem` (from src/lib/storage/cookie-storage.ts)
 * against a stubbed `document`, and returns a Playwright cookie descriptor
 * (`{ name, value, url }`) suitable for `context.addCookies([...])`.
 */
/**
 * The `baseURL` default below is a fallback only - every real caller
 * (auth.fixture.ts's `buyerPage`/`vendorPage`) passes Playwright's own
 * `baseURL` fixture explicitly, which config now resolves dynamically
 * (playwright.config.ts's `use.baseURL`, currently the dedicated e2e Next.js
 * instance on :3100 - see that config's Faz 8.2 comment). Kept here only so
 * this function still has a sane value if ever called without one.
 */
export function buildAuthCookie(state: PersistedAuthState, baseURL = "http://localhost:3100") {
  const documentStub = { cookie: "" }
  const globalWithDocument = globalThis as { document?: { cookie: string } }
  const previousDocument = globalWithDocument.document
  globalWithDocument.document = documentStub

  try {
    cookieStorage.setItem(AUTH_COOKIE_NAME, JSON.stringify({ state, version: ZUSTAND_PERSIST_VERSION }))
  } finally {
    globalWithDocument.document = previousDocument
  }

  // documentStub.cookie now holds the exact string cookie-storage.ts assembled:
  // "auth-storage=<encoded>; expires=...; path=/; SameSite=Lax". Playwright's
  // addCookies wants a bare { name, value } pair (it manages expiry/path itself).
  const [nameValuePair] = documentStub.cookie.split(";")
  const eqIndex = nameValuePair.indexOf("=")
  if (eqIndex === -1) {
    throw new Error(`buildAuthCookie: cookie-storage.ts produced an unexpected cookie string: "${documentStub.cookie}"`)
  }

  return {
    name: nameValuePair.slice(0, eqIndex),
    value: nameValuePair.slice(eqIndex + 1),
    url: baseURL,
  }
}

function buildAuthState(userOverrides: Partial<AccountUser>): PersistedAuthState {
  return {
    user: makeAccountUser(userOverrides),
    accessToken: "test-access-token",
    refreshToken: "test-refresh-token",
    isAuthenticated: true,
    isAdminImpersonating: false,
  }
}

/**
 * `roleName` defaults to the factory's "BUYER" - anything that isn't exactly
 * "Vendor" (see src/app/vendor-dashboard/layout.tsx) routes to buyer-dashboard.
 */
export function buildBuyerAuthCookie(userOverrides: Partial<AccountUser> = {}, baseURL?: string) {
  return buildAuthCookie(buildAuthState(userOverrides), baseURL)
}

/** `roleName` must be exactly "Vendor" - see src/app/vendor-dashboard/layout.tsx / buyer-dashboard/layout.tsx guards. */
export function buildVendorAuthCookie(userOverrides: Partial<AccountUser> = {}, baseURL?: string) {
  return buildAuthCookie(buildAuthState({ roleName: "Vendor", ...userOverrides }), baseURL)
}
