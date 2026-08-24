import { type NextRequest, NextResponse } from "next/server"
import { sanitizeUpstreamErrorMessage } from "@/lib/api/sanitize-upstream-error"
import { serverRequest } from "@/lib/api/server-request"

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    const body = await request.json()

    const headers: HeadersInit = {
      "Content-Type": "application/json",
    }

    if (authHeader) {
      headers.Authorization = authHeader
    }

    const response = await serverRequest(`/api/product-questions`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorText = await response.text()
      const message = errorText ? sanitizeUpstreamErrorMessage(errorText, response.status) : "Failed to create question"
      return NextResponse.json({ error: message }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
