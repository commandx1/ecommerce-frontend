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

    // Try to extract tokens from headers
    const accessToken = response.headers.get("Authorization")?.replace("Bearer ", "")
    const refreshToken = response.headers.get("X-Refresh-Token")

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
}

export const authAPIDirect = new AuthAPIDirect()
