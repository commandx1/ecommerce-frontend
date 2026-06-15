import type { NextRequest } from "next/server"

export function getAuthorizationHeader(request: NextRequest): string | null {
  const direct = request.headers.get("Authorization")
  if (direct) return direct

  const cookie = request.cookies.get("auth-storage")
  if (!cookie) return null

  try {
    let parsed: { state?: { accessToken?: string } }
    try {
      parsed = JSON.parse(cookie.value)
    } catch {
      parsed = JSON.parse(decodeURIComponent(cookie.value))
    }
    const token = parsed?.state?.accessToken
    return token ? `Bearer ${token}` : null
  } catch {
    return null
  }
}
