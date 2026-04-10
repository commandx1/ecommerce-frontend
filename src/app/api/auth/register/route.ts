import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { serverRequest } from "@/lib/api/server-request"

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const response = await serverRequest(`${BACKEND_URL}/api/users/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
    })

    // Check if response has content
    const contentType = response.headers.get("content-type")
    const hasJson = contentType?.includes("application/json")

    if (!response.ok) {
      if (hasJson) {
        const data = await response.json()
        return NextResponse.json(data, { status: response.status })
      }
      // Return generic error if no JSON response
      return NextResponse.json(
        { message: `Registration failed with status ${response.status}`, status: response.status },
        { status: response.status },
      )
    }

    if (hasJson) {
      const data = await response.json()
      return NextResponse.json(data)
    }

    // If no JSON but successful, return success
    return NextResponse.json({ success: true })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Internal server error"
    return NextResponse.json({ message: errorMessage }, { status: 500 })
  }
}
