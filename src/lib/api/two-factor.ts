"use client"

import { apiRequest } from "./request"

export type Verify2FAResponse = {
  accessToken?: string
  refreshToken?: string
  error?: string
  message?: string
  id: string
  name: string
  surname: string
  email: string
  phoneNumber: string
  emailConfirmed: boolean
  phoneNumberConfirmed: boolean
  twoFactorEnabled: boolean
  lockoutEnd: string | null
  createdDate: string
  roleName?: string
}

export async function verifyTwoFactorLogin(params: {
  email: string
  code: string
  device: string
}): Promise<Verify2FAResponse> {
  return apiRequest.requestJson<Verify2FAResponse>({
    client: "app",
    method: "POST",
    url: "/api/auth/login/verify-2fa",
    data: params,
    fallbackMessage: "Invalid verification code.",
  })
}
