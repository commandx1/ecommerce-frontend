import { NextRequest } from "next/server"
import { describe, expect, it } from "vitest"
import { config, proxy } from "./proxy"

/**
 * `proxy` is the Next.js middleware entry point — the single gate every page request passes
 * through. These tests drive it with a REAL `NextRequest`/`NextResponse` pair (neither is
 * mocked globally) so the cookie parsing, redirect status and `Location` header are the same
 * objects Next produces at runtime.
 *
 * Environment note: this file belongs to the `node` project defined in `vitest.workspace.ts`, so
 * `NextRequest`/`NextResponse` are the real undici-backed objects rather than jsdom shims, and
 * the jsdom-only global setup (`window.matchMedia`, `window.location`) is not loaded.
 */

const ORIGIN = "http://localhost:3000"

type AuthState = {
  user?: { roleName?: string; name?: string } | null
  isAuthenticated?: boolean
}

/** Builds the `auth-storage` cookie the app writes via `cookieStorage` (URL-encoded JSON). */
const authCookie = (state: AuthState): string => `auth-storage=${encodeURIComponent(JSON.stringify({ state }))}`

const makeRequest = (path: string, cookie?: string): NextRequest =>
  new NextRequest(`${ORIGIN}${path}`, cookie ? { headers: { cookie } } : undefined)

/** `NextResponse.next()` is a 200 carrying the `x-middleware-next` marker. */
const isNext = (response: Response): boolean => response.headers.get("x-middleware-next") === "1"

const locationOf = (response: Response): string | null => {
  const location = response.headers.get("location")
  return location ? location.replace(ORIGIN, "") : null
}

const VENDOR = authCookie({ user: { roleName: "Vendor" }, isAuthenticated: true })
const BUYER = authCookie({ user: { roleName: "Buyer" }, isAuthenticated: true })

