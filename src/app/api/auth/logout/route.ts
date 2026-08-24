import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { serverRequest } from "@/lib/api/server-request"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const authHeader = request.headers.get("Authorization")

    await serverRequest(`/api/auth/logout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
      body: JSON.stringify(body),
    }).catch(() => null)

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ success: true })
  }
}
