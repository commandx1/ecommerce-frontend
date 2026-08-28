import { beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen } from "@/test/render"

const mockGetProductDetailPageData = vi.fn()
const mockGetProductReviews = vi.fn()
vi.mock("@/features/products/product-detail/server/get-product-detail-page-data", () => ({
  getProductDetailPageData: (...args: unknown[]) => mockGetProductDetailPageData(...args),
  getProductReviews: (...args: unknown[]) => mockGetProductReviews(...args),
}))

const mockBuildProductDetailViewModel = vi.fn()
vi.mock("@/features/products/product-detail/server/build-product-detail-view-model", () => ({
  buildProductDetailViewModel: (...args: unknown[]) => mockBuildProductDetailViewModel(...args),
}))

vi.mock("@/features/products/product-detail/components/ProductDetailPageView", () => ({
  default: ({ viewModel }: { viewModel: { productName: string } }) => (
    <div data-testid="product-detail-view">{viewModel.productName}</div>
  ),
}))

const mockToastError = vi.fn()
vi.mock("@/components/ui/Toast", () => ({
  showToast: {
    error: (...args: unknown[]) => mockToastError(...args),
    success: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  },
}))

// Imported after the mocks above so it picks up the mocked modules.
const { default: ProductDetailPage } = await import("./page")

const makeProps = (overrides: { id?: string; vendorId?: string | string[] } = {}) => ({
  params: Promise.resolve({ id: overrides.id ?? "p-1" }),
  searchParams: Promise.resolve(overrides.vendorId ? { vendorId: overrides.vendorId } : {}),
})

describe("ProductDetailPage", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    mockGetProductDetailPageData.mockReset()
    mockGetProductReviews.mockReset()
    mockBuildProductDetailViewModel.mockReset()
  })

  it("renders the product view when both fetches and the view-model build succeed", async () => {
    mockGetProductDetailPageData.mockResolvedValue({ productData: { product: { id: "p-1" } }, questions: null })
    mockGetProductReviews.mockResolvedValue(null)
    mockBuildProductDetailViewModel.mockReturnValue({ productName: "Intra Oral Mixing Tips" })

    const element = await ProductDetailPage(makeProps())
    render(element)

    expect(screen.getByTestId("product-detail-view")).toHaveTextContent("Intra Oral Mixing Tips")
  })

  it("shows a friendly error screen, not a crash, when the product fetch throws", async () => {
    mockGetProductDetailPageData.mockRejectedValue(new Error("Product not found. The product may have been removed."))
    mockGetProductReviews.mockResolvedValue(null)

    const element = await ProductDetailPage(makeProps())
    render(element)

    expect(screen.getByText("Product not found. The product may have been removed.")).toBeInTheDocument()
    expect(screen.queryByTestId("product-detail-view")).not.toBeInTheDocument()
  })

  it("falls back to a generic message when a thrown error carries no message", async () => {
    // Hostile-data edge: something that isn't an Error instance at all (e.g. a rejected
    // promise from a mocked/misbehaving dependency) must still render, not crash.
    mockGetProductDetailPageData.mockRejectedValue("not an Error instance")
    mockGetProductReviews.mockResolvedValue(null)

    const element = await ProductDetailPage(makeProps())
    render(element)

    expect(screen.getByText("An unexpected error occurred")).toBeInTheDocument()
  })

  it("also shows the error screen when only the reviews fetch throws", async () => {
    // Promise.all rejects as soon as either fetch rejects, even if the product fetch succeeded.
    mockGetProductDetailPageData.mockResolvedValue({ productData: { product: { id: "p-1" } }, questions: null })
    mockGetProductReviews.mockRejectedValue(new Error("Server error occurred. Please try again later."))

    const element = await ProductDetailPage(makeProps())
    render(element)

    expect(screen.getByText("Server error occurred. Please try again later.")).toBeInTheDocument()
  })

  it("takes the first vendorId when the URL repeats the query param", async () => {
    mockGetProductDetailPageData.mockResolvedValue({ productData: { product: { id: "p-1" } }, questions: null })
    mockGetProductReviews.mockResolvedValue(null)
    mockBuildProductDetailViewModel.mockReturnValue({ productName: "Item" })

    await ProductDetailPage(makeProps({ vendorId: ["up-1", "up-2"] }))

    expect(mockGetProductReviews).toHaveBeenCalledWith("p-1", "up-1")
    expect(mockBuildProductDetailViewModel).toHaveBeenCalledWith("p-1", expect.any(Object), null, "up-1")
  })

  it("passes no vendorId through when the URL names none", async () => {
    mockGetProductDetailPageData.mockResolvedValue({ productData: { product: { id: "p-1" } }, questions: null })
    mockGetProductReviews.mockResolvedValue(null)
    mockBuildProductDetailViewModel.mockReturnValue({ productName: "Item" })

    await ProductDetailPage(makeProps())

    expect(mockGetProductReviews).toHaveBeenCalledWith("p-1", undefined)
  })
})
