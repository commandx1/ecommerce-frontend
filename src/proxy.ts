import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { RETURN_TO_PARAM } from "@/lib/auth/dashboard-access"

/**
 * Every redirect below is decided by the shared `auth-storage` cookie, which only mirrors whichever
 * tab wrote it last (per-tab sessions, see tab-session-storage.ts). Such a decision must never be
 * stored by any HTTP cache; the client Router Cache is covered by `config.matcher` (prefetches
 * never reach this function).
 */
const redirectTo = (url: URL): NextResponse => {
  const response = NextResponse.redirect(url)
  response.headers.set("Cache-Control", "private, no-store")
  return response
}

/**
 * A role-mismatch redirect from one dashboard to the other. When the shared cookie belongs to a
 * sibling tab's account, the tab that asked is not really of that role: its dashboard guard resyncs
 * the cookie and sends it home - to `returnTo` (validated there, see `resolveCrossRoleReturnTo`)
 * rather than to its dashboard root, so the page it asked for is not lost.
 */
const crossRoleRedirect = (target: string, request: NextRequest): NextResponse => {
  const url = new URL(target, request.url)
  url.searchParams.set(RETURN_TO_PARAM, request.nextUrl.pathname + request.nextUrl.search)
  return redirectTo(url)
}

export async function proxy(request: NextRequest) {
  const url = new URL(request.url)
  const pathname = url.pathname

  // Helper function to parse auth cookie (safe parse for URL encoded cookies)
  const parseAuthCookie = (authCookie: { value: string }) => {
    // `request.cookies.get(...).value` is already the raw (undecoded) cookie value here, so
    // this decodes it exactly once. A second `decodeURIComponent` pass on an already-decoded
    // value that happens to contain a literal `%` (not a valid escape sequence) throws and used
    // to make the whole cookie get dropped, silently logging the user out.
    let decoded: string
    try {
      decoded = decodeURIComponent(authCookie.value)
    } catch {
      // Malformed percent-encoding - fall back to the raw value rather than crashing the proxy.
      decoded = authCookie.value
    }

    try {
      return JSON.parse(decoded)
    } catch {
      return null
    }
  }

  const authCookie = request.cookies.get("auth-storage")
  let user: { roleName?: string } | null = null
  let isAuthenticated = false

  if (authCookie) {
    const authData = parseAuthCookie(authCookie)
    user = authData?.state?.user ?? null
    isAuthenticated = Boolean(authData?.state?.isAuthenticated)
  }

  // Vendor users can only access vendor dashboard routes
  // Auth pages establish or replace THIS tab's session (per-tab sessions), so a vendor cookie
  // left by another tab must never bounce them to /vendor-dashboard.
  const AUTH_PATHS = ["/login", "/register", "/verify-email", "/verify-2fa", "/forgot-password", "/reset-password"]
  const isAuthPage = pathname.startsWith("/auth/") || AUTH_PATHS.includes(pathname)
  if (isAuthenticated && user?.roleName === "Vendor" && !pathname.startsWith("/vendor-dashboard") && !isAuthPage) {
    // Only a buyer-dashboard request can come from a tab of the other role that wants to go back;
    // storefront pages keep the plain redirect (vendors are simply not allowed there).
    return pathname.startsWith("/buyer-dashboard")
      ? crossRoleRedirect("/vendor-dashboard", request)
      : redirectTo(new URL("/vendor-dashboard", request.url))
  }

  // Protected dashboard routes logic
  if (pathname.startsWith("/vendor-dashboard") || pathname.startsWith("/buyer-dashboard")) {
    if (!authCookie || !user || !isAuthenticated) {
      const loginUrl = new URL("/login", request.url)
      loginUrl.searchParams.set("redirect", pathname + request.nextUrl.search)
      return redirectTo(loginUrl)
    }

    // Role check between dashboards
    if (pathname.startsWith("/vendor-dashboard") && user.roleName !== "Vendor") {
      return crossRoleRedirect("/buyer-dashboard", request)
    }

    if (pathname.startsWith("/buyer-dashboard") && user.roleName === "Vendor") {
      return crossRoleRedirect("/vendor-dashboard", request)
    }
  }

  return NextResponse.next()
}

/**
 * App Router prefetches skip this proxy entirely (`missing` below), so a role/auth redirect is
 * never stored in the client Router Cache.
 *
 * A prefetch runs in the background - often in a tab that is not focused - and therefore carries
 * the FOCUSED tab's cookie. Redirecting it (e.g. "/" -> /vendor-dashboard because a sibling tab is
 * a vendor) made the Router Cache remember "this link leads to /vendor-dashboard" for minutes, and
 * with a dashboard `loading.tsx` the router committed that stale redirect instantly on the next
 * navigation. Next strips the `rsc` / `next-router-*prefetch` headers before calling `proxy()`, so
 * the function itself cannot tell a prefetch apart - only the matcher, which sees the raw request.
 *
 * This does not weaken the guard: a prefetch renders a route's layouts only down to its
 * `loading.tsx` (the dashboard layouts are client guards that render no `children` until the tab's
 * own session passes, and no dashboard server component reads the cookie), and the navigation that
 * follows is a normal RSC request that always passes through here with the then-current cookie.
 */
export const config = {
  matcher: [
    {
      // The lookahead is anchored to a segment boundary (`api/` or end-of-path) so that a page
      // whose first segment merely STARTS with an excluded name (`/apidocs`, `/api-status`)
      // still goes through the auth guard.
      source:
        "/((?!api/|api$|backend-api/|backend-api$|backend-ws/|backend-ws$|_next/static|_next/image|favicon\\.ico$|qz-tray\\.js$|.*\\.(?:png|jpe?g|gif|svg|webp|avif|ico|txt|xml|json|woff2?)$).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "next-router-segment-prefetch" },
      ],
    },
  ],
}
