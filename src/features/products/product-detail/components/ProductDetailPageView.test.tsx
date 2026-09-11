import { beforeEach, describe, expect, it, vi } from "vitest"
import { installRadixPointerPolyfills } from "@/test/radix"
import { render, screen, waitFor } from "@/test/render"
import { buildProductDetailViewModel } from "../server/build-product-detail-view-model"
import type { ProductDetailPageData } from "../types"
import ProductDetailPageView from "./ProductDetailPageView"

installRadixPointerPolyfills()

const mockToastError = vi.fn()

// The default MSW handler for `/products/variant-attributes` (src/mocks/handlers/products.handlers.ts)
// answers 400 - every real product in these fixtures has no variant group - so this suite mostly
// just needs to confirm that failure stays silent instead of surfacing a toast.
vi.mock("@/components/ui/Toast", () => ({
  showToast: {
    error: (...args: unknown[]) => mockToastError(...args),
    success: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  },
}))

const pageData: ProductDetailPageData = {
  productData: {
    product: {
      id: "abcdef1234567890",
      name: "Intra Oral Mixing Tips",
      price: 56,
      primaryMarket: "Impression Materials",
      bestPriceVendor: "Acme Dental",
      bestPriceVendorUserProductId: "up-1",
      overallStar: 4.5,
      reviewCount: 12,
      attributes: [{ attributeName: "Packaging", attributeValue: "8.5 gram syringe" }],
    },
    userProducts: [
      { id: "up-1", vendor: "Acme Dental", price: 56, stock: 40, shipmentFee: 5 },
      { id: "up-2", vendor: "Beta Supplies", price: 60, stock: 5, shipmentFee: 0 },
    ],
  },
  questions: null,
}

const viewModel = buildProductDetailViewModel("abcdef1234567890", pageData, null)

const pageDataWithoutAttributes: ProductDetailPageData = {
  productData: {
    ...pageData.productData,
    product: { ...pageData.productData.product, attributes: undefined },
  },
  questions: null,
}

const viewModelWithoutAttributes = buildProductDetailViewModel("abcdef1234567890", pageDataWithoutAttributes, null)

describe("ProductDetailPageView", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    mockToastError.mockClear()
  })

  // Every backend failure on the variant-attributes endpoint is HTTP 400, including "this
  // product has no variants" - the hero must stay silent (no chip block, no toast) rather than
  // showing an error for what is, for most products, entirely normal.
  it("renders no variant selector and no toast for a product with no variant group", async () => {
    const { container } = render(<ProductDetailPageView viewModel={viewModel} />, {
      route: "/products/abcdef1234567890",
    })

    // The variant selector's "Selected pricing" is still there (unrelated block); `[aria-busy]`
    // only ever exists inside VariantAttributeSelector's ready-state wrapper, so its absence
    // means the selector rendered nothing at all - not just an empty group list.
    expect(screen.getByText("Selected pricing")).toBeInTheDocument()
    await waitFor(() => {
      expect(container.querySelector("[aria-busy]")).not.toBeInTheDocument()
    })
    expect(mockToastError).not.toHaveBeenCalled()
  })

  // A11y: this route had zero <h1> and no <main> landmark when scanned (axe on /products/p-1:
  // "expected exactly 1 <h1>, found 0" and `landmark-one-main`). The product title was already an
  // <h1> inside ProductHeroDetails - the page just never wrapped its content in a <main>.
  it("exposes exactly one h1, the product's title, inside a single main landmark", () => {
    render(<ProductDetailPageView viewModel={viewModel} />, { route: "/products/abcdef1234567890" })

    const h1s = screen.getAllByRole("heading", { level: 1 })
    expect(h1s).toHaveLength(1)
    expect(h1s[0]).toHaveTextContent("Intra Oral Mixing Tips")

    const mains = screen.getAllByRole("main")
    expect(mains).toHaveLength(1)
    expect(mains[0]).toContainElement(h1s[0])
  })

  it("stacks the hero, specifications, purchase, community and recommendation sections", () => {
    render(<ProductDetailPageView viewModel={viewModel} />, { route: "/products/abcdef1234567890" })

    expect(screen.getByRole("heading", { name: "Compare Suppliers & Pricing" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Specifications" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Purchase Options" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Product Reviews" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Questions & Answers" })).toBeInTheDocument()
  })

  // Specs belong above the supplier table: a buyer decides "is this the right product?" before
  // "which vendor?". The section sits inside the hero's client boundary, so this order is easy to
  // break by moving the slot.
  it("places the Specifications section above the supplier comparison", () => {
    render(<ProductDetailPageView viewModel={viewModel} />, { route: "/products/abcdef1234567890" })

    const specs = screen.getByRole("heading", { name: "Specifications" })
    const suppliers = screen.getByRole("heading", { name: "Compare Suppliers & Pricing" })

    expect(specs.compareDocumentPosition(suppliers) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it("does not render the Specifications heading when the product has no attributes", () => {
    render(<ProductDetailPageView viewModel={viewModelWithoutAttributes} />, {
      route: "/products/abcdef1234567890",
    })

    expect(screen.queryByRole("heading", { name: "Specifications" })).not.toBeInTheDocument()
  })

  it("lists every supplier the product has", () => {
    render(<ProductDetailPageView viewModel={viewModel} />, { route: "/products/abcdef1234567890" })

    expect(screen.getAllByText("Acme Dental").length).toBeGreaterThan(0)
    expect(screen.getAllByText("Beta Supplies").length).toBeGreaterThan(0)
  })

  it("prices the purchase panel from the vendor named in the URL", () => {
    render(<ProductDetailPageView viewModel={viewModel} />, {
      route: "/products/abcdef1234567890",
      searchParams: "vendorId=up-2",
    })

    expect(screen.getByText("Units available: 5")).toBeInTheDocument()
  })

  it("falls back to the best-price vendor's stock without a vendorId", () => {
    render(<ProductDetailPageView viewModel={viewModel} />, { route: "/products/abcdef1234567890" })

    expect(screen.getByText("Units available: 40")).toBeInTheDocument()
  })

  it("renders a Save to favorites button in the hero", () => {
    render(<ProductDetailPageView viewModel={viewModel} />, { route: "/products/abcdef1234567890" })

    expect(screen.getByRole("button", { name: "Save to favorites" })).toBeInTheDocument()
  })

  it("shows the product's own review and question empty states", () => {
    render(<ProductDetailPageView viewModel={viewModel} />, { route: "/products/abcdef1234567890" })

    expect(screen.getByText("No reviews yet. Be the first to review this product!")).toBeInTheDocument()
    expect(screen.getByText("No questions yet. Be the first to ask a question!")).toBeInTheDocument()
  })
})
