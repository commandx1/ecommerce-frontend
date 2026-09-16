/**
 * Per-tab session storage adapter for Zustand persist.
 * Wraps `cookieStorage` so each browser tab keeps its own logged-in account (via
 * `sessionStorage`, which is never shared between tabs), while the `auth-storage` cookie
 * always mirrors the last-focused tab - server-side readers (proxy, layouts) keep working
 * unchanged because they only ever see "whoever is focused right now".
 *
 * ponytail: cookie = last tab that wrote or focused; no visibility gate. A hidden tab that
 * logs out or restores can move the cookie once; the visible tab takes it back on its next read
 * or focus. Gate again only if a hidden-tab write is ever observed to bite in practice.
 *
 * A visible tab with no session claims the cookie as guest, so a stale sibling cookie can never
 * bounce it (proxy redirect loop).
 */
import { cookieStorage } from "./cookie-storage"

// Memory mirror answers only once sessionStorage has thrown (private mode / quota); a real null on
// healthy storage stays authoritative so an externally cleared session is not resurrected.
const memory = new Map<string, string>()
let storageUnreliable = false

const safeSessionGet = (name: string): string | null => {
  try {
    const value = window.sessionStorage.getItem(name)
    if (value !== null || !storageUnreliable) return value
  } catch {
    storageUnreliable = true
  }
  return memory.get(name) ?? null
}

const safeSessionSet = (name: string, value: string): void => {
  // zustand persist hands over the raw `{state, version}` object; sessionStorage would coerce it to "[object Object]".
  const str = typeof value === "string" ? value : JSON.stringify(value)
  memory.set(name, str)
  try {
    window.sessionStorage.setItem(name, str)
  } catch {
    storageUnreliable = true
  }
}

const safeSessionRemove = (name: string): void => {
  memory.delete(name)
  try {
    window.sessionStorage.removeItem(name)
  } catch {
    // ignore
  }
}

// A tab inherits the shared cookie only when it opens; after that an empty sessionStorage means
// logged out (e.g. a cross-tab logout), never "inherit again".
let adoptedCookie = false

export const tabSessionStorage: typeof cookieStorage = {
  getItem: (name) => {
    if (typeof window === "undefined") return null
    // The first read of a page load is the bootstrap; every later read is a resync.
    const isBootstrap = !adoptedCookie
    adoptedCookie = true

    const sessionValue = safeSessionGet(name)
    if (sessionValue !== null) {
      // Resync the cookie to this tab so server-side readers see this tab's account. Not gated on
      // visibility: a background tab that establishes a session (admin impersonation opened in a
      // background tab, restored tab) must own the cookie before its next navigation hits the proxy.
      cookieStorage.setItem(name, sessionValue)
      return sessionValue
    }

    if (!isBootstrap) {
      // Guest tab claims the cookie; otherwise a sibling's cookie bounces it in a proxy loop.
      cookieStorage.removeItem(name)
      return null
    }

    const cookieValue = cookieStorage.getItem(name)
    if (cookieValue !== null) {
      safeSessionSet(name, cookieValue)
    }
    return cookieValue
  },

  setItem: (name, value) => {
    if (typeof window === "undefined") return
    safeSessionSet(name, value)
    cookieStorage.setItem(name, value)
  },

  removeItem: (name) => {
    if (typeof window === "undefined") return
    safeSessionRemove(name)
    cookieStorage.removeItem(name)
  },
}

/** Test-only: resets the once-per-page-load cookie adoption gate. */
export const __resetTabSessionStorageForTests = (): void => {
  adoptedCookie = false
  memory.clear()
  storageUnreliable = false
}

/**
 * Writes the cookie from this tab's sessionStorage value, if it has one; otherwise this tab is a
 * guest and claims the cookie as guest (see the guest-claims-cookie rule above).
 */
export const syncActiveTabCookie = (name: string): void => {
  const sessionValue = safeSessionGet(name)
  if (sessionValue !== null) {
    cookieStorage.setItem(name, sessionValue)
  } else {
    cookieStorage.removeItem(name)
  }
}

/**
 * Keeps the shared `auth-storage` cookie pointed at whichever tab the user is actually looking
 * at, so a hard refresh or a server-side read always resolves to the focused tab's account.
 */
export const bindActiveTabSync = (name: string): (() => void) => {
  if (typeof window === "undefined") {
    return () => {}
  }

  const sync = () => syncActiveTabCookie(name)
  const onVisibilityChange = () => {
    if (document.visibilityState === "visible") sync()
  }

  window.addEventListener("focus", sync)
  document.addEventListener("visibilitychange", onVisibilityChange)

  return () => {
    window.removeEventListener("focus", sync)
    document.removeEventListener("visibilitychange", onVisibilityChange)
  }
}
