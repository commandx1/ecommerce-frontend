"use client"

import type { QueryClient } from "@tanstack/react-query"
import { useEffect } from "react"
import { queryKeys } from "@/lib/query/keys"
import { useAuthStore } from "@/stores/authStore"

interface QuerySessionBoundaryProps {
  queryClient: QueryClient
  children: React.ReactNode
}

/**
 * Clears the query cache whenever the signed-in user changes identity (logout or account
 * switch), so account A's cart/notifications data never leaks into account B's session -
 * nothing did this before Phase 2 (see design doc §0/§1.3).
 *
 * `null -> A` (login/hydration) does NOT clear: there is nothing to leak, and clearing here
 * would tear down observers that just mounted. This one subscription covers every logout
 * funnel at once: manual logout, the `client.ts` 401 interceptor, the cross-tab logout
 * broadcast, and impersonate/setup-vendor/register flows, because they all eventually change
 * `authStore.user`. Flipping `isAdminImpersonating` without a user change is not a trigger -
 * it is the same backend user.
 */
export default function QuerySessionBoundary({ queryClient, children }: QuerySessionBoundaryProps) {
  useEffect(
    () =>
      useAuthStore.subscribe((state, prevState) => {
        const next = state.user?.id ?? null
        const before = prevState.user?.id ?? null
        if (before !== null && next !== before) {
          void queryClient.cancelQueries()
          // A mounted observer stays bound to its Query instance until its next render, so
          // `clear()` alone would leave a cart reader that does not re-render on the identity
          // change (e.g. the checkout order summary) showing the previous account's lines. Empty
          // the cart entry in place first; its readers are disabled observers, so nothing refetches.
          void queryClient.resetQueries({ queryKey: queryKeys.cart.detail(), exact: true })
          queryClient.clear()
        }
      }),
    [queryClient],
  )

  return <>{children}</>
}
