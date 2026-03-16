import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

export async function middleware(request: NextRequest) {
  const url = new URL(request.url)
  const pathname = url.pathname

  // Helper function to parse auth cookie (safe parse for URL encoded cookies)
  const parseAuthCookie = (authCookie: { value: string }) => {
    try {
      const decoded = decodeURIComponent(authCookie.value)
      return JSON.parse(decoded)
    } catch {
      try {
        return JSON.parse(authCookie.value)
      } catch {
        return null
      }
    }
  }

  const authCookie = request.cookies.get("auth-storage")
  let user: { roleName?: string } | null = null
  let isAuthenticated = false

  if (authCookie) {
    try {
      const authData = parseAuthCookie(authCookie)
      user = authData?.state?.user ?? null
      isAuthenticated = Boolean(authData?.state?.isAuthenticated)
    } catch (error) {
      console.error("[Middleware] Failed to parse auth cookie:", error)
    }
  }

  // Vendor users can only access vendor dashboard routes
  if (user?.roleName === "Vendor" && !pathname.startsWith("/vendor-dashboard")) {
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
    /*
     * Match all request paths except:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|backend-api|_next/static|_next/image|favicon.ico).*)",
  ],
}
