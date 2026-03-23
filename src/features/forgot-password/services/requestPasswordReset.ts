import { requestPasswordReset } from "@/lib/api/password-recovery"

export const sendPasswordReset = async (email: string) => {
  return requestPasswordReset(email)
}
