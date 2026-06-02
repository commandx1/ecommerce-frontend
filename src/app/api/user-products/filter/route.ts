import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { serverRequest } from "@/lib/api/server-request"

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL

function getAuthorizationHeader(request: NextRequest): string | null {
  const directAuthHeader = request.headers.get("Authorization")
  if (directAuthHeader) {
    return directAuthHeader
  }

  const authCookie = request.cookies.get("auth-storage")
  if (!authCookie) {
    return null
  }

  try {
    const parsed = JSON.parse(authCookie.value) as { state?: { accessToken?: string } }
    const token = parsed?.state?.accessToken
    return token ? `Bearer ${token}` : null
  } catch {
    try {
      const decoded = decodeURIComponent(authCookie.value)
      const parsed = JSON.parse(decoded) as { state?: { accessToken?: string } }
      const token = parsed?.state?.accessToken
      return token ? `Bearer ${token}` : null
    } catch {
      return null
    }
  }
}

// Filter User Products - GET /api/user-products/filter?type=ACTIVE&price=false&page=0&size=10
export async function GET(request: NextRequest) {
  try {
    const authHeader = getAuthorizationHeader(request)

    if (!authHeader) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type")
    const price = searchParams.get("price")
    const stock = searchParams.get("stock")
    const page = searchParams.get("page") || "0"
    const size = searchParams.get("size") || "10"
    const search = searchParams.get("search")
    const howManySoldDay = searchParams.get("howManySoldDay") || "0"
    const sortBy = searchParams.get("sortBy")
    const sortDir = searchParams.get("sortDir")

    if (!type) {
      return NextResponse.json({ message: "Type parameter is required" }, { status: 400 })
    }

    const queryParams = new URLSearchParams({
      type,
      page,
      size,
      howManySoldDay,
    })

    // Only add optional parameters if they are provided
    if (price !== null) {
      queryParams.append("price", price)
    }
    if (stock !== null) {
      queryParams.append("stock", stock)
    }
    if (search !== null && search !== "") {
      queryParams.append("search", search)
    }
    if (sortBy !== null && sortBy !== "") {
      queryParams.append("sortBy", sortBy)
    }
    if (sortDir !== null && sortDir !== "") {
      queryParams.append("sortDir", sortDir)
    }

    const response = await serverRequest(`${BACKEND_URL}/api/user-products/filter?${queryParams.toString()}`, {
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
