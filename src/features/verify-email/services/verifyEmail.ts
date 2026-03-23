import { authAPIDirect as authAPI } from "@/lib/api/auth-direct"

interface VerifyEmailPayload {
  email: string
  code: string
}

export const verifyEmail = async ({ email, code }: VerifyEmailPayload) => {
  return authAPI.verifyEmail({ email, code })
}
