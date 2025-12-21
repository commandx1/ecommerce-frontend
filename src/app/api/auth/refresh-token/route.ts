import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const response = await fetch(`${BACKEND_URL}/api/auth/refresh-token`, {
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
