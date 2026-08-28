import { QueryClient } from "@tanstack/react-query"
import userEvent from "@testing-library/user-event"
import { HttpResponse, http } from "msw"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { DocumentProductsResponse } from "@/lib/api/vendor-documents"
import { vendorDocumentsAPI } from "@/lib/api/vendor-documents"
import { server } from "@/mocks/server"
import { render, screen, waitFor, within } from "@/test/render"
import { signInVendor } from "@/test/vendor-products-page-harness"
import DocumentProductsPanel from "./DocumentProductsPanel"

const DOCUMENT_ID = "doc-1"

function makeProduct(overrides: Record<string, unknown> = {}) {
  return {
    id: "up-1",
    userId: "user-1",
    productId: "p-1",
    productName: "Composite Resin Kit",
    price: 129.5,
    oldPrice: 149.5,
    discount: 20,
    stock: 12,
    active: true,
    coverPhotoPath: "/uploads/kit.png",
    skuCode: "SKU-1",
    sellCount: 0,
    height: 1,
    length: 1,
    width: 1,
    distanceUnit: "cm",
    weight: 1,
    massUnit: "kg",
    shipmentFee: 0,
    ...overrides,
  }
}

const mixed: DocumentProductsResponse = {
  documentId: DOCUMENT_ID,
  products: [
    { status: "success", product: makeProduct() },
    { status: "skip", product: makeProduct({ id: "up-2", productName: "Impression Tray", skuCode: "SKU-2" }) },
  ],
  wrongRows: [
    {
      Brand: "Mark3",
      Status: "x",
      Active: "true",
      Vendor_Product_Code: "104-160003",
      Export_Packaging: "false",
      Price: "43.4",
      Heavy_Shipping_Surcharge: "25",
      Manufacturer_Code: "160003",
      Shipment_Fee: "10",
      Fulfillment_Policy: "nothing",
      Stock: "50",
    },
  ],
}

function serveDocumentProducts(body: DocumentProductsResponse) {
  server.use(http.get("*/backend-api/user-products/documents/:documentId/products", () => HttpResponse.json(body)))
}

const tableRows = () => screen.getAllByRole("row").slice(1) // drop the header row

beforeEach(() => {
  vi.restoreAllMocks()
  signInVendor()
})

