import { type NextRequest, NextResponse } from "next/server"
import { serverRequest } from "@/lib/api/server-request"


import { getAuthorizationHeader } from "@/lib/api/server-auth"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const authHeader = getAuthorizationHeader(request)

    const headers: HeadersInit = {
      "Content-Type": "application/json",
      "User-Agent": "Mozilla/5.0",
      Accept: "application/json",
    }

    if (authHeader) {
      headers.Authorization = authHeader
    }

    const response = await serverRequest(`/api/products/${id}/with-user-products`, {
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