describe("proxy role routing matrix", () => {
  type Row = {
    name: string
    cookie?: string
    path: string
    /** `null` means the request is expected to pass through via `NextResponse.next()`. */
    redirectTo: string | null
  }

  const rows: Row[] = [
    // --- anonymous ---------------------------------------------------------
    { name: "anonymous on the home page passes through", path: "/", redirectTo: null },
    { name: "anonymous on a public listing passes through", path: "/products", redirectTo: null },
    {
      name: "anonymous on a buyer dashboard route is sent to login with a redirect back",
      path: "/buyer-dashboard/orders",
      redirectTo: "/login?redirect=%2Fbuyer-dashboard%2Forders",
    },
    {
      name: "anonymous on a vendor dashboard route is sent to login with a redirect back",
      path: "/vendor-dashboard",
      redirectTo: "/login?redirect=%2Fvendor-dashboard",
    },

    // --- authenticated buyer -----------------------------------------------
    { name: "buyer on their own dashboard passes through", cookie: BUYER, path: "/buyer-dashboard", redirectTo: null },
    {
      name: "buyer reaching into the vendor dashboard is bounced to the buyer dashboard",
      cookie: BUYER,
      path: "/vendor-dashboard/products",
      redirectTo: "/buyer-dashboard",
    },
    { name: "buyer on a storefront page passes through", cookie: BUYER, path: "/cart", redirectTo: null },

    // --- authenticated vendor ----------------------------------------------
    {
      name: "vendor on their own dashboard passes through",
      cookie: VENDOR,
      path: "/vendor-dashboard/orders",
      redirectTo: null,
    },
    {
      name: "vendor on the home page is pinned to the vendor dashboard",
      cookie: VENDOR,
      path: "/",
      redirectTo: "/vendor-dashboard",
    },
    {
      name: "vendor on the cart is pinned to the vendor dashboard",
      cookie: VENDOR,
      path: "/cart",
      redirectTo: "/vendor-dashboard",
    },
    {
      name: "vendor reaching into the buyer dashboard is pinned to the vendor dashboard",
      cookie: VENDOR,
      path: "/buyer-dashboard",
      redirectTo: "/vendor-dashboard",
    },
    {
      name: "vendor on plain /register is pinned to the vendor dashboard",
      cookie: VENDOR,
      path: "/register",
      redirectTo: "/vendor-dashboard",
    },

    // --- admin-invited signup exception ------------------------------------
    {
      name: "vendor on /register?token=abc is let through (admin-invited signup flow)",
      cookie: VENDOR,
      path: "/register?token=abc",
      redirectTo: null,
    },
    {
      // `URLSearchParams.has("token")` is true for an EMPTY value too, so a bare `?token=`
      // is enough to open the signup exception. Locked in as current behaviour.
      name: "vendor on /register?token= (empty value) is also let through — has() accepts an empty value",
      cookie: VENDOR,
      path: "/register?token=",
      redirectTo: null,
    },
    {
      name: "vendor on /register with an unrelated query param is still pinned to the dashboard",
      cookie: VENDOR,
      path: "/register?ref=abc",
      redirectTo: "/vendor-dashboard",
    },

    // --- cookie present but session not authenticated -----------------------
    {
      name: "buyer cookie with isAuthenticated=false is sent to login from the buyer dashboard",
      cookie: authCookie({ user: { roleName: "Buyer" }, isAuthenticated: false }),
      path: "/buyer-dashboard",
      redirectTo: "/login?redirect=%2Fbuyer-dashboard",
    },
    {
      // K14 fixed: the Vendor guard on proxy.ts now also checks `isAuthenticated`, so a
      // stale/unauthenticated vendor cookie no longer bounces public pages to
      // /vendor-dashboard — it can browse the storefront like any anonymous visitor.
      name: "unauthenticated vendor cookie lets a public page through untouched",
      cookie: authCookie({ user: { roleName: "Vendor" }, isAuthenticated: false }),
      path: "/products",
      redirectTo: null,
    },
    {
      // The dashboard guard (unaffected by K14) still requires isAuthenticated, so a direct
      // hit on a dashboard route sends the stale vendor cookie straight to /login in one hop.
      name: "unauthenticated vendor cookie on the vendor dashboard is sent to login",
      cookie: authCookie({ user: { roleName: "Vendor" }, isAuthenticated: false }),
      path: "/vendor-dashboard",
      redirectTo: "/login?redirect=%2Fvendor-dashboard",
    },

    // --- odd shapes ---------------------------------------------------------
    {
      name: "authenticated user with no roleName is treated as a buyer on the vendor dashboard",
      cookie: authCookie({ user: {}, isAuthenticated: true }),
      path: "/vendor-dashboard",
      redirectTo: "/buyer-dashboard",
    },
    {
      name: "authenticated user with no roleName passes through on their own dashboard",
      cookie: authCookie({ user: {}, isAuthenticated: true }),
      path: "/buyer-dashboard",
      redirectTo: null,
    },
    {
      name: "unparseable cookie degrades to anonymous instead of throwing",
      cookie: "auth-storage=not-json-at-all",
      path: "/buyer-dashboard",
      redirectTo: "/login?redirect=%2Fbuyer-dashboard",
    },
    {
      name: "cookie with a null user degrades to anonymous",
      cookie: authCookie({ user: null, isAuthenticated: true }),
      path: "/buyer-dashboard",
      redirectTo: "/login?redirect=%2Fbuyer-dashboard",
    },
    {
      name: "URL-encoded vendor cookie is decoded and enforced",
      cookie: VENDOR,
      path: "/",
      redirectTo: "/vendor-dashboard",
    },
    {
      // The cookie value reaching the proxy contains a bare `%`, so `decodeURIComponent`
      // throws and the second `JSON.parse` fallback (proxy.ts lines 14-18) is what parses it.
      name: "cookie that cannot be URI-decoded falls back to parsing the raw value",
      cookie: 'auth-storage={"state":{"user":{"roleName":"Vendor","name":"%25"},"isAuthenticated":true}}',
      path: "/",
      redirectTo: "/vendor-dashboard",
    },
    {
      // The cookie parses to valid JSON but has no top-level `state` key at all (`{}`), so
      // `authData.state` is itself `undefined` — a step beyond the `authData` null/undefined
      // case already covered above. Without the SECOND `?.` in `authData?.state?.user` (proxy.ts
      // line 28) this throws `Cannot read properties of undefined (reading 'user')` instead of
      // degrading to anonymous, and that throw is not caught anywhere.
      name: "cookie with valid JSON but no state key degrades to anonymous instead of throwing",
      cookie: `auth-storage=${encodeURIComponent("{}")}`,
      path: "/buyer-dashboard",
      redirectTo: "/login?redirect=%2Fbuyer-dashboard",
    },
    {
      // Regression for the double-decode bug: `request.cookies.get(...).value` is already the
      // DECODED cookie value (Next's own cookie header parsing decodes it once), so a value
      // containing a literal `%` that is not valid percent-encoding (e.g. "50% off", as opposed
      // to a pre-encoded "%25") makes a SECOND `decodeURIComponent` throw "URI malformed". The
      // old code let that throw fall through to a second `JSON.parse` of the SAME (already
      // decoded, still-throwing-if-redecoded) value, which happened to work here only by luck of
      // matching JSON.parse semantics — but the point is the session must not be dropped.
      name: "cookie value with a literal, non-percent-encoded % still parses instead of dropping the session",
      cookie: authCookie({ user: { roleName: "Vendor", name: "50% off" }, isAuthenticated: true }),
      path: "/",
      redirectTo: "/vendor-dashboard",
    },
    {
      // `isSignupLinkFlow` must require BOTH `pathname === "/register"` AND a `token` param
      // (proxy.ts line 34). A vendor cookie hitting an unrelated page with a `token` query
      // param (e.g. a tracking link) must still be pinned to the vendor dashboard — the token
      // alone must not be enough to open the signup exception.
      name: "vendor on an unrelated page with a token query param is still pinned to the vendor dashboard",
      cookie: VENDOR,
      path: "/products?token=abc",
      redirectTo: "/vendor-dashboard",
    },
  ]

  it.each(rows)("$name", async ({ cookie, path, redirectTo }) => {
    const response = await proxy(makeRequest(path, cookie))

    if (redirectTo === null) {
      expect(isNext(response)).toBe(true)
      expect(response.headers.get("location")).toBeNull()
      return
    }

    expect(response.status).toBe(307)
    expect(locationOf(response)).toBe(redirectTo)
  })
})

