"use client"

import { readApiErrorMessage } from "@/lib/api/api-error"

export type UpdateMePayload = {
  name: string
  surname: string
  phoneNumber?: string
  twoFactorEnabled?: boolean
}

export async function updateMe(accessToken: string, payload: UpdateMePayload) {
  const response = await fetch("/backend-api/users/me", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw new Error(await readApiErrorMessage(response, "Failed to update profile"))
  }

  return response.json()
}

export async function deleteMe(accessToken: string) {
  const response = await fetch("/backend-api/users/me", {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    throw new Error(await readApiErrorMessage(response, "Failed to delete account"))
  }
}
