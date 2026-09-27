/**
 * Pure helper split out of `layout.tsx` so it can be unit tested without importing the layout
 * module itself - `layout.tsx` calls `next/font/google` at module scope, which needs Next's own
 * build pipeline (its `node_modules` entry point is a stub outside of it) and would fail under
 * plain Vitest.
 */

/** The only fields of the persisted `state.user` the Navbar's SSR pass ever reads. */
export interface NavbarUser {
  id: string
  name: string
  surname: string
  email: string
  roleName?: string
}

export interface NavbarInitialAuthState {
  user: NavbarUser | null
  isAuthenticated: boolean
}

/**
 * Pulls only the fields the Navbar's SSR pass renders out of the persisted `auth-storage` cookie
 * value. Never returns `accessToken`/`refreshToken` - those would otherwise be serialised into
 * every page's RSC payload and HTML as a prop of a client component.
 */
export function buildNavbarInitialAuthState(rawCookieValue: string | undefined): NavbarInitialAuthState | null {
  if (!rawCookieValue) {
    return null
  }

  try {
    let parsed: { state?: { user?: NavbarUser; isAuthenticated?: boolean } } | null = null
    try {
      parsed = JSON.parse(rawCookieValue)
    } catch {
      const decodedValue = decodeURIComponent(rawCookieValue)
      parsed = JSON.parse(decodedValue)
    }
    const state = parsed?.state
    if (!state) {
      return null
    }
    if (state.user) {
      const { id, name, surname, email, roleName } = state.user
      return {
        user: { id, name, surname, email, roleName },
        isAuthenticated: Boolean(state.isAuthenticated),
      }
    }
    return { user: null, isAuthenticated: Boolean(state.isAuthenticated) }
  } catch {
    return null
  }
}
