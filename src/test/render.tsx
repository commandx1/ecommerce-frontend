import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { type RenderOptions, type RenderResult, render } from "@testing-library/react"
import type { ReactElement, ReactNode } from "react"
import { SWRConfig } from "swr"
import ThemeProvider from "@/components/theme/ThemeProvider"
import { getRouterMock, type RouterMock, setPathname, setSearchParams } from "./mocks/next-navigation"

export const createTestQueryClient = (): QueryClient =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0, refetchOnWindowFocus: false },
      mutations: { retry: false },
    },
  })

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
 * React Query (no retries, no cache carry-over), SWR (fresh per-test cache, no deduping)
 * and the next-themes provider. Router state is bound to the global `next/navigation` mock.
 */
export function renderWithProviders(
  ui: ReactElement,
  options: RenderWithProvidersOptions = {},
): RenderWithProvidersResult {
  const { route, searchParams, queryClient = createTestQueryClient(), ...renderOptions } = options

  if (route !== undefined) {
    setPathname(route)
  }
  if (searchParams !== undefined) {
    setSearchParams(searchParams)
  }

  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0, revalidateOnFocus: false }}>
        <ThemeProvider>{children}</ThemeProvider>
      </SWRConfig>
    </QueryClientProvider>
  )

  const result = render(ui, { wrapper: Wrapper, ...renderOptions })

  return { ...result, queryClient, router: getRouterMock() }
}

export * from "@testing-library/react"
export { renderWithProviders as render }
