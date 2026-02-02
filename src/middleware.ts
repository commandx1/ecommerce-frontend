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

  // Protected routes logic
  if (pathname.startsWith("/vendor-dashboard") || pathname.startsWith("/buyer-dashboard")) {
    const authCookie = request.cookies.get("auth-storage")
    
    if (!authCookie) {
      const loginUrl = new URL("/login", request.url)
      loginUrl.searchParams.set("redirect", pathname)
      return NextResponse.redirect(loginUrl)
    }

    try {
      const authData = parseAuthCookie(authCookie)
      const user = authData?.state?.user
      const isAuthenticated = authData?.state?.isAuthenticated

      if (!user || !isAuthenticated) {
        const loginUrl = new URL("/login", request.url)
        loginUrl.searchParams.set("redirect", pathname)
        return NextResponse.redirect(loginUrl)
      }

      // Role check
      if (pathname.startsWith("/vendor-dashboard") && user.roleName !== "Vendor") {
        return NextResponse.redirect(new URL("/buyer-dashboard", request.url))
      }
      
      if (pathname.startsWith("/buyer-dashboard") && user.roleName === "Vendor") {
        return NextResponse.redirect(new URL("/vendor-dashboard", request.url))
      }
    } catch (error) {
      console.error("[Middleware] Auth check error:", error)
      const loginUrl = new URL("/login", request.url)
      return NextResponse.redirect(loginUrl)
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
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
}