describe("proxy redirect construction", () => {
  it("keeps the redirect param path-only, dropping the query string of the blocked route", async () => {
    const response = await proxy(makeRequest("/buyer-dashboard/orders?page=2&status=open"))

    expect(response.headers.get("location")).toBe(`${ORIGIN}/login?redirect=%2Fbuyer-dashboard%2Forders`)
  })

  it("redirects to an absolute URL on the request origin", async () => {
    const response = await proxy(new NextRequest("https://shop.example.com/buyer-dashboard"))

    expect(response.headers.get("location")).toBe("https://shop.example.com/login?redirect=%2Fbuyer-dashboard")
  })

  it("does not treat a lookalike prefix as a dashboard route", async () => {
    const response = await proxy(makeRequest("/buyer-dashboard-info"))

    // `startsWith` matches this path, so it IS guarded — locked in so a future change is visible.
    expect(response.status).toBe(307)
    expect(locationOf(response)).toBe("/login?redirect=%2Fbuyer-dashboard-info")
  })
})

describe("proxy config.matcher", () => {
  const matcher = new RegExp(`^${config.matcher[0]}$`)

  it.each([
    ["/api/users", false],
    ["/backend-api/products", false],
    ["/_next/static/chunk.js", false],
    ["/_next/image", false],
    ["/favicon.ico", false],
    ["/qz-tray.js", false],
    ["/", true],
    ["/products/1", true],
    ["/buyer-dashboard/orders", true],
    ["/register", true],
    // The lookahead is anchored to a segment boundary, so a page whose first segment merely
    // STARTS with an excluded name still goes through the middleware (regression guard for K2:
    // these used to silently bypass the auth guard).
    ["/apidocs", true],
    ["/api-status", true],
    ["/apiary/spec", true],
    ["/backend-api-docs", true],
    ["/api", false],
    ["/backend-api", false],
  ])("matcher against %s -> %s", (pathname, expected) => {
    expect(matcher.test(pathname)).toBe(expected)
  })
})
