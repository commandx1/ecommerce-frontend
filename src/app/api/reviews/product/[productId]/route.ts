import { type NextRequest, NextResponse } from "next/server"
import { serverRequest } from "@/lib/api/server-request"
import { getAuthorizationHeader } from "@/lib/api/server-auth"

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL

export async function GET(request: NextRequest, { params }: { params: Promise<{ productId: string }> }) {
  try {
    const { productId } = await params
    const { searchParams } = new URL(request.url)
    const page = searchParams.get("page") || "0"
    const size = searchParams.get("size") || "10"

    const authHeader = getAuthorizationHeader(request)

    const headers: HeadersInit = {
      "Content-Type": "application/json",
      "User-Agent": "Mozilla/5.0",
      Accept: "application/json",
    }

    if (authHeader) {
      headers.Authorization = authHeader
    }

    const response = await serverRequest(`${BACKEND_URL}/api/reviews/product/${productId}?page=${page}&size=${size}`, {
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
