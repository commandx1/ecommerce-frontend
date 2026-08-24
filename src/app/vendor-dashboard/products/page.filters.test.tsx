import userEvent from "@testing-library/user-event"
import { HttpResponse, http } from "msw"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { server } from "@/mocks/server"
import { makeProduct, makeUserProductDetailResponse, makeVendorUserProduct } from "@/test/factories"
import { installRadixPointerPolyfills } from "@/test/radix"
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

installRadixPointerPolyfills()

const setupUser = () => userEvent.setup({ pointerEventsCheck: 0 })

/**
 * `role="combobox"` takes its accessible name from the author only, so a Radix `SelectTrigger`
 * is nameless no matter what it displays. Pick it by the value it currently shows instead.
 */
const selectShowing = (text: string): HTMLElement => {
  const trigger = screen.getAllByRole("combobox").find((element) => element.textContent?.trim() === text)
  if (!trigger) {
    throw new Error(`No select trigger showing "${text}"`)
  }
  return trigger
}

const serveReviewQueue = (
  items: Array<{ name: string; approved: boolean | null; rejectedReason?: string | null; id?: string }>,
) => {
  server.use(
    http.get("*/api/products/my-products", () =>
      HttpResponse.json({
        content: items.map((item, index) => ({
          product: makeProduct({ id: `p-${index}`, name: item.name }),
          reviewStatus: {
            id: `rev-${index}`,
            approved: item.approved,
            rejectedReason: item.rejectedReason ?? null,
            lastReviewedByAdminId: null,
            updatedDate: "2026-01-10T09:00:00Z",
          },
          userProduct: makeUserProductDetailResponse({
            id: item.id ?? `up-${index}`,
            productId: `p-${index}`,
            productName: item.name,
          }),
        })),
        totalElements: items.length,
        totalPages: 1,
      }),
    ),
  )
}

