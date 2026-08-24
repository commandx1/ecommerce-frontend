import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

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
  // Exception: /register?token=... is the admin-invited signup flow — let it through
  const isSignupLinkFlow = pathname === "/register" && url.searchParams.has("token")
  if (
    isAuthenticated &&
    user?.roleName === "Vendor" &&
    !pathname.startsWith("/vendor-dashboard") &&
    !isSignupLinkFlow
  ) {
    return NextResponse.redirect(new URL("/vendor-dashboard", request.url))
  }

  // Protected dashboard routes logic
  if (pathname.startsWith("/vendor-dashboard") || pathname.startsWith("/buyer-dashboard")) {
    if (!authCookie || !user || !isAuthenticated) {
      const loginUrl = new URL("/login", request.url)
      loginUrl.searchParams.set("redirect", pathname)
      return NextResponse.redirect(loginUrl)
    }

    // Role check between dashboards
    if (pathname.startsWith("/vendor-dashboard") && user.roleName !== "Vendor") {
      return NextResponse.redirect(new URL("/buyer-dashboard", request.url))
    }

    if (pathname.startsWith("/buyer-dashboard") && user.roleName === "Vendor") {
      return NextResponse.redirect(new URL("/vendor-dashboard", request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    // The lookahead is anchored to a segment boundary (`api/` or end-of-path) so that a page
    // whose first segment merely STARTS with an excluded name (`/apidocs`, `/api-status`)
    // still goes through the auth guard.
    "/((?!api/|api$|backend-api/|backend-api$|_next/static|_next/image|favicon\\.ico$|qz-tray\\.js$).*)",
  ],
}
