import { type NextRequest, NextResponse } from "next/server"
import { serverRequest } from "@/lib/api/server-request"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const response = await serverRequest(`/api/mail/reset-password`, {
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
    if (contentType?.includes("application/json")) {
      const data = await response.json()
      return NextResponse.json(data)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message || "Internal server error" }, { status: 500 })
  }
}
