import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import type { UserProduct } from "@/lib/api/products"

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("Authorization")

    if (!authHeader) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Get user products from backend
    const response = await fetch(`${BACKEND_URL}/api/user-products`, {
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
      return NextResponse.json({
        totalProducts: 0,
        activeProducts: 0,
        inactiveProducts: 0,
        outOfStockProducts: 0,
        lowStockProducts: 0,
      })
    }

    const userProducts = await response.json()

    // Calculate stats
    const stats = {
      totalProducts: userProducts.length,
      activeProducts: userProducts.filter((p: UserProduct) => p.active).length,
      inactiveProducts: userProducts.filter((p: UserProduct) => !p.active).length,
      outOfStockProducts: userProducts.filter((p: UserProduct) => p.stock === 0).length,
      lowStockProducts: userProducts.filter((p: UserProduct) => p.stock > 0 && p.stock < 20).length,
    }

    return NextResponse.json(stats)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Internal server error"
    return NextResponse.json({ message: errorMessage }, { status: 500 })
  }
}
