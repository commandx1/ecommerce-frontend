import { type NextRequest, NextResponse } from "next/server"
import { serverRequest } from "@/lib/api/server-request"

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const authHeader = request.headers.get("authorization")
    const body = await request.json()

    const headers: HeadersInit = {
      "Content-Type": "application/json",
    }

    if (authHeader) {
      headers.Authorization = authHeader
    }

    const response = await serverRequest(`/api/reviews/${encodeURIComponent(id)}`, {
      method: "PUT",
      headers,
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Failed to update review" }))
      return NextResponse.json(error, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const authHeader = request.headers.get("authorization")

    const headers: HeadersInit = {
      "Content-Type": "application/json",
    }

    if (authHeader) {
      headers.Authorization = authHeader
    }

    const response = await serverRequest(`/api/reviews/${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers,
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Failed to delete review" }))
      return NextResponse.json(error, { status: response.status })
    }

    // Backend answers 204 No Content, so there is no body to forward.
    return new NextResponse(null, { status: 204 })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
