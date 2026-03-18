"use client"

export type ImpersonationRefreshResponse = {
  accessToken: string
  refreshToken?: string
  roleName?: string | null
  // backend may return additional user fields
  [key: string]: unknown
}

export async function refreshTokenForImpersonation(refreshToken: string): Promise<ImpersonationRefreshResponse> {
  const response = await fetch("/api/auth/refresh-token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ refreshToken }),
  })

  let data: unknown = null
  try {
    data = await response.json()
  } catch {
    // ignore non-json responses
  }

  if (!response.ok) {
    const message =
      data && typeof data === "object" && "message" in data && typeof (data as any).message === "string"
        ? (data as any).message
        : "Impersonation failed"
    throw new Error(message)
  }

  return data as ImpersonationRefreshResponse
}
