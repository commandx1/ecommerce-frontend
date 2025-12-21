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
      // Try parsing directly (might be already decoded)
      authData = JSON.parse(authCookie.value)
    } catch {
      // If that fails, try URL decoding first
      const decodedValue = decodeURIComponent(authCookie.value)
      authData = JSON.parse(decodedValue)
    }

    return authData?.state?.accessToken || null
  } catch {
    return null
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

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

    const response = await fetch(`${BACKEND_URL}/api/products/${id}/with-user-products`, {
      method: "GET",
      headers,
      cache: "no-store", // Always fetch fresh data for SSR
    })

    if (!response.ok) {
      let errorMessage = "Failed to fetch product"
      try {
        const contentType = response.headers.get("content-type")
        if (contentType?.includes("application/json")) {
          const errorData = await response.json()
          errorMessage = errorData.message || errorData.error || errorMessage
        } else {
          const errorText = await response.text()
          if (errorText.trim()) {
            errorMessage = errorText
          }
        }
      } catch {
        // Use default error message
      }

      // Provide more specific error messages based on status
      if (response.status === 403) {
        errorMessage = "You don't have permission to view this product"
      } else if (response.status === 404) {
        errorMessage = "Product not found"
      } else if (response.status === 401) {
        errorMessage = "Authentication required"
      }

      return NextResponse.json({ message: errorMessage }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

