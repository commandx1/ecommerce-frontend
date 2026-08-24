/** biome-ignore-all lint/suspicious/noDocumentCookie: these suites drive the document.cookie-based auth storage on purpose */

import type { AxiosError } from "axios"
import { HttpResponse, http } from "msw"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { server } from "@/mocks/server"
import { useAuthStore } from "@/stores/authStore"
import { isAuthHandledError } from "./auth-error"
import apiClient, { appApiClient } from "./client"

/**
 * `client.ts` owns two cross-cutting auth behaviours every request in the app inherits:
 *   1. attaching the bearer token resolved from the `auth-storage` cookie (localStorage fallback)
 *   2. a single-flight logout + redirect to /login when the backend reports an expired session
 *
 * The redirect is asserted against the `window.location.assign` stub installed in
 * `src/test/setup.ts` (jsdom refuses real navigation).
 */

const ORIGIN = "http://localhost:3000"

const assignMock = window.location.assign as unknown as ReturnType<typeof vi.fn>

const clearAllCookies = (): void => {
  for (const entry of document.cookie.split(";")) {
    const name = entry.split("=")[0]?.trim()
    if (name) {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
    }
  }
}

/** The stubbed `window.location` is a plain object, so navigation state is writable per test. */
const setLocation = (pathname: string, search = ""): void => {
  Object.assign(window.location, { pathname, search, href: `${ORIGIN}${pathname}${search}` })
}

const authCookie = (state: Record<string, unknown>): void => {
  document.cookie = `auth-storage=${encodeURIComponent(JSON.stringify({ state }))}; path=/`
}

const originalLogout = useAuthStore.getState().logout

beforeEach(() => {
  clearAllCookies()
  localStorage.clear()
  assignMock.mockClear()
  setLocation("/", "")
})

afterEach(() => {
  useAuthStore.setState({ logout: originalLogout })
  clearAllCookies()
  localStorage.clear()
})

/** Narrows a request that is expected to reject down to the axios error it rejected with. */
const expectAxiosError = async (request: Promise<unknown>): Promise<AxiosError> => {
  const outcome = await request.then(
    () => null,
    (caught: AxiosError) => caught,
  )

  if (!outcome) {
    throw new Error("expected the request to reject, but it resolved")
  }

  return outcome
}

const captureAuthHeader = (path: string): { get: () => string | null } => {
  let header: string | null = null
  server.use(
    http.get(`*${path}`, ({ request }) => {
      header = request.headers.get("authorization")
      return HttpResponse.json({ ok: true })
    }),
  )
  return { get: () => header }
}

