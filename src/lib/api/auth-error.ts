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
// (client.ts carves out one narrow exception: a 403 whose access token is already
// past its own `exp` — see `isExpiredSessionResponse` there.)
export function isAuthErrorStatus(status: number | undefined): status is AuthErrorStatus {
  return status === 401
}

export function isAuthHandledError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false
  }

  return Boolean((error as ErrorWithStatus).authHandled)
}

/**
 * Reads the `exp` claim off a JWT without verifying its signature — verification is the
 * backend's job. We only need to know whether the token this browser is holding is already
 * past its own lifetime, which is what lets `client.ts` tell an expired session apart from a
 * genuine authorization rejection when the backend answers 403 for both.
 *
 * Returns false whenever that cannot be established (no token, malformed token, no numeric
 * `exp`), so an unreadable token never causes a logout on its own.
 */
export function isJwtExpired(token: string | null | undefined, now: number = Date.now()): boolean {
  if (!token) {
    return false
  }

  const payload = token.split(".")[1]
  if (!payload) {
    return false
  }

  try {
    const claims = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/"))) as { exp?: unknown }
    if (typeof claims.exp !== "number") {
      return false
    }

    return claims.exp * 1000 <= now
  } catch {
    return false
  }
}
