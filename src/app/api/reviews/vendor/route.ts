import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { serverRequest } from "@/lib/api/server-request"
import { getAuthorizationHeader } from "@/lib/api/server-auth"

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL

export async function GET(request: NextRequest) {
  try {
    const authHeader = getAuthorizationHeader(request)
    if (!authHeader) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const response = await serverRequest(`${BACKEND_URL}/api/reviews/vendor`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0",
        Accept: "application/json",
        Authorization: authHeader,
      },
      cache: "no-store",
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Failed to fetch vendor reviews" }))
      return NextResponse.json(error, { status: response.status })
    }

    return NextResponse.json(await response.json())
  } catch {
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
