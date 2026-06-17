import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import type { UserProduct } from "@/lib/api/products"
import { serverRequest } from "@/lib/api/server-request"
import { getAuthorizationHeader } from "@/lib/api/server-auth"

const FILTER_FALLBACK_PAGE_SIZE = 1000

function computeStats(userProducts: UserProduct[]) {
  return {
    totalProducts: userProducts.length,
    activeProducts: userProducts.filter((p) => p.active).length,
    inactiveProducts: userProducts.filter((p) => !p.active).length,
    outOfStockProducts: userProducts.filter((p) => p.stock === 0).length,
    lowStockProducts: userProducts.filter((p) => p.stock > 0 && p.stock < 20).length,
  }
}

function extractUserProductsFromFilterPayload(data: unknown): UserProduct[] {
  if (Array.isArray(data)) {
    return data as UserProduct[]
  }

  if (data && typeof data === "object") {
    const root = data as Record<string, unknown>
    if (Array.isArray(root.content)) {
      return root.content as UserProduct[]
    }

    if (root.data && typeof root.data === "object") {
      const nested = root.data as Record<string, unknown>
      if (Array.isArray(nested.content)) {
        return nested.content as UserProduct[]
      }
    }
  }

  return []
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = getAuthorizationHeader(request)

    if (!authHeader) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const requestHeaders = {
      "Content-Type": "application/json",
      "User-Agent": "Mozilla/5.0",
      Accept: "application/json",
      Authorization: authHeader,
    }

    // Prefer backend stats endpoint for better compatibility.
    let response = await serverRequest(`/api/user-products/stats`, {
      method: "GET",
      headers: requestHeaders,
    })

    if (response.status === 403) {
      const fallbackResponse = await serverRequest(
        `/api/user-products/filter?type=TOTAL&page=0&size=${FILTER_FALLBACK_PAGE_SIZE}`,
        {
          method: "GET",
          headers: requestHeaders,
        },
      )

      if (fallbackResponse.ok) {
        const fallbackData = await fallbackResponse.json()
        const userProducts = extractUserProductsFromFilterPayload(fallbackData)
        return NextResponse.json(computeStats(userProducts))
      }

      response = fallbackResponse
    }

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
      return NextResponse.json({
        totalProducts: 0,
        activeProducts: 0,
        inactiveProducts: 0,
        outOfStockProducts: 0,
        lowStockProducts: 0,
      })
    }

    const data = await response.json()
    if (
      data &&
      typeof data === "object" &&
      "totalProducts" in data &&
      "activeProducts" in data &&
      "inactiveProducts" in data &&
      "outOfStockProducts" in data &&
      "lowStockProducts" in data
    ) {
      return NextResponse.json(data)
    }

    const userProducts = extractUserProductsFromFilterPayload(data)
    return NextResponse.json(computeStats(userProducts))
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Internal server error"
    return NextResponse.json({ message: errorMessage }, { status: 500 })
  }
}
