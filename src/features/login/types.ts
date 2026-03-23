export interface LoginFormData {
  email: string
  password: string
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
  roleName?: string
  accessToken?: string
  refreshToken?: string
  message?: string
  twoFactorRequired?: boolean
  requires2FA?: boolean
}
