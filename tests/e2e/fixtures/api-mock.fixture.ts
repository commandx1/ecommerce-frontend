import type { Page, Route } from "@playwright/test"
import { test as base, expect } from "@playwright/test"

/**
 * Faz 8.1 - strict API mock fixture.
 *
 * Replaces the old `page.route("**\/backend-api/**", ...)` catch-all pattern
 * (see the pre-migration `tests/e2e/buyer-orders.smoke.spec.ts`) that returned
 * `{}` for any unmatched request - a false-positive generator: a test could
 * pass while silently exercising zero real network wiring for parts of the
 * page it didn't explicitly stub.
 *
 * New behaviour:
 *  - Routes are registered explicitly via `apiMock.on(method, path, response)`.
 *  - Any request that doesn't match a registered route is fulfilled with
 *    `599` and pushed onto `apiMock.unmatchedRequests` - it is NEVER silently
 *    allowed through with a fake 200.
 *  - At fixture teardown, `unmatchedRequests` is asserted to be empty unless
 *    the test explicitly opts out via `test.use({ apiMockStrict: false })`
 *    (the 599 behaviour itself always applies - `apiMockStrict: false` only
 *    skips the automatic teardown assertion, e.g. so a test can intentionally
 *    trigger + inspect an unmatched request).
 *
 * Path patterns: `/backend-api/orders/buyer`, `/api/products/:id`, etc.
 * `:name` segments are wildcards captured into `params`. Patterns are
 * segment-count-anchored (`^...$` after splitting on `/`), so a route like
 * `/api/products/:id` will NOT accidentally swallow `/api/products/public` -
 * BUT if you register two routes with the same method and the same segment
 * count where one is a literal and the other is a `:param` wildcard, register
 * the literal one FIRST (first match wins). See tests/e2e/mocks/*.mocks.ts
 * for real examples of this ordering.
 */

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE"

export interface MockResponseInit {
  /** @default 200 */
  status?: number
  /** JSON-serializable value, or a raw string body. Omit entirely for an empty body (mirrors `new HttpResponse(null, ...)` in the MSW handlers). */
  body?: unknown
  headers?: Record<string, string>
}

export interface MockRequestContext {
  params: Record<string, string>
  url: URL
}

export type MockResponseFactory = (ctx: MockRequestContext) => MockResponseInit | Promise<MockResponseInit>

/**
 * A static JSON body for `apiMock.on` - anything serialisable, deliberately
 * NOT `unknown` (a `Function | unknown` union collapses to `unknown` and
 * loses contextual typing for the factory's `({ params }) => ...` argument).
 */
export type MockStaticBody = string | number | boolean | null | object

/**
 * Third argument to `apiMock.on`:
 *  - a function -> called per-request, must return a `MockResponseInit`
 *    (this is how you read `params`, e.g. `({ params }) => ({ body: makeAddress({ id: params.id }) })`,
 *    or how you set a custom status / empty body).
 *  - anything else -> used verbatim as the JSON body of a 200 response.
 */
export type MockResponse = MockResponseFactory | MockStaticBody

export interface UnmatchedRequest {
  method: string
  url: string
}

export interface ApiMock {
  on(method: HttpMethod, path: string, response: MockResponse): void
  /**
   * Opt a specific unmatched request pattern out of the 599 catch-all for
   * this test (the request is passed through to the real network instead).
   * Use sparingly and only when the test explicitly wants that - this does
   * NOT relax the `apiMockStrict` teardown assertion for anything else.
   */
  allowUnmatched(predicate: (method: string, pathname: string) => boolean): void
  readonly unmatchedRequests: UnmatchedRequest[]
}

interface CompiledPath {
  regex: RegExp
  paramNames: string[]
}

function compilePath(path: string): CompiledPath {
  const paramNames: string[] = []
  const segments = path.split("/").map((segment) => {
    if (segment.startsWith(":")) {
      paramNames.push(segment.slice(1))
      return "([^/]+)"
    }
    return segment.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  })
  return { regex: new RegExp(`^${segments.join("/")}$`), paramNames }
}

