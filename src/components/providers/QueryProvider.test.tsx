import { useQueryClient } from "@tanstack/react-query"
import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { getQueryClient, shouldRetryQuery } from "@/lib/query/query-client"
import QueryProvider from "./QueryProvider"

/**
 * The vendor dashboard's request de-duplication (see `vendor-dashboard/products/page.caching.test.tsx`)
 * rests entirely on the defaults set here and on the client surviving re-renders. Both are easy to
 * lose in a refactor - `new QueryClient()` written inline instead of inside `useState` still renders
 * fine and still passes a smoke test, but silently throws the cache away on every parent re-render.
 */

let seen: ReturnType<typeof useQueryClient>[] = []

function Probe() {
  seen.push(useQueryClient())
  return <span>probe</span>
}

describe("QueryProvider", () => {
  it("provides a query client to its children", () => {
    seen = []
    render(
      <QueryProvider>
        <Probe />
      </QueryProvider>,
    )

    expect(screen.getByText("probe")).toBeInTheDocument()
    expect(seen[0]).toBeDefined()
  })

  it("keeps the same client across re-renders instead of throwing the cache away", () => {
    seen = []
    const { rerender } = render(
      <QueryProvider>
        <Probe />
      </QueryProvider>,
    )
    rerender(
      <QueryProvider>
        <Probe />
      </QueryProvider>,
    )

    expect(seen).toHaveLength(2)
    expect(seen[1]).toBe(seen[0])
  })

  it("applies the dashboard-oriented query defaults", () => {
    seen = []
    render(
      <QueryProvider>
        <Probe />
      </QueryProvider>,
    )

    const defaults = seen[0]!.getDefaultOptions().queries

    // Refetching on focus is noise for a mostly-form dashboard; the other two are what make
    // repeated mounts of the same vendor screen reuse one request instead of re-issuing it.
    expect(defaults?.refetchOnWindowFocus).toBe(false)
    expect(defaults?.staleTime).toBe(30_000)
    // Status-aware policy (no retry on 4xx / auth-handled), not a flat count - see query-client.test.ts.
    expect(defaults?.retry).toBe(shouldRetryQuery)
  })

  it("shares the browser singleton client so imperative cache code sees the same cache as hooks", () => {
    // Per-request isolation on the server is covered by query-client.test.ts (getQueryClient server path).
    seen = []
    render(
      <QueryProvider>
        <Probe />
      </QueryProvider>,
    )
    render(
      <QueryProvider>
        <Probe />
      </QueryProvider>,
    )

    expect(seen[1]).toBe(seen[0])
    expect(seen[0]).toBe(getQueryClient())
  })
})
