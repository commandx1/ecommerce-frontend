import type { AxiosError } from "axios"

type ErrorWithStatus = {
  status?: number
  response?: {
    status?: number
  }
  authHandled?: boolean
}

export type AuthErrorStatus = 401 | 403
export type AuthHandledAxiosError = AxiosError & { authHandled?: boolean }

export function extractErrorStatus(error: unknown): number | undefined {
  if (!error || typeof error !== "object") {
    return undefined
  }

  const maybeError = error as ErrorWithStatus
  return maybeError.response?.status ?? maybeError.status
}

export function isAuthErrorStatus(status: number | undefined): status is AuthErrorStatus {
  return status === 401 || status === 403
}

export function isAuthHandledError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false
  }

  return Boolean((error as ErrorWithStatus).authHandled)
}
