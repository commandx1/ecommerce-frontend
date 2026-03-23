import { resetPassword } from "@/lib/api/reset-password"

export const submitPasswordReset = async (token: string, password: string) => {
  return resetPassword(token, password)
}
