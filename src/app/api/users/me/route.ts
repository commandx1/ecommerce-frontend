import { type NextRequest, NextResponse } from "next/server"
import { sanitizeUpstreamErrorMessage } from "@/lib/api/sanitize-upstream-error"
import { serverRequest } from "@/lib/api/server-request"

export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()

    const response = await serverRequest(`/api/users/me`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorText = await response.text()
      const message = errorText ? sanitizeUpstreamErrorMessage(errorText, response.status) : "Failed to update user"
      return NextResponse.json({ error: message }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const response = await serverRequest(`/api/users/me`, {
      method: "DELETE",
      headers: {
        Authorization: authHeader,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      const message = errorText ? sanitizeUpstreamErrorMessage(errorText, response.status) : "Failed to delete user"
      return NextResponse.json({ error: message }, { status: response.status })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
