import { QueryClient } from "@tanstack/react-query"
import userEvent from "@testing-library/user-event"
import { HttpResponse, http } from "msw"
import { beforeEach, describe, expect, it } from "vitest"
import type { DocumentProductsResponse } from "@/lib/api/vendor-documents"
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
})
