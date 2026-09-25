/** biome-ignore-all lint/suspicious/noDocumentCookie: these suites drive the document.cookie-based auth storage on purpose */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { cookieStorage } from "./cookie-storage"
import {
  __resetTabSessionStorageForTests,
  bindActiveTabSync,
  syncActiveTabCookie,
  tabSessionStorage,
} from "./tab-session-storage"

const NAME = "auth-storage"

const clearAllCookies = (): void => {
  for (const entry of document.cookie.split(";")) {
    const cookieName = entry.split("=")[0]?.trim()
    if (cookieName) {
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
    }
  }
}

beforeEach(() => {
  clearAllCookies()
  sessionStorage.clear()
  __resetTabSessionStorageForTests()
})

afterEach(() => {
  vi.restoreAllMocks()
  clearAllCookies()
  sessionStorage.clear()
})

describe("tabSessionStorage.getItem", () => {
  it("prefers sessionStorage and resyncs the cookie to that value", () => {
    sessionStorage.setItem(NAME, "session-value")
    cookieStorage.setItem(NAME, "stale-cookie-value")

    expect(tabSessionStorage.getItem(NAME)).toBe("session-value")
    expect(cookieStorage.getItem(NAME)).toBe("session-value")
  })

  it("inherits from the cookie and copies it into sessionStorage when sessionStorage is empty", () => {
    cookieStorage.setItem(NAME, "cookie-value")

    expect(tabSessionStorage.getItem(NAME)).toBe("cookie-value")
    expect(sessionStorage.getItem(NAME)).toBe("cookie-value")
  })

  it("returns null when neither sessionStorage nor the cookie has a value", () => {
    expect(tabSessionStorage.getItem(NAME)).toBeNull()
  })
})

describe("tabSessionStorage.setItem / removeItem", () => {
  it("setItem writes both sessionStorage and the cookie", () => {
    tabSessionStorage.setItem(NAME, "new-value")

    expect(sessionStorage.getItem(NAME)).toBe("new-value")
    expect(cookieStorage.getItem(NAME)).toBe("new-value")
  })

  it("removeItem clears both sessionStorage and the cookie", () => {
    tabSessionStorage.setItem(NAME, "new-value")

    tabSessionStorage.removeItem(NAME)

    expect(sessionStorage.getItem(NAME)).toBeNull()
    expect(cookieStorage.getItem(NAME)).toBeNull()
  })
})

describe("cookie adoption happens only once per page load", () => {
  it("a second getItem with empty sessionStorage does not re-adopt the cookie (e.g. after a cross-tab logout)", () => {
    cookieStorage.setItem(NAME, "cookie-value")
    expect(tabSessionStorage.getItem(NAME)).toBe("cookie-value")

    // Simulate a cross-tab logout: sessionStorage is cleared locally, but the cookie (written by
    // a sibling tab) still exists.
    sessionStorage.clear()
    expect(tabSessionStorage.getItem(NAME)).toBeNull()
  })
})

describe("no visibility gate: a hidden tab still owns the cookie it writes", () => {
  const stubHidden = (): (() => void) => {
    Object.defineProperty(document, "visibilityState", { configurable: true, get: () => "hidden" })
    return () => {
      Object.defineProperty(document, "visibilityState", { configurable: true, get: () => "visible" })
    }
  }

  it("setItem writes the cookie while hidden (background impersonation must own the cookie before it navigates)", () => {
    const restore = stubHidden()
    tabSessionStorage.setItem(NAME, "value")
    restore()

    expect(sessionStorage.getItem(NAME)).toBe("value")
    expect(cookieStorage.getItem(NAME)).toBe("value")
  })

  it("a read with a session resyncs the cookie while hidden (hidden reload under a sibling's cookie heals)", () => {
    sessionStorage.setItem(NAME, "session-value")
    cookieStorage.setItem(NAME, "stale-cookie-value")

    const restore = stubHidden()
    expect(tabSessionStorage.getItem(NAME)).toBe("session-value")
    restore()

    expect(cookieStorage.getItem(NAME)).toBe("session-value")
  })

  it("removeItem removes the cookie while hidden (a hidden 401 logout must not leave a sibling's cookie for the /login reload to adopt)", () => {
    tabSessionStorage.setItem(NAME, "value")

    const restore = stubHidden()
    tabSessionStorage.removeItem(NAME)
    restore()

    expect(sessionStorage.getItem(NAME)).toBeNull()
    expect(cookieStorage.getItem(NAME)).toBeNull()
  })
})

describe("syncActiveTabCookie", () => {
  it("deletes the cookie when sessionStorage is empty (this tab is a guest)", () => {
    cookieStorage.setItem(NAME, "sibling-tab-value")

    syncActiveTabCookie(NAME)

    expect(cookieStorage.getItem(NAME)).toBeNull()
  })

  it("overwrites the cookie with this tab's sessionStorage value when present", () => {
    sessionStorage.setItem(NAME, "this-tab-value")
    cookieStorage.setItem(NAME, "sibling-tab-value")

    syncActiveTabCookie(NAME)

    expect(cookieStorage.getItem(NAME)).toBe("this-tab-value")
  })
})

