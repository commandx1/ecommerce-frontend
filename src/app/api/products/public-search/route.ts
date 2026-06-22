import { type NextRequest, NextResponse } from "next/server"
import { serverRequest } from "@/lib/api/server-request"


// Public Search Products - GET /api/products/public-search?Search=...&page=0&size=20
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""
    const page = searchParams.get("page") || "0"
    const size = searchParams.get("size") || "20"

    const queryParams = new URLSearchParams({
      search,
      page,
      size,
    })

    const response = await serverRequest(`/api/products/public-search?${queryParams.toString()}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0",
        Accept: "application/json",
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
