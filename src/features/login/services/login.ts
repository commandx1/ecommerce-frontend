import type { LoginResponse } from "@/features/login/types"
import { authAPI, type LoginPayload } from "@/lib/api/auth"

export const login = async (payload: LoginPayload): Promise<LoginResponse> => {
  const response = await authAPI.login(payload)
  return response as LoginResponse
}
