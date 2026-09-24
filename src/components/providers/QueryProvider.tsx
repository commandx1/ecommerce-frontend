"use client"

import { QueryClientProvider } from "@tanstack/react-query"
import QuerySessionBoundary from "@/lib/query/QuerySessionBoundary"
import { getQueryClient } from "@/lib/query/query-client"

/**
 * Holds the app's React Query cache. `getQueryClient()` returns a fresh client per call on
 * the server (so one request can never share a cache with another) and a browser-wide
 * singleton on the client (so imperative code - store facades, interceptors, command
 * functions - reaches the same cache as component hooks). `QuerySessionBoundary` clears that
 * cache whenever the signed-in identity changes, so one account's data cannot leak into the
 * next account's session on the same tab.
 */
export default function QueryProvider({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient()

  return (
    <QueryClientProvider client={queryClient}>
      <QuerySessionBoundary queryClient={queryClient}>{children}</QuerySessionBoundary>
    </QueryClientProvider>
  )
}
