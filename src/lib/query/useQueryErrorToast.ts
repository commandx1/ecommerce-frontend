"use client"

import { useEffect } from "react"
import { isAuthHandledError } from "@/lib/api/auth-error"

/** The slice of `UseQueryResult` this hook needs - accepts the real thing without importing
 * `@tanstack/react-query`'s generic result type at every call site. */
export interface ErrorToastableQuery {
  isError: boolean
  error: unknown
  errorUpdatedAt: number
}

/**
 * Toasts once per distinct query failure: keyed on `errorUpdatedAt` rather than `isError`, so a
 * persisting error does not re-toast on every re-render. Silent on auth-handled errors (the
 * interceptor already logged out/redirected).
 */
export function useQueryErrorToast(query: ErrorToastableQuery, onError: () => void): void {
  // biome-ignore lint/correctness/useExhaustiveDependencies: errorUpdatedAt is what makes this fire once per distinct failure, not once per re-render while isError stays true
  useEffect(() => {
    if (!query.isError) {
      return
    }
    if (isAuthHandledError(query.error)) {
      return
    }
    onError()
  }, [query.errorUpdatedAt])
}
