"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useState } from "react"

/**
 * Holds the app's React Query cache. The client is created inside state so that a
 * re-render never swaps it out, and so each SSR request gets its own instance
 * instead of sharing one across users.
 */
export default function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Data the user just navigated away from is usually still good; refetching
            // on every window focus is noise for a dashboard that is mostly forms.
            refetchOnWindowFocus: false,
            staleTime: 30_000,
            retry: 1,
          },
        },
      }),
  )

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}
