"use client"

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
  const response = await fetch("/api/auth/login/verify-2fa", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  })

  const data: Verify2FAResponse = await response.json()
  if (!response.ok) {
    throw new Error(data.error || data.message || "Invalid verification code.")
  }

  return data
}