describe("DocumentProductsPanel", () => {
  it("labels each filter pill with its row count and opens on the imported rows", async () => {
    serveDocumentProducts(mixed)
    render(<DocumentProductsPanel documentId={DOCUMENT_ID} />)

    expect(await screen.findByRole("button", { name: "3 All" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "1 Imported" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "1 Skipped" })).toBeInTheDocument()

    // The imported rows are what the vendor came for, so that pill opens selected.
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "1 Imported" })).toHaveAttribute("aria-pressed", "true"),
    )

    await waitFor(() => expect(tableRows()).toHaveLength(1))
    expect(within(tableRows()[0]).getByText("SKU-1")).toBeInTheDocument()
  })

  // Spreadsheet cells arrive as strings, so a failed row still has to render
  // its price and stock as real values rather than a dash.
  it("reads the numeric columns off a failed row", async () => {
    serveDocumentProducts(mixed)
    const user = userEvent.setup()
    render(<DocumentProductsPanel documentId={DOCUMENT_ID} />)

    await user.click(await screen.findByRole("button", { name: "1 Failed" }))
    const row = within((await screen.findByText("104-160003")).closest("tr") as HTMLElement)
    expect(row.getByText("$43.40")).toBeInTheDocument()
    expect(row.getByText("50")).toBeInTheDocument()
  })

  it("shows every raw cell of a failed row when it is expanded", async () => {
    const user = userEvent.setup()
    serveDocumentProducts(mixed)
    render(<DocumentProductsPanel documentId={DOCUMENT_ID} />)

    await user.click(await screen.findByRole("button", { name: "1 Failed" }))
    await user.click(await screen.findByText("104-160003"))

    expect(await screen.findByText("Fulfillment Policy")).toBeInTheDocument()
    expect(screen.getByText("nothing")).toBeInTheDocument()
    expect(screen.getByText("Heavy Shipping Fee")).toBeInTheDocument()
    expect(screen.getByText("Vendor SKU")).toBeInTheDocument()
    expect(screen.getByText("Shipping Fee")).toBeInTheDocument()

    // Raw headers must never reach the vendor.
    expect(screen.queryByText("Heavy_Shipping_Surcharge")).not.toBeInTheDocument()
    expect(screen.queryByText("Vendor_Product_Code")).not.toBeInTheDocument()
  })

  // The upload template is file-driven, so unmapped headers still have to read cleanly.
  it("humanizes a column it has no mapping for", async () => {
    serveDocumentProducts({
      documentId: DOCUMENT_ID,
      products: [],
      wrongRows: [{ Status: "x", Some_Extra_Column: "value", anotherOddHeader: "other" }],
    })
    const user = userEvent.setup()
    render(<DocumentProductsPanel documentId={DOCUMENT_ID} />)

    await waitFor(() => expect(tableRows()).toHaveLength(1))
    await user.click(tableRows()[0])

    expect(screen.getByText("Some Extra Column")).toBeInTheDocument()
    expect(screen.getByText("Another Odd Header")).toBeInTheDocument()
  })

  // A group with no rows still has to report its zero rather than disappear.
  it("keeps every filter on screen at zero and makes empty ones unselectable", async () => {
    serveDocumentProducts({
      documentId: DOCUMENT_ID,
      products: [{ status: "success", product: makeProduct() }],
      wrongRows: [],
    })
    render(<DocumentProductsPanel documentId={DOCUMENT_ID} />)

    expect(await screen.findByRole("button", { name: "1 Imported" })).toBeEnabled()
    expect(screen.getByRole("button", { name: "0 Skipped" })).toBeDisabled()
    expect(screen.getByRole("button", { name: "0 Failed" })).toBeDisabled()
  })

  it("shows every row on the All pill", async () => {
    serveDocumentProducts(mixed)
    const user = userEvent.setup()
    render(<DocumentProductsPanel documentId={DOCUMENT_ID} />)

    await user.click(await screen.findByRole("button", { name: "3 All" }))

    await waitFor(() => expect(tableRows()).toHaveLength(3))
    expect(screen.getByText("Composite Resin Kit")).toBeInTheDocument()
    expect(screen.getByText("Impression Tray")).toBeInTheDocument()
  })

  // Without an invalid-records file the backend reports no per-row status,
  // so there is nothing to filter by.
  it("omits the filter pills when no row carries a status", async () => {
    serveDocumentProducts({
      documentId: DOCUMENT_ID,
      products: [{ status: null, product: makeProduct() }],
      wrongRows: [],
    })
    render(<DocumentProductsPanel documentId={DOCUMENT_ID} />)

    expect(await screen.findByText("Composite Resin Kit")).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /Imported|Skipped|Failed|All/ })).not.toBeInTheDocument()
  })

  // An import result is derived from a file that cannot change, so re-opening the
  // same document must not hit the network again.
  it("serves a re-opened document from cache instead of refetching", async () => {
    let requests = 0
    server.use(
      http.get("*/backend-api/user-products/documents/:documentId/products", () => {
        requests += 1
        return HttpResponse.json(mixed)
      }),
    )

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })

    const first = render(<DocumentProductsPanel documentId={DOCUMENT_ID} />, { queryClient })
    expect(await screen.findByRole("button", { name: "1 Imported" })).toBeInTheDocument()
    await waitFor(() => expect(requests).toBe(1))
    first.unmount()

    render(<DocumentProductsPanel documentId={DOCUMENT_ID} />, { queryClient })
    expect(await screen.findByRole("button", { name: "1 Imported" })).toBeInTheDocument()
    expect(requests).toBe(1)
  })

  // A different document is a different file, so it still has to be fetched.
  it("fetches a different document rather than reusing the cached one", async () => {
    let requests = 0
    server.use(
      http.get("*/backend-api/user-products/documents/:documentId/products", () => {
        requests += 1
        return HttpResponse.json(mixed)
      }),
    )

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })

    const first = render(<DocumentProductsPanel documentId={DOCUMENT_ID} />, { queryClient })
    expect(await screen.findByRole("button", { name: "1 Imported" })).toBeInTheDocument()
    first.unmount()

    render(<DocumentProductsPanel documentId="doc-2" />, { queryClient })
    await waitFor(() => expect(requests).toBe(2))
  })

  it("surfaces a load failure with a retry", async () => {
    server.use(
      http.get("*/backend-api/user-products/documents/:documentId/products", () =>
        HttpResponse.json({ message: "Sheet not found" }, { status: 500 }),
      ),
    )
    render(<DocumentProductsPanel documentId={DOCUMENT_ID} />)

    expect(await screen.findByText("Sheet not found")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument()
  })

  it("refetches when Try again is clicked", async () => {
    let attempts = 0
    server.use(
      http.get("*/backend-api/user-products/documents/:documentId/products", () => {
        attempts += 1
        return attempts === 1
          ? HttpResponse.json({ message: "Sheet not found" }, { status: 500 })
          : HttpResponse.json(mixed)
      }),
    )
    const user = userEvent.setup()
    render(<DocumentProductsPanel documentId={DOCUMENT_ID} />)

    await user.click(await screen.findByRole("button", { name: "Try again" }))

    expect(await screen.findByRole("button", { name: "1 Imported" })).toBeInTheDocument()
  })

  // React Query's `error` is `unknown` - a thrown non-Error value must still degrade to the
  // generic fallback message rather than crash the component.
  it("falls back to a generic message when a non-Error value is thrown", async () => {
    vi.spyOn(vendorDocumentsAPI, "getDocumentProducts").mockRejectedValue("boom")
    render(<DocumentProductsPanel documentId={DOCUMENT_ID} />)

    expect(await screen.findByText("Couldn't load imported products")).toBeInTheDocument()
    expect(screen.getByText("Failed to load imported products")).toBeInTheDocument()
  })

  it("shows 'No cell values for this row' when a failed row's cells are all blank", async () => {
    const user = userEvent.setup()
    serveDocumentProducts({
      documentId: DOCUMENT_ID,
      products: [],
      wrongRows: [{ Status: "   ", Note: "" }],
    })
    render(<DocumentProductsPanel documentId={DOCUMENT_ID} />)

    await waitFor(() => expect(tableRows()).toHaveLength(1))
    await user.click(tableRows()[0])

    expect(await screen.findByText("No cell values for this row.")).toBeInTheDocument()
  })

  // `humanizeColumn` falls back to returning the raw key when stripping separators leaves no
  // words at all (a header made only of underscores/dashes) - an edge case a file-driven
  // template can produce even though no real header would sanely be named this way.
  it("falls back to the raw key for a column header with no alphanumeric words", async () => {
    const user = userEvent.setup()
    serveDocumentProducts({
      documentId: DOCUMENT_ID,
      products: [],
      wrongRows: [{ Status: "x", ___: "value" }],
    })
    render(<DocumentProductsPanel documentId={DOCUMENT_ID} />)

    await waitFor(() => expect(tableRows()).toHaveLength(1))
    await user.click(tableRows()[0])

    expect(await screen.findByText("___")).toBeInTheDocument()
  })

  it("shows a non-numeric money-column value untouched instead of coercing it", async () => {
    const user = userEvent.setup()
    serveDocumentProducts({
      documentId: DOCUMENT_ID,
      products: [],
      wrongRows: [{ Status: "x", Price: "N/A" }],
    })
    render(<DocumentProductsPanel documentId={DOCUMENT_ID} />)

    await waitFor(() => expect(tableRows()).toHaveLength(1))
    await user.click(tableRows()[0])

    expect(await screen.findByText("N/A")).toBeInTheDocument()
  })

  it("tolerates a currency-symbol price by stripping it before parsing", async () => {
    serveDocumentProducts({
      documentId: DOCUMENT_ID,
      products: [],
      wrongRows: [
        { Status: "x", Product_Name: "Odd Item", Vendor_Product_Code: "SKU-9", Price: "$43.40", Stock: "not-a-number" },
      ],
    })
    render(<DocumentProductsPanel documentId={DOCUMENT_ID} />)

    const row = within((await screen.findByText("SKU-9")).closest("tr") as HTMLElement)
    // Price parsed after stripping the "$".
    expect(row.getByText("$43.40")).toBeInTheDocument()
    // A non-numeric stock cell renders as a dash rather than a coerced value.
    expect(row.getByText("—")).toBeInTheDocument()
  })

  it("matches a row's failure reason back by its Row number", async () => {
    serveDocumentProducts({
      documentId: DOCUMENT_ID,
      products: [],
      wrongRows: [
        { Row: "5", Vendor_Product_Code: "SKU-A" },
        { Row: "9", Vendor_Product_Code: "SKU-B" },
      ],
    })
    render(
      <DocumentProductsPanel
        documentId={DOCUMENT_ID}
        rowIssues={["Row 9: Price is not numeric", "Row 5: Missing SKU"]}
      />,
    )

    const rowA = within((await screen.findByText("SKU-A")).closest("tr") as HTMLElement)
    expect(rowA.getByText("Missing SKU")).toBeInTheDocument()
    const rowB = within(screen.getByText("SKU-B").closest("tr") as HTMLElement)
    expect(rowB.getByText("Price is not numeric")).toBeInTheDocument()
  })

  // When no row carries a parseable "Row N:" number, reasons fall back to positional pairing -
  // but only when the two lists are the exact same length, since otherwise there is no safe way
  // to know which reason belongs to which row.
  it("falls back to positional pairing when a row has no parseable row number and the lists line up", async () => {
    // Neither wrong row carries a "row"/"row number"/"satır" cell, so `rowNumber` is NaN for
    // both - the parsed `rowIssues` (which DO carry row numbers) can only be matched by
    // position, and only because there are exactly as many reasons as wrong rows.
    serveDocumentProducts({
      documentId: DOCUMENT_ID,
      products: [],
      wrongRows: [
        { Status: "x", Vendor_Product_Code: "SKU-A" },
        { Status: "x", Vendor_Product_Code: "SKU-B" },
      ],
    })
    render(
      <DocumentProductsPanel documentId={DOCUMENT_ID} rowIssues={["Row 2: first reason", "Row 5: second reason"]} />,
    )

    const rowA = within((await screen.findByText("SKU-A")).closest("tr") as HTMLElement)
    expect(rowA.getByText("first reason")).toBeInTheDocument()
  })

  it("shows no reason when the row-issue count does not match the wrong-row count", async () => {
    serveDocumentProducts({
      documentId: DOCUMENT_ID,
      products: [],
      wrongRows: [{ Status: "x", Vendor_Product_Code: "SKU-A" }],
    })
    render(<DocumentProductsPanel documentId={DOCUMENT_ID} rowIssues={["Row 2: reason one", "Row 5: reason two"]} />)

    await waitFor(() => expect(tableRows()).toHaveLength(1))
    // No reason column when nothing could be matched to this single row.
    expect(screen.queryByText(/reason (one|two)/)).not.toBeInTheDocument()
  })

  it("collapses an expanded failed row back down on a second click", async () => {
    const user = userEvent.setup()
    serveDocumentProducts(mixed)
    render(<DocumentProductsPanel documentId={DOCUMENT_ID} />)

    await user.click(await screen.findByRole("button", { name: "1 Failed" }))
    const cell = await screen.findByText("104-160003")
    await user.click(cell)
    expect(await screen.findByText("Fulfillment Policy")).toBeInTheDocument()

    await user.click(cell)
    await waitFor(() => expect(screen.queryByText("Fulfillment Policy")).not.toBeInTheDocument())
  })

  it("does not expand a row with no raw cell data (an imported/skipped product row)", async () => {
    const user = userEvent.setup()
    serveDocumentProducts(mixed)
    render(<DocumentProductsPanel documentId={DOCUMENT_ID} />)

    await user.click(await screen.findByRole("button", { name: "3 All" }))
    await waitFor(() => expect(tableRows()).toHaveLength(3))

    const productRow = screen.getByText("Composite Resin Kit").closest("tr") as HTMLElement
    await user.click(productRow)

    // Nothing renders as expanded content for a product row - clicking it is a no-op.
    expect(screen.queryByText("No cell values for this row.")).not.toBeInTheDocument()
  })
})
