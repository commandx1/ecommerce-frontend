import { type NextRequest, NextResponse } from "next/server"
import { serverRequest } from "@/lib/api/server-request"
import { getAuthorizationHeader } from "@/lib/api/server-auth"


export async function GET(request: NextRequest, { params }: { params: Promise<{ productId: string }> }) {
  try {
    const { productId } = await params
    const { searchParams } = new URL(request.url)
    const page = searchParams.get("page") || "0"
    const size = searchParams.get("size") || "10"
    const userProductId = searchParams.get("userProductId")

    const authHeader = getAuthorizationHeader(request)

    const headers: HeadersInit = {
      "Content-Type": "application/json",
      "User-Agent": "Mozilla/5.0",
      Accept: "application/json",
    }

    if (authHeader) {
      headers.Authorization = authHeader
    }

    const query = new URLSearchParams({ page, size })
    if (userProductId) {
      query.set("userProductId", userProductId)
    }

    const response = await serverRequest(`/api/reviews/product/${productId}?${query.toString()}`, {
      method: "GET",
      headers,
      cache: "no-store", // Always fetch fresh data for SSR
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: "Failed to fetch reviews" }))
      return NextResponse.json(errorData, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
