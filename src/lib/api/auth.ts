// Use Next.js API routes as proxy to avoid CORS issues
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
  private getAuthHeaders(token?: string) {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    }
    if (token) {
      headers["Authorization"] = `Bearer ${token}`
    }
    return headers
  }

  async register(payload: RegisterPayload): Promise<RegisterResponse> {
    const response = await fetch(`${API_BASE}/users/register`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const error = await response.json()
      throw error
    }

    const data = await response.json()
    return data
  }

  async login(payload: LoginPayload): Promise<LoginResponse> {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const error = await response.json()
      throw error
    }

    const data = await response.json()
    return data
  }

  async logout(payload: LogoutPayload, token: string): Promise<void> {
    const response = await fetch(`${API_BASE}/auth/logout`, {
      method: "POST",
      headers: this.getAuthHeaders(token),
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const error = await response.json()
      throw error
    }
  }

  async refreshToken(payload: RefreshTokenPayload): Promise<LoginResponse> {
    const response = await fetch(`${API_BASE}/auth/refresh-token`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const error = await response.json()
      throw error
    }

    const data = await response.json()
    return data
  }

  async getMe(token: string): Promise<LoginResponse> {
    const response = await fetch(`${API_BASE}/users/me`, {
      method: "GET",
      headers: this.getAuthHeaders(token),
    })

    if (!response.ok) {
      const error = await response.json()
      throw error
    }

    return response.json()
  }

  async updateMe(payload: UpdateUserPayload, token: string): Promise<LoginResponse> {
    const response = await fetch(`${API_BASE}/users/me`, {
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
    const response = await fetch(`${API_BASE}/users/me`, {
      method: "DELETE",
      headers: this.getAuthHeaders(token),
    })

    if (!response.ok) {
      const error = await response.json()
      throw error
    }
  }

  async verifyEmail(payload: VerifyEmailPayload): Promise<void> {
    const response = await fetch(`${API_BASE}/auth/verify-email`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const error = await response.json()
      throw error
    }
  }

  async forgotPassword(payload: ForgotPasswordPayload): Promise<void> {
    const response = await fetch(`${API_BASE}/mail/forgot-password`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const error = await response.json()
      throw error
    }
  }

  async resetPassword(payload: ResetPasswordPayload): Promise<void> {
    const response = await fetch(`${API_BASE}/mail/reset-password`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const error = await response.json()
      throw error
    }
  }

  async verify2FA(payload: Verify2FAPayload): Promise<LoginResponse> {
    const response = await fetch(`${API_BASE}/auth/login/verify-2fa`, {
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
}

export const authAPI = new AuthAPI()
