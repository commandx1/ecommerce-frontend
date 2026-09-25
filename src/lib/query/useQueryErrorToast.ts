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
 * Shared "toast once per distinct query failure" effect (Phase 4 design doc §2.2), extracted
 * from the identical pattern already inline in `useCartPage` and `useVendorQuestionsPage`.
 * Keyed on `errorUpdatedAt` rather than `isError` alone, so a persisting error toasts once, not
 * on every unrelated re-render while it stays true - and stays silent on an auth-handled error
 * (401 the interceptor already turned into a logout/redirect), which is not a failure the user
 * needs telling about a second time.
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
