// Direct API calls to backend through Next.js rewrites (proxy)
// This bypasses CORS issues by routing through same-origin

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/backend-api"

export interface RegisterPayload {
  name: string
  surname: string
  email: string
  password: string
  phoneNumber: string
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
}

export interface UpdateUserPayload {
  name: string
  surname: string
  phoneNumber: string
}

class AuthAPIDirect {
  private getAuthHeaders(token?: string) {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    }
    if (token) {
      headers["Authorization"] = `Bearer ${token}`
    }
    return headers
  }

  async register(payload: RegisterPayload) {
    const response = await fetch(`${BASE_URL}/users/register`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const error = await response.json()
      throw error
    }

    return response.json()
  }

  async login(payload: LoginPayload) {
    const response = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const error = await response.json()
      throw error
    }

    const data = await response.json()

    // Try to extract tokens from headers first, then fallback to response body
    const accessToken =
      response.headers.get("Authorization")?.replace("Bearer ", "") ||
      data.accessToken ||
      data.token ||
      data.access_token
    const refreshToken = response.headers.get("X-Refresh-Token") || data.refreshToken || data.refresh_token

    return { ...data, accessToken, refreshToken }
  }

  async verifyEmail(payload: { email: string; code: string }) {
    const response = await fetch(`${BASE_URL}/mail/verify-email`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const error = await response.json()
      throw error
    }
  }

  async logout(payload: { refreshToken: string }, token: string) {
    const response = await fetch(`${BASE_URL}/auth/logout`, {
      method: "POST",
      headers: this.getAuthHeaders(token),
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const error = await response.json()
      throw error
    }
  }

  async forgotPassword(payload: ForgotPasswordPayload) {
    const response = await fetch(`${BASE_URL}/mail/forgot-password`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(payload),
    })

    // Don't throw on errors - the email might still be sent
    // Also handle empty responses gracefully
    try {
      const text = await response.text()
      if (text) {
        return JSON.parse(text)
      }
      return { success: true }
    } catch {
      return { success: true }
    }
  }

  async resetPassword(payload: ResetPasswordPayload) {
    const response = await fetch(`${BASE_URL}/mail/reset-password`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(payload),
    })

    // Don't throw on errors - handle empty responses gracefully
    try {
      const text = await response.text()
      if (text) {
        return JSON.parse(text)
      }
      return { success: true }
    } catch {
      return { success: true }
    }
  }

  async verify2FA(payload: Verify2FAPayload) {
    const response = await fetch(`${BASE_URL}/auth/login/verify-2fa`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const error = await response.json()
      throw error
    }

    const data = await response.json()

    // Try to extract tokens from headers
    const accessToken = response.headers.get("Authorization")?.replace("Bearer ", "")
    const refreshToken = response.headers.get("X-Refresh-Token")

    return { ...data, accessToken, refreshToken }
  }

  async refreshToken(payload: { refreshToken: string }) {
    const response = await fetch(`${BASE_URL}/auth/refresh-token`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const error = await response.json()
      throw error
    }

    const data = await response.json()

    // Try to extract tokens from headers
    const accessToken = response.headers.get("Authorization")?.replace("Bearer ", "")
    const newRefreshToken = response.headers.get("X-Refresh-Token")

    return { ...data, accessToken, refreshToken: newRefreshToken }
  }

  async getMe(token: string): Promise<UserResponse> {
    const response = await fetch(`${BASE_URL}/users/me`, {
      method: "GET",
      headers: this.getAuthHeaders(token),
    })

    if (!response.ok) {
      const error = await response.json()
      throw error
    }

    return response.json()
  }

  async updateMe(payload: UpdateUserPayload, token: string): Promise<UserResponse> {
    const response = await fetch(`${BASE_URL}/users/me`, {
      method: "PUT",
      headers: this.getAuthHeaders(token),
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const error = await response.json()
      throw error
    }

    return response.json()
  }

  async deleteMe(token: string): Promise<void> {
    const response = await fetch(`${BASE_URL}/users/me`, {
      method: "DELETE",
      headers: this.getAuthHeaders(token),
    })

    if (!response.ok) {
      const error = await response.json()
      throw error
    }
  }
}

export const authAPIDirect = new AuthAPIDirect()
