import { apiRequest } from "./request"

export type ImpersonationRefreshResponse = {
  accessToken: string
  refreshToken?: string
  roleName?: string | null
  // backend may return additional user fields
  [key: string]: unknown
}

export async function refreshTokenForImpersonation(refreshToken: string): Promise<ImpersonationRefreshResponse> {
  return apiRequest.requestJson<ImpersonationRefreshResponse>({
    client: "app",
    method: "POST",
    url: "/api/auth/refresh-token",
    data: { refreshToken },
    fallbackMessage: "Impersonation failed",
  })
}
