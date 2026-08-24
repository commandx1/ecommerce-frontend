import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { serverRequest } from "@/lib/api/server-request"

// Get Product Details by Product ID - GET /api/products/details/by-product/:productId
export async function GET(_request: NextRequest, { params }: { params: Promise<{ productId: string }> }) {
  try {
    const { productId } = await params

    const response = await serverRequest(`/api/products/details/by-product/${encodeURIComponent(productId)}`, {
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
      return NextResponse.json({ message: "Invalid response from server" }, { status: 500 })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Internal server error"
    return NextResponse.json({ message: errorMessage }, { status: 500 })
  }
}

// Update Product Details by Product ID - PUT /api/products/details/by-product/:productId
export async function PUT(request: NextRequest, { params }: { params: Promise<{ productId: string }> }) {
  try {
    const { productId } = await params
    const authHeader = request.headers.get("Authorization")

    if (!authHeader) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()

    const response = await serverRequest(`/api/products/details/by-product/${encodeURIComponent(productId)}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0",
        Accept: "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify(body),
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
      return NextResponse.json({ success: true })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Internal server error"
    return NextResponse.json({ message: errorMessage }, { status: 500 })
  }
}

// Delete Product Details by Product ID - DELETE /api/products/details/by-product/:productId
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ productId: string }> }) {
  try {
    const { productId } = await params
    const authHeader = request.headers.get("Authorization")

    if (!authHeader) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const response = await serverRequest(`/api/products/details/by-product/${encodeURIComponent(productId)}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0",
        Accept: "application/json",
        Authorization: authHeader,
      },
    })

    if (!response.ok) {
      const contentType = response.headers.get("content-type")
      const hasJson = contentType?.includes("application/json")

      if (hasJson) {
        const data = await response.json()
        return NextResponse.json(data, { status: response.status })
      }
      return NextResponse.json(
        { message: `Request failed with status ${response.status}`, status: response.status },
        { status: response.status },
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Internal server error"
    return NextResponse.json({ message: errorMessage }, { status: 500 })
  }
}
