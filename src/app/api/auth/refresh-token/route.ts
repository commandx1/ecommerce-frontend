import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { serverRequest } from "@/lib/api/server-request"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const refreshTokenValue = body.refreshToken

    // MIDDLEWARE'DA ÇALIŞAN MANTIK: Manuel Cookie Header'ı ekliyoruz
    const response = await serverRequest(`/api/auth/refresh-token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `refreshToken=${refreshTokenValue}; Path=/; SameSite=Lax`,
      },
      body: JSON.stringify({ refreshToken: refreshTokenValue }),
    })

    // AuthController.refreshToken (ecommerce-api auth/controller/AuthController.java:82-95)
    // answers a missing/absent refresh-token cookie with `ResponseEntity.status(UNAUTHORIZED)
    // .build()` - a genuinely empty body. `response.json()` throws a SyntaxError on that, which
    // would otherwise fall through to this route's outer catch and mask the real 401 as a
    // generic 500. Parse defensively and relay the real status either way.
    const rawText = await response.text()
    let data: Record<string, unknown> = {}
    if (rawText) {
      try {
        data = JSON.parse(rawText)
      } catch {
        // Non-JSON body (rare) - fall through with an empty object rather than crashing.
      }
    }

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status })
    }

    const authHeader = response.headers.get("Authorization") || response.headers.get("authorization")
    const accessToken = authHeader?.replace("Bearer ", "") || data.accessToken
    const setCookie = response.headers.get("Set-Cookie") || response.headers.get("set-cookie")

    let refreshToken = data.refreshToken
    if (!refreshToken && setCookie) {
      const match = setCookie.match(/refreshToken=([^;]+)/)
      if (match) refreshToken = match[1]
    }

    const nextResponse = NextResponse.json({
      ...data,
      accessToken,
      refreshToken: refreshToken || refreshTokenValue,
    })

    // Cookie'leri forward et
    if (setCookie) {
      nextResponse.headers.set("Set-Cookie", setCookie)
    }

    return nextResponse
  } catch {
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
