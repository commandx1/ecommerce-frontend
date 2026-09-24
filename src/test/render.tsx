import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { type RenderOptions, type RenderResult, render } from "@testing-library/react"
import type { ReactElement, ReactNode } from "react"
import ThemeProvider from "@/components/theme/ThemeProvider"
import { __setBrowserQueryClient } from "@/lib/query/query-client"
import { getRouterMock, type RouterMock, setPathname, setSearchParams } from "./mocks/next-navigation"

export const createTestQueryClient = (): QueryClient =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0, refetchOnWindowFocus: false },
      mutations: { retry: false },
    },
  })

export interface QueryWrapperResult {
  wrapper: ({ children }: { children: ReactNode }) => ReactElement
  client: QueryClient
}

/**
 * For `renderHook` call sites (which don't go through `renderWithProviders`). Installs the
 * client as the browser singleton too, so imperative code under test (store facades, command
 * functions calling `getQueryClient()`) reaches the same cache as the hook being rendered.
 */
export function createQueryWrapper(client: QueryClient = createTestQueryClient()): QueryWrapperResult {
  __setBrowserQueryClient(client)

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )

  return { wrapper, client }
}

export interface RenderWithProvidersOptions extends Omit<RenderOptions, "wrapper"> {
  /** Value returned by `usePathname()` while this tree is mounted. */
  route?: string
  /** Value returned by `useSearchParams()` while this tree is mounted. */
  searchParams?: string | string[][] | Record<string, string> | URLSearchParams
  queryClient?: QueryClient
}

export interface RenderWithProvidersResult extends RenderResult {
  queryClient: QueryClient
  router: RouterMock
}

/**
 * Renders a component inside the providers the app relies on at runtime:
 * React Query (no retries, no cache carry-over) and the next-themes provider.
 * Router state is bound to the global `next/navigation` mock.
 */
export function renderWithProviders(
  ui: ReactElement,
  options: RenderWithProvidersOptions = {},
): RenderWithProvidersResult {
  const { route, searchParams, queryClient = createTestQueryClient(), ...renderOptions } = options

  // Installs this client as the browser singleton too, so imperative code under test
  // (store facades, command functions calling `getQueryClient()`) reaches the same cache
  // as the component tree being rendered.
  __setBrowserQueryClient(queryClient)

  if (route !== undefined) {
    setPathname(route)
  }
  if (searchParams !== undefined) {
    setSearchParams(searchParams)
  }

  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>{children}</ThemeProvider>
    </QueryClientProvider>
  )

  const result = render(ui, { wrapper: Wrapper, ...renderOptions })

  return { ...result, queryClient, router: getRouterMock() }
}

export * from "@testing-library/react"
export { renderWithProviders as render }
