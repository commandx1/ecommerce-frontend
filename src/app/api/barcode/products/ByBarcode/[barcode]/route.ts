import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { serverRequest } from "@/lib/api/server-request"

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL

// Get Product by Barcode - GET /api/barcode/products/bybarcode/:barcode
export async function GET(request: NextRequest, { params }: { params: Promise<{ barcode: string }> }) {
  try {
    const { barcode } = await params
    const authHeader = request.headers.get("Authorization")

    if (!authHeader) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    if (!barcode || barcode.trim() === "") {
      return NextResponse.json({ message: "Barcode parameter is required" }, { status: 400 })
    }

    const backendUrl = `${BACKEND_URL}/api/barcode/products/ByBarcode/${encodeURIComponent(barcode.trim())}`

    const response = await serverRequest(backendUrl, {
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
        try {
          const data = await response.json()
          return NextResponse.json(
            {
              message: data.message || `Backend request failed with status ${response.status}`,
              status: response.status,
              ...data,
            },
            { status: response.status },
          )
        } catch {
          return NextResponse.json(
            {
              message: `Backend request failed with status ${response.status}. Could not parse error response.`,
              status: response.status,
            },
            { status: response.status },
          )
        }
      }
      return NextResponse.json(
        {
          message: `Backend request failed with status ${response.status}. No error details available.`,
          status: response.status,
        },
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
    return NextResponse.json(
      {
        message: errorMessage,
        status: 500,
      },
      { status: 500 },
    )
  }
}
