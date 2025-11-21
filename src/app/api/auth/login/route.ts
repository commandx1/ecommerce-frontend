import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

const BASE_URL = "http://51.20.96.242:8080"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const response = await fetch(`${BASE_URL}/api/auth/login`, {
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

    // Extract tokens from response headers
    const accessToken = response.headers.get("Authorization")
    const refreshToken = response.headers.get("X-Refresh-Token")
    const setCookie = response.headers.get("Set-Cookie")

    // Create response with data
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
