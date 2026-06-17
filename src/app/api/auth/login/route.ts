import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { serverRequest } from "@/lib/api/server-request"


export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const response = await serverRequest(`/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
    })

    // Check if response has JSON content
    const contentType = response.headers.get("content-type")
    const hasJson = contentType?.includes("application/json")

    if (!response.ok) {
      if (hasJson) {
        const data = await response.json()
        return NextResponse.json(data, { status: response.status })
      }
      return NextResponse.json(
        { message: `Login failed with status ${response.status}`, status: response.status },
        { status: response.status },
      )
    }

    if (!hasJson) {
      return NextResponse.json({ message: "Invalid response from server" }, { status: 500 })
    }

    const data = await response.json()

    // Extract access token from Authorization header (Backend sends it here!)
    const authHeader = response.headers.get("Authorization")
    const accessToken = authHeader?.replace("Bearer ", "") || data.accessToken || data.token

    // Extract refresh token from Set-Cookie header
    // Backend sends: Set-Cookie: refreshToken=656df024-7dca-4d42-be6a-...; Path=/; ...
    const setCookie = response.headers.get("Set-Cookie")
    let refreshToken = response.headers.get("X-Refresh-Token") || data.refreshToken

    // Parse refresh token from Set-Cookie if present
    if (!refreshToken && setCookie) {
      const match = setCookie.match(/refreshToken=([^;]+)/)
      if (match) {
        refreshToken = match[1]
      }
    }

    // Create response with data and tokens in body
    const nextResponse = NextResponse.json({
      ...data,
      accessToken,
      refreshToken,
    })

    // Forward cookies if present
    if (setCookie) {
      nextResponse.headers.set("Set-Cookie", setCookie)
    }

    return nextResponse
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Internal server error"
    return NextResponse.json({ message: errorMessage }, { status: 500 })
  }
}
