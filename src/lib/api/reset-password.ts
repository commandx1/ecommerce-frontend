"use client"

import { apiRequest } from "./request"

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  await apiRequest.requestJson<void>({
    client: "app",
    method: "POST",
    url: "/api/mail/reset-password",
    data: {
      token,
      newPassword,
    },
    fallbackMessage: "Failed to reset password.",
  })
}
