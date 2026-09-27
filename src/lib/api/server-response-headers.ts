import type { NextResponse } from "next/server"

/**
 * Wraps an authenticated/personalised GET route handler so every response it returns carries
 * `Cache-Control: private, no-store` (never cached by a shared/CDN cache, or reused across users)
 * plus `Vary: Cookie, Authorization` (the two request parts the response actually depends on, for
 * any cache that ignores `Cache-Control` and stores it anyway).
 *
 * Route handlers under `src/app/api/**` are dynamic and uncached by default, but that default is
 * silent and easy to defeat by accident (a reverse proxy or CDN in front of the app has no such
 * default) - this makes the "never cache this" guarantee explicit and consistent across every
 * personalised GET handler instead of leaving each one to remember it individually.
 */
export function withPrivateNoStore<Args extends unknown[]>(
  handler: (...args: Args) => Promise<NextResponse> | NextResponse,
): (...args: Args) => Promise<NextResponse> {
  return async (...args: Args) => {
    const response = await handler(...args)
    response.headers.set("Cache-Control", "private, no-store")
    response.headers.set("Vary", "Cookie, Authorization")
    return response
  }
}
