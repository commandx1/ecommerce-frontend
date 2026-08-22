import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { getAuthorizationHeader } from "@/lib/api/server-auth"
import { serverRequest } from "@/lib/api/server-request"

// Apply a discount to several of the vendor's products at once
// POST /api/user-products/bulk-discount
export async function POST(request: NextRequest) {
  try {
    const authHeader = getAuthorizationHeader(request)

    if (!authHeader) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()

    const response = await serverRequest("/api/user-products/bulk-discount", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0",
        Accept: "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify(body),
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
