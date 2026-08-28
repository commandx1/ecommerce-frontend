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

// Mirrors backend `auth/dto/UserUpdateRequest.java`, which declares ONLY name, surname,
// phoneNumber and twoFactorEnabled - there is no `email` field on this endpoint.
// Sending one is not fatal (Spring Boot leaves Jackson's FAIL_ON_UNKNOWN_PROPERTIES off and
// this app never re-enables it, so an extra key is silently dropped), but it is a lie about
// the contract: the caller believes it updated the email when nothing happened. Keep this
// type in step with the backend DTO so that illusion cannot come back.
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
