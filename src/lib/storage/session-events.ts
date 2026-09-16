/**
 * Cross-tab logout broadcast via the native `storage` event. `localStorage` writes fire a
 * `storage` event in every OTHER tab of the same origin (never the writing tab), which is
 * exactly the fan-out a "logout this account everywhere" needs.
 */

export const LOGOUT_EVENT_KEY = "auth-logout"

export const broadcastLogout = (userId: string): void => {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(LOGOUT_EVENT_KEY, JSON.stringify({ userId, at: Date.now() }))
  } catch {
    // private window / blocked storage - other tabs simply won't hear about this logout
  }
}

export const onLogoutBroadcast = (handler: (userId: string) => void): (() => void) => {
  if (typeof window === "undefined") return () => {}

  const listener = (event: StorageEvent): void => {
    if (event.key !== LOGOUT_EVENT_KEY || !event.newValue) return

    try {
      const payload = JSON.parse(event.newValue)
      if (payload && typeof payload.userId === "string") {
        handler(payload.userId)
      }
    } catch {
      // malformed payload - ignore
    }
  }

  window.addEventListener("storage", listener)
  return () => window.removeEventListener("storage", listener)
}
