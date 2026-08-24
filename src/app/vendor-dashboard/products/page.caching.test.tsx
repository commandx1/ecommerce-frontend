import { QueryClient } from "@tanstack/react-query"
import userEvent from "@testing-library/user-event"
import { HttpResponse, http } from "msw"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { server } from "@/mocks/server"
import { makeVendorUserProduct } from "@/test/factories"
import { render, screen, waitFor } from "@/test/render"
import { serveFilter, serveStats, signInVendor } from "@/test/vendor-products-page-harness"
import ProductsPage from "./page"

const toastSpies = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
  info: vi.fn(),
  love: vi.fn(),
  loading: vi.fn(),
}))
vi.mock("@/components/ui/Toast", () => ({ showToast: toastSpies }))

const freshClient = () => new QueryClient({ defaultOptions: { queries: { retry: false } } })

beforeEach(() => {
  vi.restoreAllMocks()
  for (const spy of Object.values(toastSpies)) spy.mockClear()
  signInVendor()
  serveStats()
  serveFilter()
})

describe("Vendor ProductsPage — cached lookups", () => {
  // Brand options barely move and the filter needs them on every visit, so a
  // remount must not re-request them.
  it("reuses the cached brand list across mounts", async () => {
    let brandRequests = 0
    server.use(
      http.get("*/api/user-products/brands", () => {
        brandRequests += 1
        return HttpResponse.json(["Mark3"])
      }),
    )

    const queryClient = freshClient()

    const first = render(<ProductsPage />, { queryClient })
    await waitFor(() => expect(brandRequests).toBe(1))
    first.unmount()

    render(<ProductsPage />, { queryClient })
    await screen.findByText("Product Management")
    expect(brandRequests).toBe(1)
  })

  // The stat cards are cached, so a deletion has to knock them down explicitly or the
  // vendor keeps reading the old totals.
  it("refetches the statistics after a product is deleted", async () => {
    let statsRequests = 0
    server.use(
      http.get("*/api/user-products/stats", () => {
        statsRequests += 1
        return HttpResponse.json({
          totalProducts: 12,
          activeProducts: 8,
          inactiveProducts: 2,
          outOfStockProducts: 1,
          lowStockProducts: 3,
        })
      }),
      http.delete("*/api/user-products/:id", () => new HttpResponse(null, { status: 200 })),
    )
    serveFilter([makeVendorUserProduct({ id: "up-1", productName: "Composite Resin Kit" })])

    const user = userEvent.setup()
    render(<ProductsPage />, { queryClient: freshClient() })

    await screen.findByText("Composite Resin Kit")
    await waitFor(() => expect(statsRequests).toBe(1))

    await user.click(screen.getByRole("button", { name: /Delete/i }))
    await user.click(await screen.findByRole("button", { name: /^Delete$/ }))

    await waitFor(() => expect(statsRequests).toBe(2))
  })

  it("reuses the cached product statistics across mounts", async () =>
  {
    let statsRequests = 0
    server.use(
      http.get("*/api/user-products/stats", () => {
        statsRequests += 1
        return HttpResponse.json({
          totalProducts: 12,
          activeProducts: 8,
          inactiveProducts: 2,
          outOfStockProducts: 1,
          lowStockProducts: 3,
        })
      }),
    )

    const queryClient = freshClient()

    const first = render(<ProductsPage />, { queryClient })
    await waitFor(() => expect(statsRequests).toBe(1))
    first.unmount()

    render(<ProductsPage />, { queryClient })
    await screen.findByText("Product Management")
    expect(statsRequests).toBe(1)
  }
  )
})
