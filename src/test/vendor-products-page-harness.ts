import { HttpResponse, http } from "msw"
import type { UserProduct } from "@/lib/api/products"
import type { ProductStats } from "@/lib/api/vendor-products"
import { server } from "@/mocks/server"
import { useAuthStore } from "@/stores/authStore"
import { makeAccountUser, makeVendorUserProduct } from "@/test/factories"

/**
 * Helpers shared by the three `vendor-dashboard/products/page.*.test.tsx` suites.
 *
 * They only install `server.use(...)` overrides on the global MSW server — no `setupServer`,
 * no edits to `src/mocks/handlers/**`.
 */

export const VENDOR_TOKEN = "vendor-token"

export const signInVendor = (): void => {
  useAuthStore.setState({
    user: makeAccountUser({ roleName: "Vendor" }),
    accessToken: VENDOR_TOKEN,
    isAuthenticated: true,
  })
}

export const makeStats = (overrides: Partial<ProductStats> = {}): ProductStats => ({
  totalProducts: 12,
  activeProducts: 8,
  inactiveProducts: 2,
  outOfStockProducts: 1,
  lowStockProducts: 3,
  ...overrides,
})

/**
 * `GET /api/user-products/stats` has no dedicated global handler, so it would otherwise be
 * swallowed by the catch-all `user-products/:id` handler. Every suite installs this first.
 */
export const serveStats = (stats: Partial<ProductStats> = {}): void => {
  server.use(http.get("*/api/user-products/stats", () => HttpResponse.json(makeStats(stats))))
}

export interface FilterPageMeta {
  totalElements?: number
  totalPages?: number
  page?: number
  size?: number
}

/** Records the query string of every `GET /api/user-products/filter` the page fires. */
export interface FilterCalls {
  urls: URL[]
  last: () => URL
  paramsOf: (url: URL) => Record<string, string>
}

export const serveFilter = (products: UserProduct[] = [makeVendorUserProduct()], meta: FilterPageMeta = {}) => {
  const urls: URL[] = []

  server.use(
    http.get("*/api/user-products/filter", ({ request }) => {
      urls.push(new URL(request.url))
      return HttpResponse.json({
        content: products,
        totalElements: meta.totalElements ?? products.length,
        totalPages: meta.totalPages ?? 1,
        page: meta.page ?? 0,
        size: meta.size ?? 25,
      })
    }),
  )

  const calls: FilterCalls = {
    urls,
    last: () => urls[urls.length - 1] as URL,
    paramsOf: (url) => Object.fromEntries(url.searchParams.entries()),
  }
  return calls
}

/** Brands feeding the brand `<Select>`; `[]` leaves the control disabled. */
export const serveBrands = (brands: string[]): void => {
  server.use(http.get("*/api/user-products/brands", () => HttpResponse.json(brands)))
}
