import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { getAuthorizationHeader } from "@/lib/api/server-auth"
import { serverRequest } from "@/lib/api/server-request"

// Distinct brands of the authenticated vendor's own products
// GET /api/user-products/brands
export async function GET(request: NextRequest) {
  try {
    const authHeader = getAuthorizationHeader(request)

    if (!authHeader) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const response = await serverRequest("/api/user-products/brands", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
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
      return NextResponse.json([])
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Internal server error"
    return NextResponse.json({ message: errorMessage }, { status: 500 })
  }
}
