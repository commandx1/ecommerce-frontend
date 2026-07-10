import type { AxiosError } from "axios"

type ErrorWithStatus = {
  status?: number
  response?: {
    status?: number
  }
  authHandled?: boolean
}

export type AuthErrorStatus = 401
export type AuthHandledAxiosError = AxiosError & { authHandled?: boolean }

export function extractErrorStatus(error: unknown): number | undefined {
  if (!error || typeof error !== "object") {
    return undefined
  }

  const maybeError = error as ErrorWithStatus
  return maybeError.response?.status ?? maybeError.status
}

// 403 is a business-rule/authorization rejection (e.g. missing role, unapproved
// account) on an otherwise-authenticated session, not an expired-session signal —
// it should be shown to the user inline, not treated as a reason to log them out.
export function isAuthErrorStatus(status: number | undefined): status is AuthErrorStatus {
  return status === 401
}

export function isAuthHandledError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false
  }

  return Boolean((error as ErrorWithStatus).authHandled)
}
