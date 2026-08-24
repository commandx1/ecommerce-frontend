import { type NextRequest, NextResponse } from "next/server"
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

    const response = await serverRequest(`/api/reviews`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Failed to create review" }))
      return NextResponse.json(error, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
