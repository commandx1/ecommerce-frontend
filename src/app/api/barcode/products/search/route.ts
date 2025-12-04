import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

const BASE_URL = "http://51.20.96.242:8080"

// Search Products by Title - GET /api/barcode/products/search?title=...
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("Authorization")
    const { searchParams } = new URL(request.url)
    const title = searchParams.get("title")

    if (!authHeader) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    if (!title) {
      return NextResponse.json({ message: "Title parameter is required" }, { status: 400 })
    }

    const response = await fetch(`${BASE_URL}/api/barcode/products/search?title=${encodeURIComponent(title)}`, {
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
      return NextResponse.json({ products: [], barcodeProducts: [] })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Internal server error"
    return NextResponse.json({ message: errorMessage }, { status: 500 })
  }
}


