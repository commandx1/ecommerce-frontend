import { vi } from "vitest"

export interface RouterMock {
  push: ReturnType<typeof vi.fn>
  replace: ReturnType<typeof vi.fn>
  back: ReturnType<typeof vi.fn>
  forward: ReturnType<typeof vi.fn>
  refresh: ReturnType<typeof vi.fn>
  prefetch: ReturnType<typeof vi.fn>
}

export const createRouterMock = (): RouterMock => ({
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  refresh: vi.fn(),
  prefetch: vi.fn(),
})

type SearchParamsInit = string | string[][] | Record<string, string> | URLSearchParams

let router: RouterMock = createRouterMock()
let pathname = "/"
let searchParams = new URLSearchParams()
let params: Record<string, string | string[]> = {}

/** Current router mock instance. Read it in a test to assert on `push`/`replace` calls. */
export const getRouterMock = (): RouterMock => router

/** Sets the value returned by `usePathname()` for the current test. */
export const setPathname = (next: string): void => {
  pathname = next
}

export const getPathname = (): string => pathname

/**
 * Sets the value returned by `useSearchParams()`. A real `URLSearchParams` is used so that
 * `.get()` / `.getAll()` / `.has()` behave exactly like in the browser.
 */
export const setSearchParams = (init?: SearchParamsInit): void => {
  searchParams = new URLSearchParams(init as never)
}

export const setRouteParams = (next: Record<string, string | string[]>): void => {
  params = next
}

/** `redirect()` in Next throws to unwind rendering — the mock keeps that contract. */
export const redirectMock = vi.fn((url: string) => {
  throw new Error(`NEXT_REDIRECT: ${url}`)
})

export const permanentRedirectMock = vi.fn((url: string) => {
  throw new Error(`NEXT_PERMANENT_REDIRECT: ${url}`)
})

export const notFoundMock = vi.fn(() => {
  throw new Error("NEXT_NOT_FOUND")
})

/** Restores the navigation mock to its default state. Called from the global `afterEach`. */
export const resetNavigationMock = (): void => {
  router = createRouterMock()
  pathname = "/"
  searchParams = new URLSearchParams()
  params = {}
  redirectMock.mockClear()
  permanentRedirectMock.mockClear()
  notFoundMock.mockClear()
}

/** Module shape handed to `vi.mock("next/navigation", ...)`. */
export const nextNavigationMock = () => ({
  useRouter: () => router,
  usePathname: () => pathname,
  useSearchParams: () => new URLSearchParams(searchParams),
  useParams: () => params,
  useSelectedLayoutSegment: () => null,
  useSelectedLayoutSegments: () => [],
  useServerInsertedHTML: () => undefined,
  redirect: redirectMock,
  permanentRedirect: permanentRedirectMock,
  notFound: notFoundMock,
  ReadonlyURLSearchParams: URLSearchParams,
  RedirectType: { push: "push", replace: "replace" },
})
