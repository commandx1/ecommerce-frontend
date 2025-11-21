import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

const BASE_URL = "http://51.20.96.242:8080"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const response = await fetch(`${BASE_URL}/api/auth/refresh-token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status })
    }

    // Extract tokens from response headers
    const accessToken = response.headers.get("Authorization")
    const refreshToken = response.headers.get("X-Refresh-Token")

    return NextResponse.json({
      ...data,
      accessToken,
      refreshToken,
    })
  } catch {
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
