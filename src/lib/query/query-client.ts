import { isServer, QueryClient } from "@tanstack/react-query"
import { extractErrorStatus, isAuthHandledError } from "@/lib/api/auth-error"

/**
 * One retry for 5xx / network errors, none for anything the interceptor already handled
 * (401 `authHandled`) or any other 4xx (the server has already answered - retrying it is
 * pointless and, for a write-shaped 409/422, actively misleading).
 */
export function shouldRetryQuery(failureCount: number, error: unknown): boolean {
  if (isAuthHandledError(error)) {
    return false
  }

  const status = extractErrorStatus(error)
  if (status !== undefined && status >= 400 && status < 500) {
    return false
  }

  return failureCount < 1
}

export function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        retry: shouldRetryQuery,
        refetchOnWindowFocus: false,
        // axios semantics: fail immediately when offline instead of the v5 default of
        // pausing and silently replaying later - a cart/order write must never fire without
        // the user's click that caused it.
        networkMode: "always",
      },
      mutations: {
        // A retried POST/PUT/DELETE is a duplicate write, not a safe retry.
        retry: false,
        networkMode: "always",
      },
    },
  })
}

let browserClient: QueryClient | undefined

type BrowserQueryClientListener = (client: QueryClient | undefined) => void
const browserClientListeners = new Set<BrowserQueryClientListener>()

function setBrowserClient(client: QueryClient | undefined): void {
  if (client === browserClient) {
    return
  }

  browserClient = client
  for (const listener of browserClientListeners) {
    listener(client)
  }
}

/**
 * Server: a fresh client per call (per request), so one request can never see another's cache.
 * Browser: one singleton, so imperative code (store facades, interceptors, command functions)
 * reaches the same cache as component hooks.
 */
export function getQueryClient(): QueryClient {
  if (isServer) {
    return makeQueryClient()
  }

  if (!browserClient) {
    setBrowserClient(makeQueryClient())
  }

  return browserClient as QueryClient
}

/**
 * Browser-only: calls `listener` right away with the current browser singleton (`undefined` if
 * none has been created yet), then again whenever it is created or replaced
 * (`__setBrowserQueryClient` in tests). Lets a long-lived projection - the legacy `cartStore`
 * facade - follow whichever client is current instead of holding on to a stale one.
 */
export function subscribeBrowserQueryClient(listener: BrowserQueryClientListener): () => void {
  browserClientListeners.add(listener)
  listener(browserClient)
  return () => {
    browserClientListeners.delete(listener)
  }
}

/** Test-only: lets `renderWithProviders` install its own client as the browser singleton. */
export function __setBrowserQueryClient(client: QueryClient | undefined): void {
  setBrowserClient(client)
}
