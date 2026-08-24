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

const rowFor = async (name: string) => within((await screen.findByText(name)).closest("tr") as HTMLElement)

/** Captures the body of every inline-edit save so the wire contract can be asserted. */
const captureUpdates = () => {
  const bodies: Array<Record<string, unknown>> = []
  server.use(
    http.put("*/api/user-products/:id", async ({ request, params }) => {
      const body = (await request.json()) as Record<string, unknown>
      bodies.push({ ...body, __id: String(params.id) })
      return HttpResponse.json({ ...makeVendorUserProduct(), ...body, id: String(params.id) })
    }),
  )
  return bodies
}

const startEditing = async (user: ReturnType<typeof setupUser>, productName: string) => {
  const row = await rowFor(productName)
  await user.click(row.getByRole("button", { name: "Edit" }))
  return row
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

describe("Vendor ProductsPage — inline editing", () => {
  it("seeds the edit inputs from the row and saves the changed values", async () => {
    const user = setupUser()
    serveFilter([
      makeVendorUserProduct({
        id: "up-7",
        productName: "Editable Product",
        price: 56,
        discount: 20,
        stock: 40,
        shipmentFee: 5,
        heavyShippingSurcharge: 0,
      }),
    ])
    const updates = captureUpdates()

    render(<ProductsPage />)
    const row = await startEditing(user, "Editable Product")

    const [priceInput, discountInput, shipmentInput, heavyInput, stockInput] = row.getAllByRole("spinbutton")
    expect(priceInput).toHaveValue(56)
    expect(discountInput).toHaveValue(20)
    expect(shipmentInput).toHaveValue(5)
    expect(heavyInput).toHaveValue(0)
    expect(stockInput).toHaveValue(40)

    await user.clear(stockInput as HTMLElement)
    await user.type(stockInput as HTMLElement, "12")
    await user.click(row.getByRole("button", { name: "Save" }))

    await waitFor(() => expect(updates).toHaveLength(1))
    expect(updates[0]).toMatchObject({ __id: "up-7", stock: 12, price: 56, discount: 20, active: true })
    // Editing stops once the save resolves.
    await waitFor(() => expect(row.queryByRole("spinbutton")).not.toBeInTheDocument())
  })

  /**
   * The backend rejects a price and discount update in the same call and wipes the discount when
   * the price moves, so untouched fields must go back byte-identical — including the float noise
   * the display rounds away. See `keepOriginalIfUnchanged` in page.tsx.
   */
  it("sends the original unrounded values back for fields the vendor never touched", async () => {
    const user = setupUser()
    serveFilter([
      makeVendorUserProduct({
        id: "up-8",
        productName: "Noisy Product",
        price: 32.219249999999995,
        discount: 12.3456789,
        stock: 10,
      }),
    ])
    const updates = captureUpdates()

    render(<ProductsPage />)
    const row = await startEditing(user, "Noisy Product")

    expect(row.getAllByRole("spinbutton")[0]).toHaveValue(32.22)

    await user.click(row.getByRole("button", { name: "Save" }))

    await waitFor(() => expect(updates).toHaveLength(1))
    expect(updates[0]?.price).toBe(32.219249999999995)
    expect(updates[0]?.discount).toBe(12.3456789)
  })

  it("sends the rounded value once the vendor actually edits the field", async () => {
    const user = setupUser()
    serveFilter([makeVendorUserProduct({ id: "up-9", productName: "Repriced Product", price: 32.219249999999995 })])
    const updates = captureUpdates()

    render(<ProductsPage />)
    const row = await startEditing(user, "Repriced Product")

    const priceInput = row.getAllByRole("spinbutton")[0] as HTMLElement
    await user.clear(priceInput)
    await user.type(priceInput, "40")
    await user.click(row.getByRole("button", { name: "Save" }))

    await waitFor(() => expect(updates).toHaveLength(1))
    expect(updates[0]?.price).toBe(40)
  })

  it("abandons the draft when the vendor cancels", async () => {
    const user = setupUser()
    serveFilter([makeVendorUserProduct({ productName: "Cancelled Product", stock: 40 })])
    const updates = captureUpdates()

    render(<ProductsPage />)
    const row = await startEditing(user, "Cancelled Product")

    const stockInput = row.getAllByRole("spinbutton")[4] as HTMLElement
    await user.clear(stockInput)
    await user.type(stockInput, "3")
    await user.click(row.getByRole("button", { name: "Cancel" }))

    await waitFor(() => expect(row.queryByRole("spinbutton")).not.toBeInTheDocument())
    expect(row.getByText("40")).toBeInTheDocument()
    expect(updates).toHaveLength(0)
  })

  it("blocks saving while a required number is missing", async () => {
    const user = setupUser()
    serveFilter([makeVendorUserProduct({ productName: "Blank Product" })])

    render(<ProductsPage />)
    const row = await startEditing(user, "Blank Product")

    await user.clear(row.getAllByRole("spinbutton")[0] as HTMLElement)

    expect(row.getByRole("button", { name: "Save" })).toBeDisabled()
  })

  /**
   * SUSPICIOUS (page.tsx:1112 and page.tsx:726): the stock draft is validated with
   * `Number.parseInt(draft, 10)`, which truncates rather than rejects. A vendor who types 1.5
   * sees no error — the product is silently saved with a stock of 1. Locking that behaviour.
   */
  it("silently truncates a fractional stock count instead of rejecting it", async () => {
    const user = setupUser()
    serveFilter([makeVendorUserProduct({ productName: "Fractional Product" })])
    const updates = captureUpdates()

    render(<ProductsPage />)
    const row = await startEditing(user, "Fractional Product")

    const stockInput = row.getAllByRole("spinbutton")[4] as HTMLElement
    await user.clear(stockInput)
    await user.type(stockInput, "1.5")

    expect(row.getByRole("button", { name: "Save" })).toBeEnabled()
    await user.click(row.getByRole("button", { name: "Save" }))

    await waitFor(() => expect(updates).toHaveLength(1))
    expect(updates[0]?.stock).toBe(1)
  })

  it("keeps the row in edit mode and reports the failure when the save request fails", async () => {
    const user = setupUser()
    serveFilter([makeVendorUserProduct({ productName: "Failing Product" })])
    server.use(http.put("*/api/user-products/:id", () => HttpResponse.json({ message: "nope" }, { status: 500 })))
    vi.spyOn(console, "error").mockImplementation(() => {})

    render(<ProductsPage />)
    const row = await startEditing(user, "Failing Product")

    await user.click(row.getByRole("button", { name: "Save" }))

    await waitFor(() => expect(toastSpies.error).toHaveBeenCalledWith("Update failed", expect.any(String)))
    expect(row.getAllByRole("spinbutton").length).toBeGreaterThan(0)
  })

  /**
   * REGRESSION GUARD (K13): the review-queue mapping used to drop `shipmentFee`,
   * `heavyShippingSurcharge` and `skuCode` while still offering the inline editor, so
   * `keepOriginalIfUnchanged(0, undefined)` returned 0 and simply pressing Save in the Review
   * Queue overwrote the vendor's real shipping fees with zero and cleared the SKU — silent data
   * loss. The mapping now carries those three fields; saving untouched must preserve them.
   */
  it("preserves the shipping fees when a review-queue row is saved untouched", async () => {
    const user = setupUser()
    serveFilter()
    server.use(
      http.get("*/api/products/my-products", () =>
        HttpResponse.json({
          content: [
            {
              product: makeProduct({ id: "p-9", name: "Queued Product" }),
              reviewStatus: {
                id: "rev-9",
                approved: false,
                rejectedReason: "Bad photo",
                lastReviewedByAdminId: null,
                updatedDate: "2026-01-10T09:00:00Z",
              },
              userProduct: makeUserProductDetailResponse({
                id: "up-review",
                productId: "p-9",
                productName: "Queued Product",
                shipmentFee: 25,
                heavyShippingSurcharge: 75,
                skuCode: "SKU-REAL",
              }),
            },
          ],
          totalElements: 1,
          totalPages: 1,
        }),
      ),
    )
    const updates = captureUpdates()

    render(<ProductsPage />)
    await screen.findByRole("table")
    const tab = await screen.findByRole("tab", { name: "Review Queue" })
    await waitFor(() => expect(tab).toBeEnabled())
    await user.click(tab)

    const row = await startEditing(user, "Queued Product")
    await user.click(row.getByRole("button", { name: "Save" }))

    await waitFor(() => expect(updates).toHaveLength(1))
    expect(updates[0]?.shipmentFee).toBe(25)
    expect(updates[0]?.heavyShippingSurcharge).toBe(75)
    expect(updates[0]?.skuCode).toBe("SKU-REAL")
  })
})

describe("Vendor ProductsPage — row actions", () => {
  it("asks for confirmation before deleting and only then calls the API", async () => {
    const user = setupUser()
    serveFilter([makeVendorUserProduct({ id: "up-del", productName: "Doomed Product" })])
    const deleted: string[] = []
    server.use(
      http.delete("*/api/user-products/:id", ({ params }) => {
        deleted.push(String(params.id))
        return new HttpResponse(null, { status: 204 })
      }),
    )

    render(<ProductsPage />)
    const row = await rowFor("Doomed Product")
    await user.click(row.getByRole("button", { name: "Delete" }))

    expect(await screen.findByText(/Are you sure you want to delete "Doomed Product"\?/)).toBeInTheDocument()
    expect(deleted).toHaveLength(0)

    const dialog = within(screen.getByRole("dialog"))
    await user.click(dialog.getByRole("button", { name: "Delete" }))

    await waitFor(() => expect(deleted).toEqual(["up-del"]))
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
  })

  it("keeps the product when the delete dialog is dismissed", async () => {
    const user = setupUser()
    serveFilter([makeVendorUserProduct({ productName: "Spared Product" })])
    const deleted = vi.fn()
    server.use(
      http.delete("*/api/user-products/:id", () => {
        deleted()
        return new HttpResponse(null, { status: 204 })
      }),
    )

    render(<ProductsPage />)
    const row = await rowFor("Spared Product")
    await user.click(row.getByRole("button", { name: "Delete" }))
    await user.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Cancel" }))

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
    expect(deleted).not.toHaveBeenCalled()
    expect(screen.getByText("Spared Product")).toBeInTheDocument()
  })

  it("reports a failed delete and leaves the dialog open", async () => {
    const user = setupUser()
    serveFilter([makeVendorUserProduct({ productName: "Stuck Product" })])
    server.use(http.delete("*/api/user-products/:id", () => HttpResponse.json({ message: "no" }, { status: 500 })))
    vi.spyOn(console, "error").mockImplementation(() => {})

    render(<ProductsPage />)
    const row = await rowFor("Stuck Product")
    await user.click(row.getByRole("button", { name: "Delete" }))
    await user.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Delete" }))

    await waitFor(() => expect(toastSpies.error).toHaveBeenCalledWith("Delete failed", expect.any(String)))
    expect(screen.getByRole("dialog")).toBeInTheDocument()
  })

  it("opens the product detail modal from the row's view button", async () => {
    const user = setupUser()
    serveFilter([makeVendorUserProduct({ id: "up-1", productId: "p-1", productName: "Inspected Product" })])

    render(<ProductsPage />)
    const row = await rowFor("Inspected Product")
    await user.click(row.getByRole("button", { name: "View details" }))

    const dialog = within(await screen.findByRole("dialog"))
    expect(await dialog.findByText("Intra Oral Mixing Tips")).toBeInTheDocument()
  })

  /**
   * SUSPICIOUS (page.tsx:1166-1183): the resubmit button is rendered for pending products too,
   * but `disabled={isPending}` makes it inert there — a control that exists only to be greyed
   * out. Rejected products get the working version.
   */
  it("routes a rejected product to the create page for resubmission but greys the pending one out", async () => {
    const user = setupUser()
    serveFilter()
    server.use(
      http.get("*/api/products/my-products", () =>
        HttpResponse.json({
          content: [
            {
              product: makeProduct({ id: "p-rej", name: "Rejected Product" }),
              reviewStatus: {
                id: "rev-1",
                approved: false,
                rejectedReason: "Bad photo",
                lastReviewedByAdminId: null,
                updatedDate: "2026-01-10T09:00:00Z",
              },
              userProduct: makeUserProductDetailResponse({
                id: "up-rej",
                productId: "p-rej",
                productName: "Rejected Product",
              }),
            },
            {
              product: makeProduct({ id: "p-pend", name: "Pending Product" }),
              reviewStatus: {
                id: "rev-2",
                approved: null,
                rejectedReason: null,
                lastReviewedByAdminId: null,
                updatedDate: "2026-01-10T09:00:00Z",
              },
              userProduct: makeUserProductDetailResponse({
                id: "up-pend",
                productId: "p-pend",
                productName: "Pending Product",
              }),
            },
          ],
          totalElements: 2,
          totalPages: 1,
        }),
      ),
    )

    const { router } = render(<ProductsPage />)
    await screen.findByRole("table")
    const tab = await screen.findByRole("tab", { name: "Review Queue" })
    await waitFor(() => expect(tab).toBeEnabled())
    await user.click(tab)

    const pendingRow = await rowFor("Pending Product")
    expect(
      pendingRow.getByRole("button", { name: "Product is pending review and cannot be edited yet" }),
    ).toBeDisabled()

    const rejectedRow = await rowFor("Rejected Product")
    await user.click(rejectedRow.getByRole("button", { name: "Edit rejected product and resubmit for review" }))

    expect(router.push).toHaveBeenCalledWith(
      "/vendor-dashboard/products/create?reviewEditId=p-rej&reviewUserProductId=up-rej",
    )
  })
})

describe("Vendor ProductsPage — selection and bulk discount", () => {
  const twoProducts = () => [
    makeVendorUserProduct({ id: "up-1", productName: "First Product" }),
    makeVendorUserProduct({ id: "up-2", productName: "Second Product" }),
  ]

  it("selects rows by clicking them and clears the selection again", async () => {
    const user = setupUser()
    serveFilter(twoProducts(), { totalElements: 2 })

    render(<ProductsPage />)
    await user.click(await screen.findByText("First Product"))

    expect(await screen.findByText("product selected")).toBeInTheDocument()

    await user.click(screen.getByText("Second Product"))
    expect(await screen.findByText("products selected")).toBeInTheDocument()

    await user.click(screen.getByText("Second Product"))
    expect(await screen.findByText("product selected")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: /Clear/ }))
    await waitFor(() => expect(screen.queryByText("product selected")).not.toBeInTheDocument())
  })

  it("does not toggle selection when a control inside the row is clicked", async () => {
    const user = setupUser()
    serveFilter(twoProducts(), { totalElements: 2 })

    render(<ProductsPage />)
    const row = await rowFor("First Product")
    await user.click(row.getByRole("button", { name: "View details" }))

    expect(screen.queryByText("product selected")).not.toBeInTheDocument()
  })

  it("drops the selection when the query changes", async () => {
    const user = setupUser()
    serveFilter(twoProducts(), { totalElements: 2 })

    render(<ProductsPage />)
    await user.click(await screen.findByText("First Product"))
    expect(await screen.findByText("product selected")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Price" }))

    await waitFor(() => expect(screen.queryByText("product selected")).not.toBeInTheDocument())
  })

  it("applies a bulk discount to every selected product and refreshes the list", async () => {
    const user = setupUser()
    const calls = serveFilter(twoProducts(), { totalElements: 2 })
    const payloads: Array<Record<string, unknown>> = []
    server.use(
      http.post("*/api/user-products/bulk-discount", async ({ request }) => {
        payloads.push((await request.json()) as Record<string, unknown>)
        return HttpResponse.json([makeVendorUserProduct()])
      }),
    )

    render(<ProductsPage />)
    await user.click(await screen.findByText("First Product"))
    await user.click(screen.getByText("Second Product"))
    await user.click(screen.getByRole("button", { name: /Bulk Discount/ }))

    const dialog = within(await screen.findByRole("dialog"))
    expect(dialog.getByText("Applies to 2 selected products.")).toBeInTheDocument()

    const callsBefore = calls.urls.length
    await user.type(dialog.getByLabelText("Discount (%)"), "15")
    await user.click(dialog.getByRole("button", { name: /Apply Discount/ }))

    await waitFor(() => expect(payloads).toEqual([{ userProductIds: ["up-1", "up-2"], discount: 15 }]))
    expect(toastSpies.success).toHaveBeenCalledWith("Discount applied", "15% discount applied to 2 products.")
    await waitFor(() => expect(calls.urls.length).toBeGreaterThan(callsBefore))
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
  })

  it("refuses a discount above 100 without calling the API", async () => {
    const user = setupUser()
    serveFilter(twoProducts(), { totalElements: 2 })
    const requested = vi.fn()
    server.use(
      http.post("*/api/user-products/bulk-discount", () => {
        requested()
        return HttpResponse.json([])
      }),
    )

    render(<ProductsPage />)
    await user.click(await screen.findByText("First Product"))
    await user.click(screen.getByRole("button", { name: /Bulk Discount/ }))

    const dialog = within(await screen.findByRole("dialog"))
    await user.type(dialog.getByLabelText("Discount (%)"), "150")
    await user.click(dialog.getByRole("button", { name: /Apply Discount/ }))

    await waitFor(() =>
      expect(toastSpies.error).toHaveBeenCalledWith("Invalid discount", "Discount must be a number between 0 and 100."),
    )
    expect(requested).not.toHaveBeenCalled()
    expect(screen.getByRole("dialog")).toBeInTheDocument()
  })

  it("keeps the apply button disabled until a discount is typed", async () => {
    const user = setupUser()
    serveFilter(twoProducts(), { totalElements: 2 })

    render(<ProductsPage />)
    await user.click(await screen.findByText("First Product"))
    await user.click(screen.getByRole("button", { name: /Bulk Discount/ }))

    const dialog = within(await screen.findByRole("dialog"))
    expect(dialog.getByRole("button", { name: /Apply Discount/ })).toBeDisabled()

    await user.type(dialog.getByLabelText("Discount (%)"), "5")
    expect(dialog.getByRole("button", { name: /Apply Discount/ })).toBeEnabled()
  })

  it("reports a failed bulk discount and keeps the dialog open", async () => {
    const user = setupUser()
    serveFilter(twoProducts(), { totalElements: 2 })
    server.use(
      http.post("*/api/user-products/bulk-discount", () => HttpResponse.json({ message: "no" }, { status: 500 })),
    )
    vi.spyOn(console, "error").mockImplementation(() => {})

    render(<ProductsPage />)
    await user.click(await screen.findByText("First Product"))
    await user.click(screen.getByRole("button", { name: /Bulk Discount/ }))

    const dialog = within(await screen.findByRole("dialog"))
    await user.type(dialog.getByLabelText("Discount (%)"), "10")
    await user.click(dialog.getByRole("button", { name: /Apply Discount/ }))

    await waitFor(() => expect(toastSpies.error).toHaveBeenCalledWith("Bulk discount failed", expect.any(String)))
    expect(screen.getByRole("dialog")).toBeInTheDocument()
  })

  it("offers no bulk actions inside the review queue", async () => {
    const user = setupUser()
    serveFilter(twoProducts(), { totalElements: 2 })
    server.use(
      http.get("*/api/products/my-products", () =>
        HttpResponse.json({
          content: [
            {
              product: makeProduct({ id: "p-1", name: "Queued Product" }),
              reviewStatus: {
                id: "rev-1",
                approved: null,
                rejectedReason: null,
                lastReviewedByAdminId: null,
                updatedDate: "2026-01-10T09:00:00Z",
              },
              userProduct: makeUserProductDetailResponse({ id: "up-1", productName: "Queued Product" }),
            },
          ],
          totalElements: 1,
          totalPages: 1,
        }),
      ),
    )

    render(<ProductsPage />)
    await user.click(await screen.findByText("First Product"))
    expect(await screen.findByText("product selected")).toBeInTheDocument()

    const tab = await screen.findByRole("tab", { name: "Review Queue" })
    await waitFor(() => expect(tab).toBeEnabled())
    await user.click(tab)

    await screen.findByText("Queued Product")
    await user.click(screen.getByText("Queued Product"))
    expect(screen.queryByRole("button", { name: /Bulk Discount/ })).not.toBeInTheDocument()
  })
})

describe("Vendor ProductsPage — import modal", () => {
  it("opens the import dialog and lists the vendor's previous uploads", async () => {
    const user = setupUser()
    serveFilter()
    server.use(
      http.get("*/backend-api/products/documents", () =>
        HttpResponse.json({
          content: [
            {
              id: "doc-1",
              filePath: "uploads/1700000000_catalog.xlsx",
              approved: true,
              systemRejected: false,
              revisionRequested: false,
              revisionApproved: null,
              revisedFilePath: null,
              createdDate: "2026-02-01T10:00:00Z",
            },
          ],
          totalElements: 1,
          totalPages: 1,
          number: 0,
          size: 10,
        }),
      ),
    )

    render(<ProductsPage />)
    await screen.findByRole("table")

    await user.click(screen.getByRole("button", { name: /Import Products/ }))

    const dialog = within(await screen.findByRole("dialog"))
    await user.click(dialog.getByRole("button", { name: "My Uploads" }))
    expect(await dialog.findByText("catalog.xlsx")).toBeInTheDocument()
  })
})
