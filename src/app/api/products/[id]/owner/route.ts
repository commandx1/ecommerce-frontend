import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { buildErrorResponse, parseJsonOrText, proxyRequest } from "@/features/products/api/proxy/http"

// Get Product by ID, ignoring active status (owner or admin only) - GET /api/products/:id/owner
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const authHeader = request.headers.get("Authorization")

    if (!authHeader) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const response = await proxyRequest({
      id: `${id}/owner`,
      method: "GET",
      authHeader,
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
