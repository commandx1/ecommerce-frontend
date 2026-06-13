import { apiRequest } from "./request"

export async function requestPasswordReset(email: string): Promise<void> {
  await apiRequest.requestJson<void>({
    client: "app",
    method: "POST",
    url: "/api/mail/forgot-password",
    data: { email },
    fallbackMessage: "Failed to send reset request.",
  })
}