const switchToReviewQueue = async (user: ReturnType<typeof setupUser>) => {
  const tab = await screen.findByRole("tab", { name: "Review Queue" })
  await waitFor(() => expect(tab).toBeEnabled())
  await user.click(tab)
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

describe("Vendor ProductsPage — filters, sorting and paging", () => {
  it("sends the typed search term to the API after the debounce settles", async () => {
    const user = setupUser()
    const calls = serveFilter()

    render(<ProductsPage />)
    await screen.findByRole("table")
    const initialCallCount = calls.urls.length

    await user.type(screen.getByPlaceholderText("Search products by name"), "gauze")

    await waitFor(() => expect(calls.urls.length).toBeGreaterThan(initialCallCount), { timeout: 3000 })
    expect(calls.paramsOf(calls.last()).search).toBe("gauze")
    // Debounced: five keystrokes must not produce five requests.
    expect(calls.urls.length - initialCallCount).toBe(1)
  })

  it("re-queries from the first page when a stats card changes the filter", async () => {
    const user = setupUser()
    const calls = serveFilter([makeVendorUserProduct()], { totalElements: 60, totalPages: 3 })

    render(<ProductsPage />)
    await screen.findByRole("table")

    await user.click(await screen.findByRole("button", { name: /Out of Stock/ }))

    await waitFor(() => expect(calls.paramsOf(calls.last()).type).toBe("OUT_OF_STOCK"))
    expect(calls.paramsOf(calls.last()).page).toBe("0")
  })

  it("asks for the requested period when a period tab is picked", async () => {
    const user = setupUser()
    const calls = serveFilter()

    render(<ProductsPage />)
    await screen.findByRole("table")
    expect(calls.paramsOf(calls.last()).howManySoldDay).toBe("90")

    const tab = screen.getByRole("tab", { name: "12 months" })
    await waitFor(() => expect(tab).toBeEnabled())
    await user.click(tab)

    await waitFor(() => expect(calls.paramsOf(calls.last()).howManySoldDay).toBe("365"))
  })

  it("leaves the brand filter disabled while the vendor has no brands", async () => {
    serveFilter()

    render(<ProductsPage />)
    await screen.findByRole("table")

    expect(selectShowing("All Brands")).toBeDisabled()
  })

  it("filters by the brand chosen from the dropdown and drops the parameter again for All Brands", async () => {
    const user = setupUser()
    serveBrands(["MARK3", "Kerr"])
    const calls = serveFilter()

    render(<ProductsPage />)
    await screen.findByRole("table")

    await waitFor(() => expect(selectShowing("All Brands")).toBeEnabled())
    await user.click(selectShowing("All Brands"))
    await user.click(await screen.findByRole("option", { name: "Kerr" }))

    await waitFor(() => expect(calls.paramsOf(calls.last()).brand).toBe("Kerr"))

    await user.click(selectShowing("Kerr"))
    await user.click(await screen.findByRole("option", { name: "All Brands" }))

    await waitFor(() => expect(calls.paramsOf(calls.last()).brand).toBeUndefined())
  })

  it("defaults to ascending stock order and flips direction when the same header is clicked twice", async () => {
    const user = setupUser()
    const calls = serveFilter()

    render(<ProductsPage />)
    await screen.findByRole("table")
    // No explicit sort yet: the page still sends its STOCK/asc default.
    expect(calls.paramsOf(calls.last())).toMatchObject({ sortBy: "STOCK", sortDir: "asc" })

    await user.click(screen.getByRole("button", { name: "Price" }))
    await waitFor(() => expect(calls.paramsOf(calls.last())).toMatchObject({ sortBy: "PRICE", sortDir: "asc" }))

    await user.click(screen.getByRole("button", { name: "Price" }))
    await waitFor(() => expect(calls.paramsOf(calls.last())).toMatchObject({ sortBy: "PRICE", sortDir: "desc" }))
  })

  it("resets the direction to ascending when the sort moves to another column", async () => {
    const user = setupUser()
    const calls = serveFilter()

    render(<ProductsPage />)
    await screen.findByRole("table")

    await user.click(screen.getByRole("button", { name: "Sales" }))
    await user.click(screen.getByRole("button", { name: "Sales" }))
    await waitFor(() =>
      expect(calls.paramsOf(calls.last())).toMatchObject({ sortBy: "PERIODIC_GROSS_REVENUE", sortDir: "desc" }),
    )

    await user.click(screen.getByRole("button", { name: "Qty Sold" }))
    await waitFor(() =>
      expect(calls.paramsOf(calls.last())).toMatchObject({ sortBy: "PERIODIC_SELL_COUNT", sortDir: "asc" }),
    )
  })

  it("requests the page the vendor clicks and disables the paging arrows at both ends", async () => {
    const user = setupUser()
    const calls = serveFilter([makeVendorUserProduct()], { totalElements: 60, totalPages: 3 })

    render(<ProductsPage />)
    await screen.findByRole("table")

    const previous = screen.getAllByRole("button").find((button) => button.querySelector(".lucide-chevron-left"))
    expect(previous).toBeDisabled()

    await user.click(screen.getByRole("button", { name: "3" }))
    await waitFor(() => expect(calls.paramsOf(calls.last()).page).toBe("2"))

    const next = screen.getAllByRole("button").find((button) => button.querySelector(".lucide-chevron-right"))
    expect(next).toBeDisabled()
    expect(await screen.findByText("51-60")).toBeInTheDocument()
  })

  it("re-queries with the chosen page size and returns to the first page", async () => {
    const user = setupUser()
    const calls = serveFilter([makeVendorUserProduct()], { totalElements: 60, totalPages: 3 })

    render(<ProductsPage />)
    await screen.findByRole("table")

    await user.click(screen.getByRole("button", { name: "2" }))
    await waitFor(() => expect(calls.paramsOf(calls.last()).page).toBe("1"))

    await user.click(selectShowing("25"))
    await user.click(await screen.findByRole("option", { name: "50" }))

    await waitFor(() => expect(calls.paramsOf(calls.last())).toMatchObject({ size: "50", page: "0" }))
  })

  it("switches to the review queue, which reads a different endpoint and hides the stats cards", async () => {
    const user = setupUser()
    serveFilter([makeVendorUserProduct({ productName: "Listed Product" })])
    serveReviewQueue([{ name: "Waiting Product", approved: null }])

    render(<ProductsPage />)
    expect(await screen.findByText("Listed Product")).toBeInTheDocument()

    await switchToReviewQueue(user)

    expect(await screen.findByText("Waiting Product")).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /Total Products/ })).not.toBeInTheDocument()
    expect(screen.queryByPlaceholderText("Search products by name")).not.toBeInTheDocument()
  })

  it("badges pending and rejected products in the review queue and explains the rejection", async () => {
    const user = setupUser()
    serveFilter()
    serveReviewQueue([
      { id: "up-pending", name: "Pending Product", approved: null },
      { id: "up-rejected", name: "Rejected Product", approved: false, rejectedReason: "Photo is unreadable" },
    ])

    render(<ProductsPage />)
    await screen.findByRole("table")
    await switchToReviewQueue(user)

    const pendingRow = within((await screen.findByText("Pending Product")).closest("tr") as HTMLElement)
    expect(pendingRow.getByText("Pending Review")).toBeInTheDocument()

    const rejectedRow = within((await screen.findByText("Rejected Product")).closest("tr") as HTMLElement)
    expect(rejectedRow.getByText("Rejected")).toBeInTheDocument()
  })

  it("disables column sorting inside the review queue", async () => {
    const user = setupUser()
    serveFilter()
    serveReviewQueue([{ name: "Waiting Product", approved: null }])

    render(<ProductsPage />)
    await screen.findByRole("table")
    await switchToReviewQueue(user)

    await screen.findByText("Waiting Product")
    expect(screen.getByRole("button", { name: "Price" })).toBeDisabled()
    expect(screen.getByRole("button", { name: "Stock" })).toBeDisabled()
  })

  it("passes the review status filter through to the review endpoint", async () => {
    const user = setupUser()
    serveFilter()
    const reviewUrls: URL[] = []
    server.use(
      http.get("*/api/products/my-products", ({ request }) => {
        reviewUrls.push(new URL(request.url))
        return HttpResponse.json({ content: [], totalElements: 0, totalPages: 0 })
      }),
    )

    render(<ProductsPage />)
    await screen.findByRole("table")
    await switchToReviewQueue(user)

    await waitFor(() => expect(reviewUrls.length).toBeGreaterThan(0))
    expect(reviewUrls[reviewUrls.length - 1]?.searchParams.get("approved")).toBe("ALL")

    await user.click(selectShowing("All"))
    await user.click(await screen.findByRole("option", { name: "Rejected" }))

    await waitFor(() => expect(reviewUrls[reviewUrls.length - 1]?.searchParams.get("approved")).toBe("FALSE"))
  })

  /**
   * REGRESSION GUARD (K13): the review-queue mapping used to copy only a subset of the user
   * product — `skuCode`, `shipmentFee` and `heavyShippingSurcharge` were dropped, so a product
   * with a $25 shipment fee read $0.00 here and the inline editor saved those zeros back over the
   * vendor's real pricing (see the matching test in page.actions.test.tsx).
   */
  it("shows the real shipping fees in the review queue", async () => {
    const user = setupUser()
    serveFilter()
    server.use(
      http.get("*/api/products/my-products", () =>
        HttpResponse.json({
          content: [
            {
              product: makeProduct({ id: "p-9", name: "Heavy Product" }),
              reviewStatus: {
                id: "rev-9",
                approved: null,
                rejectedReason: null,
                lastReviewedByAdminId: null,
                updatedDate: "2026-01-10T09:00:00Z",
              },
              userProduct: makeUserProductDetailResponse({
                id: "up-9",
                productId: "p-9",
                productName: "Heavy Product",
                shipmentFee: 25,
                heavyShippingSurcharge: 75,
              }),
            },
          ],
          totalElements: 1,
          totalPages: 1,
        }),
      ),
    )

    render(<ProductsPage />)
    await screen.findByRole("table")
    await switchToReviewQueue(user)

    const row = within((await screen.findByText("Heavy Product")).closest("tr") as HTMLElement)
    expect(row.getByText("$25.00")).toBeInTheDocument()
    expect(row.getByText("$75.00")).toBeInTheDocument()
    // Only the genuinely absent periodic revenue still reads $0.00.
    expect(row.getAllByText("$0.00")).toHaveLength(1)
  })

  it("drops review items the backend returns without a user product", async () => {
    const user = setupUser()
    serveFilter()
    server.use(
      http.get("*/api/products/my-products", () =>
        HttpResponse.json({
          content: [
            {
              product: makeProduct({ id: "p-orphan", name: "Orphan Product" }),
              reviewStatus: {
                id: "rev-orphan",
                approved: null,
                rejectedReason: null,
                lastReviewedByAdminId: null,
                updatedDate: "2026-01-10T09:00:00Z",
              },
              userProduct: null,
            },
          ],
          totalElements: 1,
          totalPages: 1,
        }),
      ),
    )

    render(<ProductsPage />)
    await screen.findByRole("table")
    await switchToReviewQueue(user)

    expect(await screen.findByText("No products found. Create your first product!")).toBeInTheDocument()
    expect(screen.queryByText("Orphan Product")).not.toBeInTheDocument()
  })
})
