import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { buildErrorResponse, parseJsonOrText, proxyRequest } from "@/features/products/api/proxy/http"
import type { ProductRouteContext } from "@/features/products/api/proxy/types"

// Get Product by ID - GET /api/products/:id
export async function GET(_request: NextRequest, { params }: ProductRouteContext) {
  try {
    const { id } = await params

    const response = await proxyRequest({
      id,
      method: "GET",
    })

    if (response.status < 200 || response.status >= 300) {
      return buildErrorResponse(response)
    }

    const parsed = await parseJsonOrText(response)
    if (!parsed.isJson) {
      return NextResponse.json({ message: "Invalid response from server" }, { status: 500 })
    }

    return NextResponse.json(parsed.data)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Internal server error"
    return NextResponse.json({ message: errorMessage }, { status: 500 })
  }
}

// Update Product by ID - PUT /api/products/:id
export async function PUT(request: NextRequest, { params }: ProductRouteContext) {
  try {
    const { id } = await params
    const authHeader = request.headers.get("Authorization")

    if (!authHeader) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const response = await proxyRequest({
      id,
      method: "PUT",
      authHeader,
      body,
    })

    if (response.status < 200 || response.status >= 300) {
      return buildErrorResponse(response)
    }

    const parsed = await parseJsonOrText(response)
    if (!parsed.isJson) {
      return NextResponse.json({ success: true })
    }

    return NextResponse.json(parsed.data)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Internal server error"
    return NextResponse.json({ message: errorMessage }, { status: 500 })
  }
}

// Delete Product by ID - DELETE /api/products/:id
export async function DELETE(request: NextRequest, { params }: ProductRouteContext) {
  try {
    const { id } = await params
    const authHeader = request.headers.get("Authorization")

    if (!authHeader) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const response = await proxyRequest({
      id,
      method: "DELETE",
      authHeader,
    })

    if (response.status < 200 || response.status >= 300) {
      return buildErrorResponse(response)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Internal server error"
    return NextResponse.json({ message: errorMessage }, { status: 500 })
  }
}
