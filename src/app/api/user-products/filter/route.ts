import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

const BASE_URL = "http://51.20.96.242:8080"

// Filter User Products - GET /api/user-products/filter?type=ACTIVE&price=false&page=0&size=10
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("Authorization")

    if (!authHeader) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type")
    const price = searchParams.get("price") || "false"
    const page = searchParams.get("page") || "0"
    const size = searchParams.get("size") || "10"

    if (!type) {
      return NextResponse.json({ message: "Type parameter is required" }, { status: 400 })
    }

    const queryParams = new URLSearchParams({
      type,
      price,
      page,
      size,
    })

    const response = await fetch(`${BASE_URL}/api/user-products/filter?${queryParams.toString()}`, {
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
      return NextResponse.json({ content: [], totalElements: 0, totalPages: 0, page: 0, size: 0 })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Internal server error"
    return NextResponse.json({ message: errorMessage }, { status: 500 })
  }
}
