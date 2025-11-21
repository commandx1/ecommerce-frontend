import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

const BASE_URL = "http://51.20.96.242:8080"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const response = await fetch(`${BASE_URL}/api/mail/verify-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const data = await response.json()
      return NextResponse.json(data, { status: response.status })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
