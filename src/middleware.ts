import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Helper function to parse auth cookie
  const parseAuthCookie = (authCookie: { value: string }) => {
    let authData: { state?: { user?: { roleName?: string }; isAuthenticated?: boolean } }
    try {
      // Try parsing directly (might be already decoded)
      authData = JSON.parse(authCookie.value)
    } catch {
      // If that fails, try URL decoding first
      const decodedValue = decodeURIComponent(authCookie.value)
      authData = JSON.parse(decodedValue)
    }
    return authData
  }

  // Check if the route is vendor-dashboard
  if (pathname.startsWith("/vendor-dashboard")) {
    // Get auth data from cookie (set by zustand persist with cookie storage)
    const authCookie = request.cookies.get("auth-storage")

    if (!authCookie) {
      // Not authenticated, redirect to login
      const loginUrl = new URL("/login", request.url)
      loginUrl.searchParams.set("redirect", pathname)
      return NextResponse.redirect(loginUrl)
    }

    try {
      const authData = parseAuthCookie(authCookie)
      const user = authData?.state?.user

      // Check if user is authenticated
      if (!user || !authData?.state?.isAuthenticated) {
        const loginUrl = new URL("/login", request.url)
        loginUrl.searchParams.set("redirect", pathname)
        return NextResponse.redirect(loginUrl)
      }

      // Check if user is a vendor (roleName === "Vendor")
      if (user.roleName !== "Vendor") {
        // Not a vendor, redirect to buyer dashboard
        return NextResponse.redirect(new URL("/buyer-dashboard", request.url))
      }
    } catch {
      // Invalid auth data, redirect to login
      const loginUrl = new URL("/login", request.url)
      loginUrl.searchParams.set("redirect", pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  // Check if the route is buyer-dashboard
  if (pathname.startsWith("/buyer-dashboard")) {
    // Get auth data from cookie (set by zustand persist with cookie storage)
    const authCookie = request.cookies.get("auth-storage")

    if (!authCookie) {
      // Not authenticated, redirect to login
      const loginUrl = new URL("/login", request.url)
      loginUrl.searchParams.set("redirect", pathname)
      return NextResponse.redirect(loginUrl)
    }

    try {
      const authData = parseAuthCookie(authCookie)
      const user = authData?.state?.user

      // Check if user is authenticated
      if (!user || !authData?.state?.isAuthenticated) {
        const loginUrl = new URL("/login", request.url)
        loginUrl.searchParams.set("redirect", pathname)
        return NextResponse.redirect(loginUrl)
      }

      // Check if user is a vendor (roleName === "Vendor")
      if (user.roleName === "Vendor") {
        // Is a vendor, redirect to vendor dashboard
        return NextResponse.redirect(new URL("/vendor-dashboard", request.url))
      }
    } catch {
      // Invalid auth data, redirect to login
      const loginUrl = new URL("/login", request.url)
      loginUrl.searchParams.set("redirect", pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/vendor-dashboard/:path*", "/buyer-dashboard/:path*"],
}
