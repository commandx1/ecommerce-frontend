import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://51.20.96.242:8080"

export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl
  const refreshTokenParam = searchParams.get("refreshToken")

  // Handle impersonation via refreshToken query parameter
  if (refreshTokenParam) {
    try {
      // put refresh token to cookie
      const response = await fetch(`${BACKEND_URL}/api/auth/refresh-token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cookie": `refreshToken=${refreshTokenParam}; Path=/; SameSite=Lax`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        console.log(data, 'refresh token data middleware')
        const authHeader = response.headers.get("Authorization")
        const accessToken = authHeader?.replace("Bearer ", "") || data.accessToken
        const setCookieHeader = response.headers.get("Set-Cookie")

        console.log(accessToken, 'access token middleware')

        let newRefreshToken = data.refreshToken
        if (!newRefreshToken && setCookieHeader) {
          const match = setCookieHeader.match(/refreshToken=([^;]+)/)
          if (match) newRefreshToken = match[1]
        }

        const authState = {
          state: {
            user: {
              id: data.id,
              name: data.name,
              surname: data.surname,
              email: data.email,
              phoneNumber: data.phoneNumber,
              emailConfirmed: data.emailConfirmed,
              phoneNumberConfirmed: data.phoneNumberConfirmed,
              twoFactorEnabled: data.twoFactorEnabled,
              lockoutEnd: data.lockoutEnd,
              createdDate: data.createdDate,
              roleName: data.roleName || "Vendor", // Force Vendor role for impersonation
            },
            accessToken,
            refreshToken: newRefreshToken || refreshTokenParam,
            isAuthenticated: true,
            isAdminImpersonating: true,
          },
        }

        const redirectUrl = new URL("/vendor-dashboard", request.url)
        redirectUrl.searchParams.set("impersonated", "true")
        const nextResponse = NextResponse.redirect(redirectUrl)

        // Set auth cookies for client-side hydration
        // Note: nextResponse.cookies.set automatically handles encoding
        const authStorageValue = JSON.stringify(authState)
        nextResponse.cookies.set("auth-storage", authStorageValue, {
          path: "/",
          maxAge: 30 * 24 * 60 * 60,
          sameSite: "lax",
        })

        if (newRefreshToken || refreshTokenParam) {
          nextResponse.cookies.set("refreshToken", newRefreshToken || refreshTokenParam, {
            path: "/",
            maxAge: 30 * 24 * 60 * 60,
            sameSite: "lax",
          })
        }

        return nextResponse
      }
    } catch (error) {
      console.error("Middleware impersonation error:", error)
    }
  }

  // Helper function to parse auth cookie
  const parseAuthCookie = (authCookie: { value: string }) => {
    let authData: { state?: { user?: { roleName?: string }; isAuthenticated?: boolean } }
    try {
      authData = JSON.parse(authCookie.value)
    } catch {
      const decodedValue = decodeURIComponent(authCookie.value)
      authData = JSON.parse(decodedValue)
    }
    return authData
  }

  // Protected routes logic
  if (pathname.startsWith("/vendor-dashboard")) {
    const authCookie = request.cookies.get("auth-storage")
    if (!authCookie) {
      const loginUrl = new URL("/login", request.url)
      loginUrl.searchParams.set("redirect", pathname)
      return NextResponse.redirect(loginUrl)
    }

    try {
      const authData = parseAuthCookie(authCookie)
      const user = authData?.state?.user
      if (!user || !authData?.state?.isAuthenticated) {
        const loginUrl = new URL("/login", request.url)
        loginUrl.searchParams.set("redirect", pathname)
        return NextResponse.redirect(loginUrl)
      }

      if (user.roleName !== "Vendor") {
        return NextResponse.redirect(new URL("/buyer-dashboard", request.url))
      }
    } catch {
      const loginUrl = new URL("/login", request.url)
      loginUrl.searchParams.set("redirect", pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  if (pathname.startsWith("/buyer-dashboard")) {
    const authCookie = request.cookies.get("auth-storage")
    if (!authCookie) {
      const loginUrl = new URL("/login", request.url)
      loginUrl.searchParams.set("redirect", pathname)
      return NextResponse.redirect(loginUrl)
    }

    try {
      const authData = parseAuthCookie(authCookie)
      const user = authData?.state?.user
      if (!user || !authData?.state?.isAuthenticated) {
        const loginUrl = new URL("/login", request.url)
        loginUrl.searchParams.set("redirect", pathname)
        return NextResponse.redirect(loginUrl)
      }

      if (user.roleName === "Vendor") {
        return NextResponse.redirect(new URL("/vendor-dashboard", request.url))
      }
    } catch {
      const loginUrl = new URL("/login", request.url)
      loginUrl.searchParams.set("redirect", pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
}
