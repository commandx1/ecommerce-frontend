import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const response = await fetch(`${BACKEND_URL}/api/mail/reset-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
    })

    // Always return success regardless of backend response
    // Handle empty or malformed responses gracefully
    try {
      const text = await response.text()
      if (text) {
        const data = JSON.parse(text)
        return NextResponse.json({ success: true, ...data })
      }
    } catch {
      // Ignore parse errors
    }

    return NextResponse.json({ success: true })
  } catch {
    // Even on network errors, return success
    return NextResponse.json({ success: true })
  }
}
