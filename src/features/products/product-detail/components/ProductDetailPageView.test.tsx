import { beforeEach, describe, expect, it, vi } from "vitest"
import { installRadixPointerPolyfills } from "@/test/radix"
import { render, screen } from "@/test/render"
import { buildProductDetailViewModel } from "../server/build-product-detail-view-model"
import type { ProductDetailPageData } from "../types"
import ProductDetailPageView from "./ProductDetailPageView"

installRadixPointerPolyfills()

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
    },
    userProducts: [
      { id: "up-1", vendor: "Acme Dental", price: 56, stock: 40, shipmentFee: 5 },
      { id: "up-2", vendor: "Beta Supplies", price: 60, stock: 5, shipmentFee: 0 },
    ],
  },
  questions: null,
}

const viewModel = buildProductDetailViewModel("abcdef1234567890", pageData, null)

describe("ProductDetailPageView", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
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

  it("stacks the hero, purchase, community and recommendation sections", () => {
    render(<ProductDetailPageView viewModel={viewModel} />, { route: "/products/abcdef1234567890" })

    expect(screen.getByRole("heading", { name: "Purchase Options" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Compare Suppliers & Pricing" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Product Reviews" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Questions & Answers" })).toBeInTheDocument()
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

  it("shows the product's own review and question empty states", () => {
    render(<ProductDetailPageView viewModel={viewModel} />, { route: "/products/abcdef1234567890" })

    expect(screen.getByText("No reviews yet. Be the first to review this product!")).toBeInTheDocument()
    expect(screen.getByText("No questions yet. Be the first to ask a question!")).toBeInTheDocument()
  })
})
