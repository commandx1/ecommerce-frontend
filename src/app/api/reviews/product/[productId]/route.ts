import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL

// Helper function to parse auth cookie and get access token
function getAccessTokenFromCookie(request: NextRequest): string | null {
  const authCookie = request.cookies.get("auth-storage")
  if (!authCookie) {
    return null
  }

  try {
    let authData: { state?: { accessToken?: string } }
    try {
      authData = JSON.parse(authCookie.value)
    } catch {
      const decodedValue = decodeURIComponent(authCookie.value)
      authData = JSON.parse(decodedValue)
    }

    return authData?.state?.accessToken || null
  } catch {
    return null
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ productId: string }> }) {
  try {
    const { productId } = await params
    const { searchParams } = new URL(request.url)
    const page = searchParams.get("page") || "0"
    const size = searchParams.get("size") || "10"

    // Get access token from cookie
    const accessToken = getAccessTokenFromCookie(request)

    // Build headers
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      "User-Agent": "Mozilla/5.0",
      Accept: "application/json",
    }

    // Add authorization header if token exists
    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`
    }

    const response = await fetch(`${BACKEND_URL}/api/reviews/product/${productId}?page=${page}&size=${size}`, {
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