interface RegisteredRoute {
  method: HttpMethod
  path: string
  compiled: CompiledPath
  handler: MockResponseFactory
}

function toFactory(response: MockResponse): MockResponseFactory {
  if (typeof response === "function") {
    return response as MockResponseFactory
  }
  return () => ({ status: 200, body: response })
}

async function createApiMock(page: Page): Promise<ApiMock> {
  const routes: RegisteredRoute[] = []
  const unmatchedRequests: UnmatchedRequest[] = []
  const allowPredicates: Array<(method: string, pathname: string) => boolean> = []

  const resolver = async (route: Route) => {
    const request = route.request()
    const method = request.method().toUpperCase() as HttpMethod
    const url = new URL(request.url())

    for (const entry of routes) {
      if (entry.method !== method) continue
      const match = entry.compiled.regex.exec(url.pathname)
      if (!match) continue

      const params: Record<string, string> = {}
      entry.compiled.paramNames.forEach((name, index) => {
        params[name] = decodeURIComponent(match[index + 1])
      })

      const resolved = await entry.handler({ params, url })
      const hasBody = resolved.body !== undefined

      await route.fulfill({
        status: resolved.status ?? 200,
        headers: resolved.headers,
        ...(hasBody
          ? {
              contentType: "application/json",
              body: typeof resolved.body === "string" ? resolved.body : JSON.stringify(resolved.body),
            }
          : {}),
      })
      return
    }

    if (allowPredicates.some((predicate) => predicate(method, url.pathname))) {
      await route.continue()
      return
    }

    // K15 fix follow-up: `src/lib/image-loader.ts` now sends local/proxied image `src`
    // values (e.g. `/api/images/uploads/...`) to the browser as-is instead of wrapping
    // them in `/_next/image?...` (a path this fixture never intercepted). That means every
    // <img> the app renders now issues a real, visible `/api/images/**` GET, which the 599
    // catch-all would otherwise flag as unmatched in every test that happens to render a
    // product photo - even tests that have nothing to do with images. Serve a tiny real PNG
    // for these instead of failing the request, without counting it as unmatched; a test
    // that specifically cares about image loading can still register its own `apiMock.on`
    // route, which is checked above and wins first.
    if (method === "GET" && url.pathname.startsWith("/api/images/")) {
      const onePixelPng = Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
        "base64",
      )
      await route.fulfill({ status: 200, contentType: "image/png", body: onePixelPng })
      return
    }

    unmatchedRequests.push({ method, url: request.url() })
    await route.fulfill({
      status: 599,
      contentType: "text/plain",
      body: `apiMock: no route registered for ${method} ${url.pathname}. Register it with apiMock.on("${method}", "${url.pathname}", ...).`,
    })
  }

  await page.route("**/backend-api/**", resolver)
  await page.route("**/api/**", resolver)

  return {
    on(method, path, response) {
      routes.push({ method, path, compiled: compilePath(path), handler: toFactory(response) })
    },
    allowUnmatched(predicate) {
      allowPredicates.push(predicate)
    },
    get unmatchedRequests() {
      return unmatchedRequests
    },
  }
}

interface ApiMockFixtures {
  apiMock: ApiMock
}

interface ApiMockOptions {
  /** @default true - see the doc-comment at the top of this file. */
  apiMockStrict: boolean
}

export const test = base.extend<ApiMockFixtures & ApiMockOptions>({
  apiMockStrict: [true, { option: true }],

  apiMock: async ({ page, apiMockStrict }, use) => {
    const mock = await createApiMock(page)

    await use(mock)

    if (apiMockStrict) {
      expect(
        mock.unmatchedRequests,
        `apiMock: ${mock.unmatchedRequests.length} unmatched request(s) hit the 599 catch-all. ` +
          "Register them with apiMock.on(...), or opt this test out with test.use({ apiMockStrict: false }).",
      ).toEqual([])
    }
  },
})

export { expect }