describe("token attachment", () => {
  it("sends the access token from the auth-storage cookie", async () => {
    const captured = captureAuthHeader("/backend-api/client-test/ping")
    authCookie({ accessToken: "cookie-token", isAuthenticated: true })

    await apiClient.get("/client-test/ping")

    expect(captured.get()).toBe("Bearer cookie-token")
  })

  it("applies the same interceptor to the app client", async () => {
    const captured = captureAuthHeader("/client-test/app-ping")
    authCookie({ accessToken: "cookie-token" })

    await appApiClient.get("/client-test/app-ping")

    expect(captured.get()).toBe("Bearer cookie-token")
  })

  it("falls back to the localStorage token when no auth-storage cookie exists", async () => {
    const captured = captureAuthHeader("/backend-api/client-test/ping")
    localStorage.setItem("token", "ls-token")

    await apiClient.get("/client-test/ping")

    expect(captured.get()).toBe("Bearer ls-token")
  })

  it("sends no Authorization header when neither source has a token", async () => {
    const captured = captureAuthHeader("/backend-api/client-test/ping")

    await apiClient.get("/client-test/ping")

    expect(captured.get()).toBeNull()
  })

  it("skips leading whitespace when the auth cookie is not the first one", async () => {
    const captured = captureAuthHeader("/backend-api/client-test/ping")
    document.cookie = "theme=dark; path=/"
    authCookie({ accessToken: "second-cookie-token" })
    document.cookie = "locale=tr; path=/"

    await apiClient.get("/client-test/ping")

    expect(captured.get()).toBe("Bearer second-cookie-token")
  })

  it("ignores a cookie that only shares the auth-storage prefix", async () => {
    const captured = captureAuthHeader("/backend-api/client-test/ping")
    document.cookie = `auth-storage-old=${encodeURIComponent('{"state":{"accessToken":"stale"}}')}; path=/`
    localStorage.setItem("token", "ls-token")

    await apiClient.get("/client-test/ping")

    expect(captured.get()).toBe("Bearer ls-token")
  })

  it("sends no header when the auth cookie holds no accessToken", async () => {
    const captured = captureAuthHeader("/backend-api/client-test/ping")
    authCookie({ isAuthenticated: false })

    await apiClient.get("/client-test/ping")

    expect(captured.get()).toBeNull()
  })

  it("falls back to the localStorage token — not a crash — when the auth cookie is unparseable", async () => {
    const captured = captureAuthHeader("/backend-api/client-test/ping")
    document.cookie = "auth-storage=not-json; path=/"
    // A malformed/corrupted auth cookie must not swallow the localStorage fallback - otherwise
    // the token is never sent and the user appears logged out for no reason.
    localStorage.setItem("token", "ls-token")

    await expect(apiClient.get("/client-test/ping")).resolves.toBeTruthy()

    expect(captured.get()).toBe("Bearer ls-token")
  })

  it("sends no header when the auth cookie is unparseable and there is no localStorage token either", async () => {
    const captured = captureAuthHeader("/backend-api/client-test/ping")
    document.cookie = "auth-storage=not-json; path=/"

    await expect(apiClient.get("/client-test/ping")).resolves.toBeTruthy()

    expect(captured.get()).toBeNull()
  })

  it("trims every leading space from a cookie segment before matching its name, not just one", async () => {
    // A natural `document.cookie` read-back only ever inserts a single space (from the "; "
    // join between cookies), which a single `if` could also strip - too weak to prove the
    // trim is a loop. Stubbing the getter lets us plant three leading spaces, which only a
    // `while` can fully remove before `indexOf("auth-storage=")` can match at position 0.
    const captured = captureAuthHeader("/backend-api/client-test/ping")
    const rawCookie = `theme=dark;   auth-storage=${encodeURIComponent(JSON.stringify({ state: { accessToken: "trim-token" } }))}`
    const descriptor = Object.getOwnPropertyDescriptor(Document.prototype, "cookie")
    if (!descriptor) throw new Error("Document.prototype.cookie has no descriptor in this environment")
    Object.defineProperty(document, "cookie", { configurable: true, get: () => rawCookie, set: () => undefined })

    try {
      await apiClient.get("/client-test/ping")
      expect(captured.get()).toBe("Bearer trim-token")
    } finally {
      Object.defineProperty(document, "cookie", descriptor)
    }
  })
})

describe("default request config", () => {
  it("sends application/json as the default Content-Type on a request with a body", async () => {
    // A bodyless GET never carries Content-Type regardless of the configured default (axios
    // omits it when there is nothing to type), so only a request with a body proves the default
    // in `axios.create({ headers: ... })` is actually wired up.
    let contentType: string | null = null
    server.use(
      http.post("*/backend-api/client-test/ping", ({ request }) => {
        contentType = request.headers.get("content-type")
        return HttpResponse.json({ ok: true })
      }),
    )

    await apiClient.post("/client-test/ping", { a: 1 })

    expect(contentType).toBe("application/json")
  })
})

