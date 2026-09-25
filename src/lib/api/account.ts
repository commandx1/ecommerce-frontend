import { apiRequest } from "@/lib/api/request"

export type AccountUser = {
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

// Mirrors backend `UserUpdateRequest`, which has no `email` field: an extra key would be silently
// dropped, so keep this type in step with the DTO.
export type UpdateMePayload = {
  name: string
  surname: string
  phoneNumber?: string
  twoFactorEnabled?: boolean
}

export async function updateMe(accessToken: string, payload: UpdateMePayload): Promise<AccountUser> {
  return apiRequest.requestJson<AccountUser, UpdateMePayload>({
    client: "backend",
    method: "PUT",
    url: "/users/me",
    headers: { Authorization: `Bearer ${accessToken}` },
    data: payload,
    fallbackMessage: "Failed to update profile",
  })
}