describe("bindActiveTabSync", () => {
  it("writes the cookie on window focus", () => {
    sessionStorage.setItem(NAME, "this-tab-value")
    cookieStorage.setItem(NAME, "sibling-tab-value")

    const unbind = bindActiveTabSync(NAME)
    window.dispatchEvent(new Event("focus"))

    expect(cookieStorage.getItem(NAME)).toBe("this-tab-value")
    unbind()
  })

  it("writes the cookie on a visible visibilitychange", () => {
    sessionStorage.setItem(NAME, "this-tab-value")
    cookieStorage.setItem(NAME, "sibling-tab-value")
    vi.spyOn(document, "visibilityState", "get").mockReturnValue("visible")

    const unbind = bindActiveTabSync(NAME)
    document.dispatchEvent(new Event("visibilitychange"))

    expect(cookieStorage.getItem(NAME)).toBe("this-tab-value")
    unbind()
  })

  it("does not sync on a hidden visibilitychange", () => {
    sessionStorage.setItem(NAME, "this-tab-value")
    cookieStorage.setItem(NAME, "sibling-tab-value")
    vi.spyOn(document, "visibilityState", "get").mockReturnValue("hidden")

    const unbind = bindActiveTabSync(NAME)
    document.dispatchEvent(new Event("visibilitychange"))

    expect(cookieStorage.getItem(NAME)).toBe("sibling-tab-value")
    unbind()
  })

  it("cleanup removes both listeners so further events do not resync", () => {
    sessionStorage.setItem(NAME, "this-tab-value")
    cookieStorage.setItem(NAME, "sibling-tab-value")

    const unbind = bindActiveTabSync(NAME)
    unbind()
    cookieStorage.setItem(NAME, "sibling-tab-value-2")
    window.dispatchEvent(new Event("focus"))

    expect(cookieStorage.getItem(NAME)).toBe("sibling-tab-value-2")
  })
})

describe("sessionStorage unavailable (private window / blocked storage)", () => {
  it("getItem degrades to cookie-only behavior when sessionStorage throws", () => {
    cookieStorage.setItem(NAME, "cookie-value")
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked")
    })

    expect(tabSessionStorage.getItem(NAME)).toBe("cookie-value")
  })

  it("setItem still writes the cookie when sessionStorage throws", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked")
    })

    expect(() => tabSessionStorage.setItem(NAME, "value")).not.toThrow()
    expect(cookieStorage.getItem(NAME)).toBe("value")
  })

  it("first read adopts the cookie and the second read still returns it (memory mirror); setItem/removeItem round-trip through memory", () => {
    cookieStorage.setItem(NAME, "cookie-value")
    const getSpy = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked")
    })
    const setSpy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked")
    })
    const removeSpy = vi.spyOn(Storage.prototype, "removeItem").mockImplementation(() => {
      throw new Error("blocked")
    })
    try {
      // First read: bootstrap adoption, would normally copy into sessionStorage, but that throws
      // - the memory mirror inside safeSessionSet keeps it anyway.
      expect(tabSessionStorage.getItem(NAME)).toBe("cookie-value")
      // Second read: without the memory mirror this would fall through to the "empty session"
      // branch and return null (and, being a visible tab, delete the cookie).
      expect(tabSessionStorage.getItem(NAME)).toBe("cookie-value")

      tabSessionStorage.setItem(NAME, "new-value")
      expect(tabSessionStorage.getItem(NAME)).toBe("new-value")

      tabSessionStorage.removeItem(NAME)
      expect(tabSessionStorage.getItem(NAME)).toBeNull()
    } finally {
      getSpy.mockRestore()
      setSpy.mockRestore()
      removeSpy.mockRestore()
    }
  })

  it("write fails but reads return null (old Safari private mode): memory answers and the cookie survives", () => {
    cookieStorage.setItem(NAME, "cookie-value")
    const setSpy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceededError")
    })
    try {
      // Bootstrap: adoption copies into memory; the sessionStorage write throws silently.
      expect(tabSessionStorage.getItem(NAME)).toBe("cookie-value")
      // sessionStorage really is empty here, but the failed write flagged storage as unreliable,
      // so the second (real restore) read must come from memory and must NOT claim the cookie.
      expect(tabSessionStorage.getItem(NAME)).toBe("cookie-value")
      expect(cookieStorage.getItem(NAME)).toBe("cookie-value")
    } finally {
      setSpy.mockRestore()
    }
  })

  it("a real null on healthy storage is authoritative (externally cleared session is not resurrected)", () => {
    expect(tabSessionStorage.getItem(NAME)).toBeNull() // bootstrap consumed, no cookie to adopt
    tabSessionStorage.setItem(NAME, "value")
    sessionStorage.clear()
    // Healthy storage says null -> guest; memory must not answer, and the visible guest tab claims the cookie.
    expect(tabSessionStorage.getItem(NAME)).toBeNull()
    expect(cookieStorage.getItem(NAME)).toBeNull()
  })
})

describe("guest tabs claim the shared cookie (BUG-1/BUG-3: proxy redirect loop)", () => {
  it("non-bootstrap empty read in a visible tab deletes the cookie", () => {
    // Bootstrap read with nothing anywhere - consumes the adoption gate.
    expect(tabSessionStorage.getItem(NAME)).toBeNull()

    // A sibling tab logs in and writes the shared cookie.
    cookieStorage.setItem(NAME, "sibling-account-value")

    // This tab's session is still empty (it never logged in) - the next read must claim the
    // cookie as guest, not silently inherit the sibling's account on the next SSR/proxy read.
    expect(tabSessionStorage.getItem(NAME)).toBeNull()
    expect(cookieStorage.getItem(NAME)).toBeNull()
  })

  it("syncActiveTabCookie with an empty session deletes the cookie", () => {
    cookieStorage.setItem(NAME, "sibling-account-value")

    syncActiveTabCookie(NAME)

    expect(cookieStorage.getItem(NAME)).toBeNull()
  })
})