describe("401 handling", () => {
  const arm401 = (path = "/backend-api/client-test/secure") => {
    let count = 0
    server.use(
      http.get(`*${path}`, () => {
        count += 1
        return new HttpResponse(null, { status: 401 })
      }),
    )
    return () => count
  }

  it("logs out, marks the error as handled and redirects to /login", async () => {
    arm401()
    const logout = vi.fn(async () => {})
    useAuthStore.setState({ logout })

    const error = await apiClient.get("/client-test/secure").catch((caught: AxiosError) => caught)

    expect(logout).toHaveBeenCalledTimes(1)
    expect(isAuthHandledError(error)).toBe(true)
    expect(assignMock).toHaveBeenCalledWith(`${ORIGIN}/login?reason=session-expired`)
  })

  it("carries the current path and query into the redirect param", async () => {
    arm401()
    useAuthStore.setState({ logout: vi.fn(async () => {}) })
    setLocation("/products", "?page=2")

    await apiClient.get("/client-test/secure").catch(() => undefined)

    expect(assignMock).toHaveBeenCalledWith(`${ORIGIN}/login?redirect=%2Fproducts%3Fpage%3D2&reason=session-expired`)
  })

  it("omits the redirect param on the home page", async () => {
    arm401()
    useAuthStore.setState({ logout: vi.fn(async () => {}) })
    setLocation("/", "")

    await apiClient.get("/client-test/secure").catch(() => undefined)

    expect(assignMock).toHaveBeenCalledWith(`${ORIGIN}/login?reason=session-expired`)
  })

  it("omits the redirect param when already on the login page", async () => {
    arm401()
    useAuthStore.setState({ logout: vi.fn(async () => {}) })
    setLocation("/login", "?redirect=%2Fcart")

    await apiClient.get("/client-test/secure").catch(() => undefined)

    expect(assignMock).toHaveBeenCalledWith(`${ORIGIN}/login?reason=session-expired`)
  })

  it("does not navigate when the browser is already on the exact target URL", async () => {
    arm401()
    const logout = vi.fn(async () => {})
    useAuthStore.setState({ logout })
    setLocation("/login", "?reason=session-expired")

    await apiClient.get("/client-test/secure").catch(() => undefined)

    expect(logout).toHaveBeenCalledTimes(1)
    expect(assignMock).not.toHaveBeenCalled()
  })

  it("logs out exactly once for three concurrent 401s, then re-arms for the next one", async () => {
    const requestCount = arm401()
    let release = (): void => {}
    const gate = new Promise<void>((resolve) => {
      release = resolve
    })
    const logout = vi.fn(() => gate)
    useAuthStore.setState({ logout })

    const settled = Promise.allSettled([
      apiClient.get("/client-test/secure"),
      apiClient.get("/client-test/secure"),
      apiClient.get("/client-test/secure"),
    ])

    await vi.waitFor(() => expect(requestCount()).toBe(3))
    await vi.waitFor(() => expect(logout).toHaveBeenCalledTimes(1))
    // Give every in-flight response interceptor a chance to (wrongly) start a second logout.
    await new Promise((resolve) => setTimeout(resolve, 20))

    expect(logout).toHaveBeenCalledTimes(1)

    release()
    const results = await settled

    expect(results.every((result) => result.status === "rejected")).toBe(true)
    expect(assignMock).toHaveBeenCalledTimes(1)

    // `finally` clears the memoised promise, so a later 401 must trigger a fresh logout.
    const secondLogout = vi.fn(async () => {})
    useAuthStore.setState({ logout: secondLogout })
    await apiClient.get("/client-test/secure").catch(() => undefined)

    expect(secondLogout).toHaveBeenCalledTimes(1)
    expect(assignMock).toHaveBeenCalledTimes(2)
  })

  it("rejects with the original axios error so callers can still inspect it", async () => {
    arm401()
    useAuthStore.setState({ logout: vi.fn(async () => {}) })

    const error = await expectAxiosError(apiClient.get("/client-test/secure"))

    expect(error.response?.status).toBe(401)
    expect(error.isAxiosError).toBe(true)
  })
})

