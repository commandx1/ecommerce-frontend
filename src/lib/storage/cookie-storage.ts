/** Cookie storage adapter for Zustand persist, so auth state is readable server-side (proxy/layouts). */

interface Storage {
  getItem: (name: string) => string | null
  setItem: (name: string, value: string) => void
  removeItem: (name: string) => void
}

/**
 * Helper function to parse cookie value from cookie string
 */
function parseCookieValue(cookieString: string, name: string): string | null {
  const value = `; ${cookieString}`
  const parts = value.split(`; ${name}=`)

  if (parts.length === 2) {
    const cookieValue = parts.pop()?.split(";").shift()
    if (!cookieValue) {
      return null
    }

    // Decode the cookie value (browser doesn't auto-decode)
    try {
      return decodeURIComponent(cookieValue)
    } catch {
      // If decode fails, return the value as-is (might already be decoded)
      return cookieValue
    }
  }

  return null
}

// `Secure` only on HTTPS: on plain http:// the browser refuses the cookie entirely. Used by both
// `setItem` and `removeItem`, since a delete without `Secure` does not overwrite a `Secure` original.
const secureCookieSuffix = (): string =>
  typeof location !== "undefined" && location.protocol === "https:" ? "; Secure" : ""

export const cookieStorage: Storage = {
  getItem: (name: string): string | null => {
    // Only works client-side
    if (typeof document === "undefined") {
      return null
    }

    return parseCookieValue(document.cookie, name)
  },

  setItem: (name: string, value: string): void => {
    if (typeof document === "undefined") {
      return
    }

    // Ensure value is a string (Zustand persist should already stringify, but be safe)
    let stringValue: string
    if (typeof value === "string") {
      stringValue = value
    } else {
      // If somehow an object is passed, stringify it
      stringValue = JSON.stringify(value)
    }

    const expires = new Date()
    expires.setTime(expires.getTime() + 30 * 24 * 60 * 60 * 1000)

    // This *is* the cookie storage adapter: the sync Storage interface it implements (required by
    // Zustand persist and by SSR reads in layouts) has no equivalent in the async Cookie Store API.
    // biome-ignore lint/suspicious/noDocumentCookie: sync Storage adapter, see comment above
    document.cookie = `${name}=${encodeURIComponent(stringValue)}; expires=${expires.toUTCString()}; path=/; SameSite=Lax${secureCookieSuffix()}`
  },

  removeItem: (name: string): void => {
    if (typeof document === "undefined") {
      return
    }

    // biome-ignore lint/suspicious/noDocumentCookie: sync Storage adapter, see setItem above
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;${secureCookieSuffix()}`
  },
}
