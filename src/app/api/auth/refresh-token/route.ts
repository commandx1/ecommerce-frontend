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

    const data = await response.json()

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
