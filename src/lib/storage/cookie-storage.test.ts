/** biome-ignore-all lint/suspicious/noDocumentCookie: these suites drive the document.cookie-based auth storage on purpose */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { cookieStorage } from "./cookie-storage"

/**
 * `cookieStorage` is the persistence adapter behind `authStore`. It is the only thing that makes
 * the session readable by the Next.js middleware (`src/proxy.ts`), so its cookie name matching,
 * encoding and SSR guards are load-bearing for the whole auth backbone.
 */

const clearAllCookies = (): void => {
  for (const entry of document.cookie.split(";")) {
    const name = entry.split("=")[0]?.trim()
    if (name) {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
    }
  }
}

beforeEach(clearAllCookies)
afterEach(() => {
  vi.restoreAllMocks()
  clearAllCookies()
})

describe("cookieStorage.getItem", () => {
  it("returns null when nothing is stored", () => {
    expect(cookieStorage.getItem("auth-storage")).toBeNull()
  })

  it("reads back what setItem wrote", () => {
    const payload = JSON.stringify({ state: { accessToken: "tok", isAuthenticated: true } })
    cookieStorage.setItem("auth-storage", payload)

    expect(cookieStorage.getItem("auth-storage")).toBe(payload)
  })

  it("picks the right cookie out of several", () => {
    document.cookie = "theme=dark; path=/"
    document.cookie = `auth-storage=${encodeURIComponent('{"state":{"accessToken":"mine"}}')}; path=/`
    document.cookie = "locale=tr; path=/"

    expect(cookieStorage.getItem("auth-storage")).toBe('{"state":{"accessToken":"mine"}}')
    expect(cookieStorage.getItem("theme")).toBe("dark")
  })

  it("does not match a cookie that merely shares the name prefix", () => {
    document.cookie = "auth-storage-old=stale; path=/"

    expect(cookieStorage.getItem("auth-storage")).toBeNull()
  })

  it("still finds the exact cookie when a prefixed lookalike sits in front of it", () => {
    document.cookie = "auth-storage-old=stale; path=/"
    document.cookie = "auth-storage=fresh; path=/"

    expect(cookieStorage.getItem("auth-storage")).toBe("fresh")
  })

  it("returns null for a cookie with an empty value", () => {
    document.cookie = "auth-storage=; path=/"

    expect(cookieStorage.getItem("auth-storage")).toBeNull()
  })

  it("decodes percent-encoded values", () => {
    document.cookie = `auth-storage=${encodeURIComponent('{"state":{"user":{"name":"Ada & Co"}}}')}; path=/`

    expect(cookieStorage.getItem("auth-storage")).toBe('{"state":{"user":{"name":"Ada & Co"}}}')
  })

  it("falls back to the raw value when it cannot be decoded", () => {
    // A bare `%` makes decodeURIComponent throw; the adapter must hand back the raw string
    // instead of losing the session.
    document.cookie = "auth-storage=100%; path=/"

    expect(cookieStorage.getItem("auth-storage")).toBe("100%")
  })

  it("returns null in SSR, where document does not exist", () => {
    vi.stubGlobal("document", undefined)
    try {
      expect(cookieStorage.getItem("auth-storage")).toBeNull()
    } finally {
      vi.unstubAllGlobals()
    }
  })
})

