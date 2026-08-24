import { HttpResponse, http } from "msw"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { server } from "@/mocks/server"
import { useAuthStore } from "@/stores/authStore"
import { makeVendorUserProduct } from "@/test/factories"
import { render, screen, waitFor, within } from "@/test/render"
import { serveBrands, serveFilter, serveStats, signInVendor } from "@/test/vendor-products-page-harness"
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

const rowFor = async (name: string) => {
  const cell = await screen.findByText(name)
  return within(cell.closest("tr") as HTMLElement)
}

beforeEach(() => {
  vi.restoreAllMocks()
  for (const spy of Object.values(toastSpies)) {
    spy.mockClear()
  }
  signInVendor()
  serveStats()
  serveBrands([])
})

describe("Vendor ProductsPage — listing", () => {
  it("asks an unauthenticated visitor to log in instead of fetching products", async () => {
    useAuthStore.getState().clearAuth()
    const requested = vi.fn()
    server.use(
      http.get("*/api/user-products/filter", () => {
        requested()
        return HttpResponse.json({ content: [], totalElements: 0, totalPages: 0, page: 0, size: 25 })
      }),
    )

    render(<ProductsPage />)

    expect(await screen.findByText("Please log in to view your products.")).toBeInTheDocument()
    expect(screen.queryByRole("table")).not.toBeInTheDocument()
    expect(requested).not.toHaveBeenCalled()
  })

  it("shows the loading placeholder before the first response and the rows after it", async () => {
    serveFilter([makeVendorUserProduct({ productName: "Prophy Paste" })])

    render(<ProductsPage />)

    expect(screen.getByText("Loading products...")).toBeInTheDocument()
    expect(await screen.findByText("Prophy Paste")).toBeInTheDocument()
    await waitFor(() => expect(screen.queryByText("Loading products...")).not.toBeInTheDocument())
  })

  it("renders price, discount, stock, quantity sold and revenue for each product", async () => {
    serveFilter([
      makeVendorUserProduct({
        productName: "Mixing Tips",
        price: 56,
        oldPrice: 56,
        discount: 0,
        stock: 40,
        shipmentFee: 5,
        heavyShippingSurcharge: 12.5,
        periodicSellCount: 1234,
        periodicGrossRevenue: 9506.112,
      }),
    ])

    render(<ProductsPage />)

    const row = await rowFor("Mixing Tips")
    expect(row.getByText("$56.00")).toBeInTheDocument()
    expect(row.getByText("0%")).toBeInTheDocument()
    expect(row.getByText("40")).toBeInTheDocument()
    expect(row.getByText("$5.00")).toBeInTheDocument()
    expect(row.getByText("$12.50")).toBeInTheDocument()
    expect(row.getByText("1,234")).toBeInTheDocument()
    // Revenue goes through Intl.NumberFormat, so the float noise is rounded away here.
    expect(row.getByText("$9,506.11")).toBeInTheDocument()
  })

  it("formats a 4-digit price with a thousands separator instead of a bare toFixed string", async () => {
    serveFilter([
      makeVendorUserProduct({
        productName: "Panoramic X-Ray Unit",
        price: 1234.5,
        oldPrice: 1234.5,
        discount: 0,
        shipmentFee: 2345.6,
        heavyShippingSurcharge: 0,
      }),
    ])

    render(<ProductsPage />)

    const row = await rowFor("Panoramic X-Ray Unit")
    expect(row.getByText("$1,234.50")).toBeInTheDocument()
    expect(row.getByText("$2,345.60")).toBeInTheDocument()
  })

  it("shows the pre-discount price struck through when a discount is active", async () => {
    serveFilter([makeVendorUserProduct({ productName: "Discounted Tips", price: 56, oldPrice: 70, discount: 20 })])

    render(<ProductsPage />)

    const row = await rowFor("Discounted Tips")
    expect(row.getByText("$70.00")).toHaveClass("line-through")
    expect(row.getByText("$56.00")).toBeInTheDocument()
    expect(row.getByText("20%")).toBeInTheDocument()
  })

  it("keeps the plain price when the discount percentage is zero even if oldPrice is higher", async () => {
    serveFilter([makeVendorUserProduct({ productName: "No Discount", price: 56, oldPrice: 70, discount: 0 })])

    render(<ProductsPage />)

    const row = await rowFor("No Discount")
    expect(row.queryByText("$70.00")).not.toBeInTheDocument()
    expect(row.getByText("$56.00")).toBeInTheDocument()
  })

  it("rounds the float noise the backend leaves in the discount percentage", async () => {
    serveFilter([makeVendorUserProduct({ productName: "Noisy Discount", discount: 32.219249999999995 })])

    render(<ProductsPage />)

    const row = await rowFor("Noisy Discount")
    expect(row.getByText("32.22%")).toBeInTheDocument()
  })

  it("marks the status of active and inactive products", async () => {
    serveFilter([
      makeVendorUserProduct({ id: "up-a", productName: "Live Product", active: true }),
      makeVendorUserProduct({ id: "up-b", productName: "Paused Product", active: false }),
    ])

    render(<ProductsPage />)

    expect((await rowFor("Live Product")).getByText("Active")).toBeInTheDocument()
    expect((await rowFor("Paused Product")).getByText("Inactive")).toBeInTheDocument()
  })

  it("shows the empty-state message when the vendor has no products", async () => {
    serveFilter([], { totalElements: 0, totalPages: 0 })

    render(<ProductsPage />)

    expect(await screen.findByText("No products found. Create your first product!")).toBeInTheDocument()
  })

  /**
   * SUSPICIOUS (page.tsx:1332-1338): the range start is `currentPage * pageSize + 1` with no
   * guard for an empty result, so an empty catalog reads "Showing 1-0 of 0 products".
   * Locking the current (wrong) output.
   */
  it("renders a backwards range for an empty catalog", async () => {
    serveFilter([], { totalElements: 0, totalPages: 0 })

    render(<ProductsPage />)

    await screen.findByText("No products found. Create your first product!")
    expect(screen.getByText("1-0")).toBeInTheDocument()
    expect(within(screen.getByText("1-0").closest("div") as HTMLElement).getByText("0")).toBeInTheDocument()
  })

  it("caps the shown range at the total element count on the last page", async () => {
    serveFilter([makeVendorUserProduct()], { totalElements: 3, totalPages: 1 })

    render(<ProductsPage />)

    expect(await screen.findByText("1-3")).toBeInTheDocument()
  })

  it("falls back to an empty table when the products request fails", async () => {
    server.use(http.get("*/api/user-products/filter", () => HttpResponse.json({ message: "boom" }, { status: 500 })))
    vi.spyOn(console, "error").mockImplementation(() => {})

    render(<ProductsPage />)

    expect(await screen.findByText("No products found. Create your first product!")).toBeInTheDocument()
    // A failed load is silent: no toast, no error banner over the table.
    expect(toastSpies.error).not.toHaveBeenCalled()
  })

  it("logs the vendor out and redirects to /login when the products request returns 403", async () => {
    server.use(http.get("*/api/user-products/filter", () => HttpResponse.json({ message: "nope" }, { status: 403 })))

    const { router } = render(<ProductsPage />)

    await waitFor(() => expect(router.push).toHaveBeenCalledWith("/login"))
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
  })

  it("renders the vendor's product statistics above the table", async () => {
    serveStats({
      totalProducts: 42,
      activeProducts: 30,
      lowStockProducts: 7,
      outOfStockProducts: 2,
      inactiveProducts: 3,
    })
    serveFilter()

    render(<ProductsPage />)

    const totalCard = await screen.findByRole("button", { name: /Total Products/ })
    expect(within(totalCard).getByText("42")).toBeInTheDocument()
    const lowStockCard = screen.getByRole("button", { name: /Low Stock/ })
    expect(within(lowStockCard).getByText("7")).toBeInTheDocument()
  })

  it("surfaces a stats failure without taking the product table down with it", async () => {
    server.use(
      http.get("*/api/user-products/stats", () => HttpResponse.json({ message: "stats down" }, { status: 500 })),
    )
    serveFilter([makeVendorUserProduct({ productName: "Still Listed" })])
    vi.spyOn(console, "warn").mockImplementation(() => {})

    render(<ProductsPage />)

    expect(await screen.findByText("Still Listed")).toBeInTheDocument()
    expect(screen.getByText(/stats down|Failed to load product statistics/)).toBeInTheDocument()
  })

  it("links the add-product button to the create page", async () => {
    serveFilter()

    render(<ProductsPage />)

    const link = await screen.findByRole("link", { name: /Add New Product/ })
    expect(link).toHaveAttribute("href", "/vendor-dashboard/products/create")
  })

  it("falls back to the placeholder image when a product photo fails to load", async () => {
    serveFilter([makeVendorUserProduct({ productName: "Broken Photo", coverPhotoPath: "/uploads/missing.png" })])

    render(<ProductsPage />)

    const row = await rowFor("Broken Photo")
    const image = row.getByRole("img", { name: "Broken Photo" })
    expect(image).not.toHaveAttribute("src", "/dentypro-product-placeholder.png")

    image.dispatchEvent(new Event("error", { bubbles: false }))

    await waitFor(() =>
      expect(row.getByRole("img", { name: "Broken Photo" })).toHaveAttribute(
        "src",
        "/dentypro-product-placeholder.png",
      ),
    )
  })

  it("uses the placeholder straight away for a product without a cover photo", async () => {
    serveFilter([makeVendorUserProduct({ productName: "No Photo", coverPhotoPath: "" })])

    render(<ProductsPage />)

    const row = await rowFor("No Photo")
    expect(row.getByRole("img", { name: "No Photo" })).toHaveAttribute("src", "/dentypro-product-placeholder.png")
  })

  it("scopes the initial request to the userProductId in the URL", async () => {
    const calls = serveFilter()

    render(<ProductsPage />, { searchParams: { userProductId: "up-42" } })

    await waitFor(() => expect(calls.urls.length).toBeGreaterThan(0))
    expect(calls.paramsOf(calls.last()).userProductId).toBe("up-42")
  })

  it("starts on the filter named in the URL when it is a known filter", async () => {
    const calls = serveFilter()

    render(<ProductsPage />, { searchParams: { filter: "OUT_OF_STOCK" } })

    await waitFor(() => expect(calls.urls.length).toBeGreaterThan(0))
    expect(calls.paramsOf(calls.last()).type).toBe("OUT_OF_STOCK")
  })

  it("ignores an unknown filter in the URL and falls back to TOTAL", async () => {
    const calls = serveFilter()

    render(<ProductsPage />, { searchParams: { filter: "NOT_A_FILTER" } })

    await waitFor(() => expect(calls.urls.length).toBeGreaterThan(0))
    expect(calls.paramsOf(calls.last()).type).toBe("TOTAL")
  })
})
