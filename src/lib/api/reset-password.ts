"use client"

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  const response = await fetch("/api/mail/reset-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      token,
      newPassword,
    }),
  })

  if (!response.ok) {
    let message = "Failed to reset password."
    try {
      const errorData = await response.json()
      if (errorData && typeof errorData === "object" && "error" in errorData && typeof (errorData as any).error === "string") {
        message = (errorData as any).error
      } else if (errorData && typeof errorData === "object" && "message" in errorData && typeof (errorData as any).message === "string") {
        message = (errorData as any).message
      }
    } catch {
      // ignore
    }
    throw new Error(message)
  }
}

