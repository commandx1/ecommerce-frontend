import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { serverRequest } from "@/lib/api/server-request"

type RouteContext = {
  params: Promise<{ id: string }>
}

// Update a rejected product and resubmit it for review - PUT /api/products/review/:id
// Content-Type: multipart/form-data
// Fields: data (JSON string), coverPhoto (file), photos (file[])
export async function PUT(request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params
    const authHeader = request.headers.get("Authorization")

    if (!authHeader) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()

    const response = await serverRequest(`/api/products/review/${encodeURIComponent(id)}`, {
      method: "PUT",
      headers: {
        "User-Agent": "Mozilla/5.0",
        Accept: "application/json",
        Authorization: authHeader,
        // Note: Don't set Content-Type for FormData, fetch will set it with boundary
      },
      body: formData,
    })

    const contentType = response.headers.get("content-type")
    const hasJson = contentType?.includes("application/json")

    if (!response.ok) {
      if (hasJson) {
        const data = await response.json()
        return NextResponse.json(data, { status: response.status })
      }
      return NextResponse.json(
        { message: `Request failed with status ${response.status}`, status: response.status },
        { status: response.status },
      )
    }

    if (!hasJson) {
      return NextResponse.json({ success: true })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Internal server error"
    return NextResponse.json({ message: errorMessage }, { status: 500 })
  }
}
