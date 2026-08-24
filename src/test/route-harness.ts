import { NextRequest } from "next/server"

/**
 * Helpers for the `node` project's Route Handler suites.
 *
 * Route handlers are called directly (not through a dev server), so every test builds a real
 * `NextRequest` and asserts on the real `Response` the handler returns. The upstream call is
 * intercepted by the global MSW server — see `src/mocks/server.ts`; never call `setupServer`
 * again in a test file.
 */

/**
 * `serverRequest`/`proxyRequest` fall back to this when `BACKEND_URL` is unset (see Y2: the
 * default used to be :8080, dt-admin-api's port; ecommerce-api - the service these route
 * handlers actually talk to - runs on :8081).
 */
export const BACKEND = "http://localhost:8081"

/** The Next.js origin the browser calls: route handlers live under `/api/*` here. */
export const ORIGIN = "http://localhost:3000"

export const AUTH = "Bearer test-token"

type RequestInitLike = {
  method?: string
  authorization?: string
  headers?: Record<string, string>
  body?: BodyInit | null
  cookie?: string
}

/** Builds a real `NextRequest` for `path` (may include a query string). */
export function routeRequest(path: string, init: RequestInitLike = {}): NextRequest {
  const headers = new Headers(init.headers)
  if (init.authorization) headers.set("Authorization", init.authorization)
  if (init.cookie) headers.set("cookie", init.cookie)

  return new NextRequest(`${ORIGIN}${path}`, {
    method: init.method ?? "GET",
    headers,
    body: init.body ?? null,
  })
}

/** JSON body request shorthand. */
export function jsonRequest(path: string, body: unknown, init: RequestInitLike = {}): NextRequest {
  return routeRequest(path, {
    method: "POST",
    ...init,
    headers: { "Content-Type": "application/json", ...init.headers },
    body: JSON.stringify(body),
  })
}

/** The second argument Next passes to a dynamic route handler. */
export function routeParams<T extends Record<string, string>>(params: T): { params: Promise<T> } {
  return { params: Promise.resolve(params) }
}

/** Captures what the handler forwarded upstream. */
export type Captured = {
  count: number
  url: string | null
  authorization: string | null
  method: string | null
  headers: Headers | null
}

export function createCapture(): Captured {
  return { count: 0, url: null, authorization: null, method: null, headers: null }
}

export function record(captured: Captured, request: Request): void {
  captured.count += 1
  captured.url = request.url
  captured.authorization = request.headers.get("Authorization")
  captured.method = request.method
  captured.headers = request.headers
}
