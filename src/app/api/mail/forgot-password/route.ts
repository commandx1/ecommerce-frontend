import { type NextRequest, NextResponse } from "next/server"
import { serverRequest } from "@/lib/api/server-request"

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!BACKEND_URL) {
      return NextResponse.json({ error: "Backend URL is not configured" }, { status: 500 })
    }

    const response = await serverRequest(`${BACKEND_URL}/api/mail/forgot-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json({ error: errorText || "Failed to send reset email" }, { status: response.status })
    }

    // Backend might return 200 OK with an empty body (Postman handles this, but fetch.json() fails)
    const contentType = response.headers.get("content-type")
    if (contentType?.includes("application/json")) {
      const data = await response.json()
      return NextResponse.json(data)
    }

    // If not JSON or empty, just return success
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message || "Internal server error" }, { status: 500 })
  }
}
