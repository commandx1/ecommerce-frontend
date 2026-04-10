// Use Next.js API routes as proxy to avoid CORS issues
import { apiRequest } from "./request"

const API_BASE = "/api"

export interface RegisterPayload {
  name: string
  surname: string
  email: string
  password: string
  phoneNumber: string
}

export interface RegisterResponse {
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
}

export interface LoginPayload {
  email: string
  password: string
  device: string
}

export interface LoginResponse {
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
}

export interface VerifyEmailPayload {
  email: string
  code: string
}

export interface RefreshTokenPayload {
  refreshToken: string
}

export interface LogoutPayload {
  refreshToken: string
}

export interface UpdateUserPayload {
  name: string
  surname: string
  phoneNumber: string
}

export interface ForgotPasswordPayload {
  email: string
}

export interface ResetPasswordPayload {
  token: string
  newPassword: string
}

export interface Verify2FAPayload {
  email: string
  code: string
  device: string
}

export interface ErrorResponse {
  timestamp: string
  message: string
  status: number
}

class AuthAPI {
  private getAuthHeaders(token?: string): Record<string, string> {
    if (!token) {
      return {}
    }

    return { Authorization: `Bearer ${token}` }
  }

  async register(payload: RegisterPayload): Promise<RegisterResponse> {
    return apiRequest.requestJson<RegisterResponse, RegisterPayload>({
      client: "app",
      method: "POST",
      url: `${API_BASE}/users/register`,
      data: payload,
      fallbackMessage: "Failed to register user",
    })
  }

  async login(payload: LoginPayload): Promise<LoginResponse> {
    return apiRequest.requestJson<LoginResponse, LoginPayload>({
      client: "app",
      method: "POST",
      url: `${API_BASE}/auth/login`,
      data: payload,
      fallbackMessage: "Failed to sign in",
    })
  }

  async logout(payload: LogoutPayload, token: string): Promise<void> {
    await apiRequest.requestJson<void, LogoutPayload>({
      client: "app",
      method: "POST",
      headers: this.getAuthHeaders(token),
      url: `${API_BASE}/auth/logout`,
      data: payload,
      fallbackMessage: "Failed to log out",
    })
  }

  async refreshToken(payload: RefreshTokenPayload): Promise<LoginResponse> {
    return apiRequest.requestJson<LoginResponse, RefreshTokenPayload>({
      client: "app",
      method: "POST",
      url: `${API_BASE}/auth/refresh-token`,
      data: payload,
      fallbackMessage: "Failed to refresh token",
    })
  }

  async getMe(token: string): Promise<LoginResponse> {
    return apiRequest.requestJson<LoginResponse>({
      client: "app",
      method: "GET",
      headers: this.getAuthHeaders(token),
      url: `${API_BASE}/users/me`,
      fallbackMessage: "Failed to fetch user profile",
    })
  }

  async updateMe(payload: UpdateUserPayload, token: string): Promise<LoginResponse> {
    return apiRequest.requestJson<LoginResponse, UpdateUserPayload>({
      client: "app",
      method: "PUT",
      headers: this.getAuthHeaders(token),
      url: `${API_BASE}/users/me`,
      data: payload,
      fallbackMessage: "Failed to update user profile",
    })
  }

  async deleteMe(token: string): Promise<void> {
    await apiRequest.requestJson<void>({
      client: "app",
      method: "DELETE",
      headers: this.getAuthHeaders(token),
      url: `${API_BASE}/users/me`,
      fallbackMessage: "Failed to delete user profile",
    })
  }

  async verifyEmail(payload: VerifyEmailPayload): Promise<void> {
    await apiRequest.requestJson<void, VerifyEmailPayload>({
      client: "app",
      method: "POST",
      url: `${API_BASE}/auth/verify-email`,
      data: payload,
      fallbackMessage: "Failed to verify email",
    })
  }

  async forgotPassword(payload: ForgotPasswordPayload): Promise<void> {
    await apiRequest.requestJson<void, ForgotPasswordPayload>({
      client: "app",
      method: "POST",
      url: `${API_BASE}/mail/forgot-password`,
      data: payload,
      fallbackMessage: "Failed to request password reset",
    })
  }

  async resetPassword(payload: ResetPasswordPayload): Promise<void> {
    await apiRequest.requestJson<void, ResetPasswordPayload>({
      client: "app",
      method: "POST",
      url: `${API_BASE}/mail/reset-password`,
      data: payload,
      fallbackMessage: "Failed to reset password",
    })
  }

  async verify2FA(payload: Verify2FAPayload): Promise<LoginResponse> {
    return apiRequest.requestJson<LoginResponse, Verify2FAPayload>({
      client: "app",
      method: "POST",
      url: `${API_BASE}/auth/login/verify-2fa`,
      data: payload,
      fallbackMessage: "Failed to verify two-factor code",
    })
  }
}

export const authAPI = new AuthAPI()
