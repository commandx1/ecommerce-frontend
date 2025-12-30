import { type NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!BACKEND_URL) {
      return NextResponse.json({ error: "Backend URL is not configured" }, { status: 500 })
    }

    const response = await fetch(`${BACKEND_URL}/api/mail/reset-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json({ error: errorText || "Failed to reset password" }, { status: response.status })
    }

    const contentType = response.headers.get("content-type")
    if (contentType && contentType.includes("application/json")) {
      const data = await response.json()
      return NextResponse.json(data)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Reset Password Proxy Error:", error)
    return NextResponse.json({ error: (error as Error).message || "Internal server error" }, { status: 500 })
  }
}
