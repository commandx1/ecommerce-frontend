/**
 * Cookie storage adapter for Zustand persist
 * Allows storing auth state in cookies so it can be accessed in Next.js middleware
 *
 * Note: getItem only works client-side. Server-side cookie access is handled by middleware.
 */

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

/**
 * Cookie storage implementation for Zustand persist
 * Only works client-side - server-side access is handled by Next.js middleware
 */
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

    // Set cookie with 30 days expiration
    const expires = new Date()
    expires.setTime(expires.getTime() + 30 * 24 * 60 * 60 * 1000)

    document.cookie = `${name}=${encodeURIComponent(stringValue)}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`
  },

  removeItem: (name: string): void => {
    if (typeof document === "undefined") {
      return
    }

    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
  },
}
