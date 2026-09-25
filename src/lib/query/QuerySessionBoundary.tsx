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
 * Clears the query cache whenever the signed-in user changes identity (logout or account switch),
 * so account A's data never leaks into account B's session. `null -> A` (login/hydration) does not
 * clear: there is nothing to leak, and it would tear down observers that just mounted. Every
 * logout path (manual, 401 interceptor, cross-tab broadcast, impersonation/register flows) ends in
 * an `authStore.user` change, so this one subscription covers them all.
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
