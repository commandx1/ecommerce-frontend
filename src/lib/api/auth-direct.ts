// Direct API calls to backend through Next.js rewrites (proxy)
// This bypasses CORS issues and Mixed Content (HTTPS -> HTTP) by routing through same-origin
import { appApiClient } from "./client"
import { apiRequest } from "./request"

const BASE_URL = "/backend-api"

export interface AddressPayload {
  title: string
  fullName: string
  phoneNumber: string
  country: string
  state: string
  city: string
  district: string
  postalCode: string
  addressLine: string
  defaultAddress: boolean
  latitude: number
  longitude: number
  placeId: string
  formattedAddress: string
}

export interface CompanyPayload {
  name: string
  companyPhoto: string
  taxNumber: string
  email: string
  phoneNumber: string
  website: string
  description: string
  active: boolean
}

export interface RegisterPayload {
  name: string
  surname: string
  email: string
  password: string
  phoneNumber: string
  address: AddressPayload
  company: CompanyPayload
}

export interface LoginPayload {
  email: string
  password: string
  device: string
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

export interface UserResponse {
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

export interface UpdateUserPayload {
  name: string
  surname: string
  phoneNumber: string
}

class AuthAPIDirect {
  private getAuthHeaders(token?: string): Record<string, string> {
    if (!token) {
      return {}
    }

    return { Authorization: `Bearer ${token}` }
  }

  private normalizeSoftResponse(data: unknown) {
    if (!data) {
      return { success: true }
    }

    if (typeof data === "string") {
      try {
        return JSON.parse(data) as Record<string, unknown>
      } catch {
        return { success: true }
      }
    }

    if (typeof data === "object") {
      return data
    }

    return { success: true }
  }

  async register(payload: RegisterPayload) {
    return apiRequest.requestJson({
      client: "backend",
      method: "POST",
      url: "/users/register",
      data: payload,
      fallbackMessage: "Failed to register user",
    })
  }

  async completeVendorSignup(payload: {
    token: string
    name: string
    surname: string
    phoneNumber: string
    password: string
    address: AddressPayload
    company: CompanyPayload
  }) {
    return apiRequest.requestJson({
      client: "backend",
      method: "POST",
      url: "/users/vendor-manager-add",
      data: payload,
      fallbackMessage: "Failed to complete signup",
    })
  }

  async login(payload: LoginPayload) {
    const response = await apiRequest.requestResponse<Record<string, unknown>, LoginPayload>({
      client: "backend",
      method: "POST",
      url: "/auth/login",
      data: payload,
      fallbackMessage: "Failed to sign in",
    })
    const data = response.data

    // Try to extract tokens from headers first, then fallback to response body
    const accessToken =
      response.headers.authorization?.replace("Bearer ", "") || data.accessToken || data.token || data.access_token
    const refreshToken = response.headers["x-refresh-token"] || data.refreshToken || data.refresh_token

    return { ...data, accessToken, refreshToken }
  }

  async verifyEmail(payload: { email: string; code: string }) {
    await apiRequest.requestJson<void, { email: string; code: string }>({
      client: "backend",
      method: "POST",
      url: "/mail/verify-email",
      data: payload,
      fallbackMessage: "Failed to verify email",
    })
  }

  async logout(payload: { refreshToken: string }, token: string) {
    await apiRequest.requestJson<void, { refreshToken: string }>({
      client: "backend",
      method: "POST",
      headers: this.getAuthHeaders(token),
      url: "/auth/logout",
      data: payload,
      validateStatus: () => true,
      fallbackMessage: "Failed to log out",
    })
  }

  async forgotPassword(payload: ForgotPasswordPayload) {
    const response = await appApiClient.request({
      method: "POST",
      url: `${BASE_URL}/mail/forgot-password`,
      data: payload,
      validateStatus: () => true,
    })

    // Don't throw on errors - the email might still be sent
    // Also handle empty responses gracefully
    return this.normalizeSoftResponse(response.data)
  }

  async resetPassword(payload: ResetPasswordPayload) {
    const response = await appApiClient.request({
      method: "POST",
      url: `${BASE_URL}/mail/reset-password`,
      data: payload,
      validateStatus: () => true,
    })

    // Don't throw on errors - handle empty responses gracefully
    return this.normalizeSoftResponse(response.data)
  }

  async verify2FA(payload: Verify2FAPayload) {
    const response = await apiRequest.requestResponse<Record<string, unknown>, Verify2FAPayload>({
      client: "backend",
      method: "POST",
      url: "/auth/login/verify-2fa",
      data: payload,
      fallbackMessage: "Failed to verify two-factor code",
    })
    const data = response.data

    // Try to extract tokens from headers
    const accessToken = response.headers.authorization?.replace("Bearer ", "")
    const refreshToken = response.headers["x-refresh-token"]

    return { ...data, accessToken, refreshToken }
  }

  async refreshToken(payload: { refreshToken: string }) {
    const response = await apiRequest.requestResponse<Record<string, unknown>, { refreshToken: string }>({
      client: "backend",
      method: "POST",
      url: "/auth/refresh-token",
      data: payload,
      fallbackMessage: "Failed to refresh token",
    })
    const data = response.data

    // Try to extract tokens from headers
    const accessToken = response.headers.authorization?.replace("Bearer ", "")
    const newRefreshToken = response.headers["x-refresh-token"]

    return { ...data, accessToken, refreshToken: newRefreshToken }
  }

  async getMe(token: string): Promise<UserResponse> {
    return apiRequest.requestJson<UserResponse>({
      client: "backend",
      method: "GET",
      headers: this.getAuthHeaders(token),
      url: "/users/me",
      fallbackMessage: "Failed to fetch user profile",
    })
  }

  async updateMe(payload: UpdateUserPayload, token: string): Promise<UserResponse> {
    return apiRequest.requestJson<UserResponse, UpdateUserPayload>({
      client: "backend",
      method: "PUT",
      headers: this.getAuthHeaders(token),
      url: "/users/me",
      data: payload,
      fallbackMessage: "Failed to update user profile",
    })
  }

  async deleteMe(token: string): Promise<void> {
    await apiRequest.requestJson<void>({
      client: "backend",
      method: "DELETE",
      headers: this.getAuthHeaders(token),
      url: "/users/me",
      fallbackMessage: "Failed to delete user profile",
    })
  }
}

export const authAPIDirect = new AuthAPIDirect()