describe("cookieStorage.setItem", () => {
  it("writes an encoded value with a 30-day expiry, a root path and SameSite=Lax", () => {
    const setSpy = vi.spyOn(document, "cookie", "set")
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"))

    try {
      cookieStorage.setItem("auth-storage", '{"state":{"accessToken":"a b"}}')

      const written = setSpy.mock.calls[0]?.[0] as string
      expect(written).toContain(`auth-storage=${encodeURIComponent('{"state":{"accessToken":"a b"}}')}`)
      expect(written).toContain("expires=Sat, 31 Jan 2026 00:00:00 GMT")
      expect(written).toContain("path=/")
      expect(written).toContain("SameSite=Lax")
      // Not HttpOnly / not Secure by design: the middleware and client JS both read it.
      expect(written).not.toContain("HttpOnly")
    } finally {
      vi.useRealTimers()
    }
  })

  it("adds Secure when served over https", () => {
    const setSpy = vi.spyOn(document, "cookie", "set")
    vi.stubGlobal("location", { ...window.location, protocol: "https:" })

    try {
      cookieStorage.setItem("auth-storage", '{"state":{"accessToken":"a"}}')

      const written = setSpy.mock.calls[0]?.[0] as string
      expect(written).toContain("; Secure")
    } finally {
      vi.unstubAllGlobals()
    }
  })

  it("omits Secure on plain http so the cookie is not silently dropped (e.g. localhost dev/e2e)", () => {
    const setSpy = vi.spyOn(document, "cookie", "set")
    vi.stubGlobal("location", { ...window.location, protocol: "http:" })

    try {
      cookieStorage.setItem("auth-storage", '{"state":{"accessToken":"a"}}')

      const written = setSpy.mock.calls[0]?.[0] as string
      expect(written).not.toContain("Secure")
    } finally {
      vi.unstubAllGlobals()
    }
  })

  it("stringifies a non-string value defensively", () => {
    const setSpy = vi.spyOn(document, "cookie", "set")

    cookieStorage.setItem("auth-storage", { state: { accessToken: "x" } } as unknown as string)

    expect(setSpy.mock.calls[0]?.[0] as string).toContain(encodeURIComponent('{"state":{"accessToken":"x"}}'))
  })

  it("round-trips a value containing cookie delimiters", () => {
    const payload = '{"state":{"note":"a;b=c, d"}}'
    cookieStorage.setItem("auth-storage", payload)

    expect(cookieStorage.getItem("auth-storage")).toBe(payload)
  })

  it("is a no-op in SSR", () => {
    vi.stubGlobal("document", undefined)
    try {
      expect(() => cookieStorage.setItem("auth-storage", "x")).not.toThrow()
    } finally {
      vi.unstubAllGlobals()
    }
    expect(cookieStorage.getItem("auth-storage")).toBeNull()
  })
})

describe("cookieStorage.removeItem", () => {
  it("actually deletes the cookie", () => {
    cookieStorage.setItem("auth-storage", '{"state":{"accessToken":"tok"}}')
    expect(cookieStorage.getItem("auth-storage")).not.toBeNull()

    cookieStorage.removeItem("auth-storage")

    expect(cookieStorage.getItem("auth-storage")).toBeNull()
  })

  it("expires the cookie in the past on the root path", () => {
    const setSpy = vi.spyOn(document, "cookie", "set")

    cookieStorage.removeItem("auth-storage")

    const written = setSpy.mock.calls[0]?.[0] as string
    expect(written).toBe("auth-storage=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;")
  })

  it("matches setItem's Secure flag over https so the delete cookie actually overwrites the original", () => {
    // On https, `setItem` writes the cookie with `Secure`. If `removeItem` wrote its expiry
    // cookie without `Secure`, the browser would treat it as a different, non-Secure cookie and
    // the "logout" delete would silently fail to clear the real (Secure) session cookie.
    vi.stubGlobal("location", { ...window.location, protocol: "https:" })
    const setSpy = vi.spyOn(document, "cookie", "set")

    try {
      cookieStorage.removeItem("auth-storage")

      const written = setSpy.mock.calls[0]?.[0] as string
      expect(written).toContain("; Secure")
    } finally {
      vi.unstubAllGlobals()
    }
  })

  it("leaves unrelated cookies alone", () => {
    document.cookie = "theme=dark; path=/"
    cookieStorage.setItem("auth-storage", "tok")

    cookieStorage.removeItem("auth-storage")

    expect(cookieStorage.getItem("auth-storage")).toBeNull()
    expect(cookieStorage.getItem("theme")).toBe("dark")
  })

  it("is a no-op in SSR", () => {
    vi.stubGlobal("document", undefined)
    try {
      expect(() => cookieStorage.removeItem("auth-storage")).not.toThrow()
    } finally {
      vi.unstubAllGlobals()
    }
  })
})
