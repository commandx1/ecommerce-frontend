/** biome-ignore-all lint/suspicious/noDocumentCookie: these suites drive the document.cookie-based auth storage on purpose */

import type { AxiosError } from "axios"
import { HttpResponse, http } from "msw"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { server } from "@/mocks/server"
import { useAuthStore } from "@/stores/authStore"
import { isAuthHandledError } from "./auth-error"
import apiClient, { appApiClient, buildLoginUrl } from "./client"

/**
 * `client.ts` owns two cross-cutting auth behaviours every request in the app inherits:
 *   1. attaching the bearer token held by the auth store
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

const originalLogout = useAuthStore.getState().logout

beforeEach(() => {
  clearAllCookies()
  localStorage.clear()
  sessionStorage.clear()
  useAuthStore.setState({ accessToken: null })
  assignMock.mockClear()
  setLocation("/", "")
})

afterEach(() => {
  useAuthStore.setState({ logout: originalLogout, accessToken: null })
  clearAllCookies()
  localStorage.clear()
  sessionStorage.clear()
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
  it("sends the access token held by the auth store", async () => {
    const captured = captureAuthHeader("/backend-api/client-test/ping")
    useAuthStore.setState({ accessToken: "store-token" })

    await apiClient.get("/client-test/ping")

    expect(captured.get()).toBe("Bearer store-token")
  })

  it("applies the same interceptor to the app client", async () => {
    const captured = captureAuthHeader("/client-test/app-ping")
    useAuthStore.setState({ accessToken: "store-token" })

    await appApiClient.get("/client-test/app-ping")

    expect(captured.get()).toBe("Bearer store-token")
  })

  it("sends no Authorization header when the store has no token", async () => {
    const captured = captureAuthHeader("/backend-api/client-test/ping")

    await apiClient.get("/client-test/ping")

    expect(captured.get()).toBeNull()
  })

  it("sends no header when the store's accessToken is null", async () => {
    const captured = captureAuthHeader("/backend-api/client-test/ping")
    useAuthStore.setState({ accessToken: null })

    await apiClient.get("/client-test/ping")

    expect(captured.get()).toBeNull()
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

describe("buildLoginUrl reason param", () => {
  it("defaults to session-expired when no reason is passed", () => {
    expect(buildLoginUrl()).toBe(`${ORIGIN}/login?reason=session-expired`)
  })

  it("sets the reason to whatever is passed", () => {
    expect(buildLoginUrl("login-required")).toBe(`${ORIGIN}/login?reason=login-required`)
  })

  it("carries the hash into the redirect param for login-required", () => {
    setLocation("/products/x", "?vendorId=1")
    Object.assign(window.location, { hash: "#reviews" })

    const result = buildLoginUrl("login-required")

    expect(new URL(result).searchParams.get("redirect")).toBe("/products/x?vendorId=1#reviews")
    expect(new URL(result).searchParams.get("reason")).toBe("login-required")

    // `setLocation` (this file's helper) never touches `hash` - clear it explicitly so it
    // doesn't leak into a later test's `currentPath` via the shared `beforeEach`.
    Object.assign(window.location, { hash: "" })
  })

  it("omits the redirect param on the home page for login-required", () => {
    setLocation("/", "")

    expect(buildLoginUrl("login-required")).toBe(`${ORIGIN}/login?reason=login-required`)
  })

  it("omits the redirect param on a path starting with /login for login-required", () => {
    setLocation("/login", "?redirect=%2Fcart")

    expect(buildLoginUrl("login-required")).toBe(`${ORIGIN}/login?reason=login-required`)
  })

  it("round-trips an encoded query byte-for-byte", () => {
    setLocation("/products", "?category=A%2CB&search=a%20b")

    const result = buildLoginUrl("login-required")

    expect(new URL(result).searchParams.get("redirect")).toBe("/products?category=A%2CB&search=a%20b")
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

  // The backend answers 401 ("Invalid email or password") for a wrong password. That must reach
  // the login form as an ordinary error - not log out and hard-reload /login, dropping `redirect`.
  it.each(["/backend-api/auth/login", "/backend-api/auth/login/verify-2fa"])(
    "leaves a 401 from the sign-in endpoint %s to the caller",
    async (path) => {
      server.use(
        http.post(`*${path}`, () => HttpResponse.json({ message: "Invalid email or password" }, { status: 401 })),
      )
      const logout = vi.fn(async () => {})
      useAuthStore.setState({ logout })
      setLocation("/login", "?redirect=%2Fproducts%2Fabc")

      const error = await expectAxiosError(appApiClient.post(path, {}))

      expect(error.response?.status).toBe(401)
      expect(isAuthHandledError(error)).toBe(false)
      expect(logout).not.toHaveBeenCalled()
      expect(assignMock).not.toHaveBeenCalled()
    },
  )
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
    useAuthStore.setState({ logout, accessToken: jwtExpiringIn(-3600) })
    setLocation("/buyer-dashboard/orders", "?selectedTab=All")

    const error = await expectAxiosError(apiClient.get("/client-test/secure"))

    expect(logout).toHaveBeenCalledTimes(1)
    expect(assignMock).toHaveBeenCalledTimes(1)
    const target = new URL(assignMock.mock.calls[0]![0] as string)
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
    useAuthStore.setState({ logout, accessToken: jwtExpiringIn(3600) })

    const error = await expectAxiosError(apiClient.get("/client-test/secure"))

    expect(logout).not.toHaveBeenCalled()
    expect(assignMock).not.toHaveBeenCalled()
    expect(isAuthHandledError(error)).toBe(false)
  })

  it("leaves a 403 alone when the stored token is opaque and carries no readable exp", async () => {
    arm403()
    const logout = vi.fn(async () => {})
    useAuthStore.setState({ logout, accessToken: "not-a-jwt" })

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
    const logout = vi.fn(async () => {})
    useAuthStore.setState({ logout, accessToken: "store-token" })

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