/** Builds an unsigned, base64url-encoded JWT expiring `secondsFromNow` from now. */
const jwtExpiringIn = (secondsFromNow: number): string => {
  const encode = (value: object): string =>
    btoa(JSON.stringify(value)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
  const exp = Math.floor(Date.now() / 1000) + secondsFromNow
  return `${encode({ alg: "HS256", typ: "JWT" })}.${encode({ sub: "buyer@example.com", exp })}.sig`
}

/**
 * The backend answers 403 for an expired JWT too — its security filter lets the
 * ExpiredJwtException escape and Spring's default Http403ForbiddenEntryPoint takes over.
 * A 403 therefore only counts as session expiry when the token we hold is itself past `exp`;
 * otherwise it stays a business-rule rejection that must surface inline.
 */
describe("403 with an expired access token", () => {
  const arm403 = (): void => {
    server.use(http.get("*/backend-api/client-test/secure", () => new HttpResponse(null, { status: 403 })))
  }

  it("logs out and redirects to /login when the held token is already past its exp", async () => {
    arm403()
    const logout = vi.fn(async () => {})
    useAuthStore.setState({ logout })
    // Written after setState on purpose: the store's persist middleware rewrites the
    // auth-storage cookie on every setState and would otherwise clear this token.
    authCookie({ accessToken: jwtExpiringIn(-3600), isAuthenticated: true })
    setLocation("/buyer-dashboard/orders", "?selectedTab=All")

    const error = await expectAxiosError(apiClient.get("/client-test/secure"))

    expect(logout).toHaveBeenCalledTimes(1)
    expect(assignMock).toHaveBeenCalledTimes(1)
    const target = new URL(assignMock.mock.calls[0][0] as string)
    expect(target.pathname).toBe("/login")
    expect(target.searchParams.get("redirect")).toBe("/buyer-dashboard/orders?selectedTab=All")
    expect(target.searchParams.get("reason")).toBe("session-expired")
    // Flagged as handled so callers stay silent instead of stacking an error toast
    // on top of the redirect.
    expect(isAuthHandledError(error)).toBe(true)
  })

  it("leaves a 403 alone while the held token is still valid — a business-rule rejection", async () => {
    arm403()
    const logout = vi.fn(async () => {})
    useAuthStore.setState({ logout })
    // Written after setState on purpose: the store's persist middleware rewrites the
    // auth-storage cookie on every setState and would otherwise clear this token.
    authCookie({ accessToken: jwtExpiringIn(3600), isAuthenticated: true })

    const error = await expectAxiosError(apiClient.get("/client-test/secure"))

    expect(logout).not.toHaveBeenCalled()
    expect(assignMock).not.toHaveBeenCalled()
    expect(isAuthHandledError(error)).toBe(false)
  })

  it("leaves a 403 alone when the stored token is opaque and carries no readable exp", async () => {
    arm403()
    const logout = vi.fn(async () => {})
    useAuthStore.setState({ logout })
    // Written after setState on purpose: the store's persist middleware rewrites the
    // auth-storage cookie on every setState and would otherwise clear this token.
    authCookie({ accessToken: "not-a-jwt", isAuthenticated: true })

    await apiClient.get("/client-test/secure").catch(() => undefined)

    expect(logout).not.toHaveBeenCalled()
    expect(assignMock).not.toHaveBeenCalled()
  })
})

describe("non-401 error statuses", () => {
  it.each([403, 404, 422, 500])("leaves a %s response untouched — no logout, no redirect", async (status) => {
    // With no token stored at all there is no expiry to read, so even a 403 stays a
    // business-rule rejection on a valid session and must surface inline to the user.
    server.use(http.get("*/backend-api/client-test/err", () => new HttpResponse(null, { status })))
    const logout = vi.fn(async () => {})
    useAuthStore.setState({ logout })

    const error = await apiClient.get("/client-test/err").catch((caught: AxiosError) => caught)

    expect(logout).not.toHaveBeenCalled()
    expect(assignMock).not.toHaveBeenCalled()
    expect(isAuthHandledError(error)).toBe(false)
  })

  it("does not log out on a network failure with no response", async () => {
    server.use(http.get("*/backend-api/client-test/boom", () => HttpResponse.error()))
    const logout = vi.fn(async () => {})
    useAuthStore.setState({ logout })

    const error = await expectAxiosError(apiClient.get("/client-test/boom"))

    expect(error.response).toBeUndefined()
    expect(logout).not.toHaveBeenCalled()
    expect(assignMock).not.toHaveBeenCalled()
  })
})

describe("server-side rendering guard", () => {
  it("attaches no token and performs no navigation when window is unavailable", async () => {
    let header: string | null = "unset"
    server.use(
      http.get("*/backend-api/client-test/ssr", ({ request }) => {
        header = request.headers.get("authorization")
        return new HttpResponse(null, { status: 401 })
      }),
    )
    authCookie({ accessToken: "cookie-token" })
    const logout = vi.fn(async () => {})
    useAuthStore.setState({ logout })

    vi.stubGlobal("window", undefined)
    try {
      await apiClient.get("/client-test/ssr").catch(() => undefined)
    } finally {
      vi.unstubAllGlobals()
    }

    // `resolveAccessToken` and `handleAuthFailure` both bail out before touching the DOM, so the
    // SSR path degrades to a plain unauthenticated request instead of throwing.
    expect(header).toBeNull()
    expect(logout).not.toHaveBeenCalled()
    expect(assignMock).not.toHaveBeenCalled()
  })
})
