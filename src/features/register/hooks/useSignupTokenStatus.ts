import { useEffect, useState } from "react"
import { authAPIDirect as authAPI } from "@/lib/api/auth-direct"

export type SignupTokenStatus = "idle" | "checking" | "valid" | "invalid"

const INVALID_TOKEN_MESSAGE =
  "This invitation link is no longer valid. Please ask the person who invited you for a new one."

export interface UseSignupTokenStatusResult {
  tokenStatus: SignupTokenStatus
  tokenErrorMessage: string | undefined
  /** Lets a later submit failure (e.g. "Invalid signup token") invalidate an already-"valid" token. */
  markInvalid: () => void
}

/**
 * One-shot token validation on mount. Imperative rather than a query: there is exactly one reader,
 * and a token is never re-read - only invalidated by a submit failure.
 */
export function useSignupTokenStatus(token: string | undefined): UseSignupTokenStatusResult {
  const [tokenStatus, setTokenStatus] = useState<SignupTokenStatus>("idle")
  const [tokenErrorMessage, setTokenErrorMessage] = useState<string | undefined>(undefined)

  useEffect(() => {
    if (!token) {
      return
    }

    let cancelled = false
    setTokenStatus("checking")

    authAPI
      .validateSignupToken(token)
      .then(() => {
        if (!cancelled) {
          setTokenStatus("valid")
        }
      })
      .catch(() => {
        if (cancelled) return
        setTokenErrorMessage(INVALID_TOKEN_MESSAGE)
        setTokenStatus("invalid")
      })

    return () => {
      cancelled = true
    }
  }, [token])

  const markInvalid = () => {
    setTokenErrorMessage(INVALID_TOKEN_MESSAGE)
    setTokenStatus("invalid")
  }

  return { tokenStatus, tokenErrorMessage, markInvalid }
}
