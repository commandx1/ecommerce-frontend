import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { getAuthorizationHeader } from "@/lib/api/server-auth"
import { serverRequest } from "@/lib/api/server-request"

// Get vendor's own products with review status - GET /api/products/my-products
// Query: approved (TRUE|FALSE|NULL|ALL), sortBy, sortDir, page, size
export async function GET(request: NextRequest) {
  try {
    const authHeader = getAuthorizationHeader(request)

    if (!authHeader) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)

    const response = await serverRequest(`/api/products/my-products?${searchParams.toString()}`, {
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0",
        Accept: "application/json",
        Authorization: authHeader,
      },
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
      return NextResponse.json({ content: [], totalElements: 0, totalPages: 0 })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Internal server error"
    return NextResponse.json({ message: errorMessage }, { status: 500 })
  }
}
