import { beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen } from "@/test/render"
import ProductCard, { type ProductCardData } from "./ProductCard"

const makeData = (overrides: Partial<ProductCardData> = {}): ProductCardData => ({
  id: "p-1",
  name: "Intra Oral Mixing Tips",
  brand: "MARK3",
  imageSrc: "/uploads/tips.png",
  price: 56,
  oldPrice: 70,
  overallStar: 4.5,
  reviewCount: 12,
  stock: 40,
  href: "/products/p-1",
  ...overrides,
})

describe("ProductCard", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it("links the title and the preview action to the product detail page", () => {
    render(<ProductCard data={makeData({ href: "/products/p-9" })} />)

    for (const link of screen.getAllByRole("link")) {
      expect(link).toHaveAttribute("href", "/products/p-9")
    }
  })

  it("computes the saving from the old price", () => {
    render(<ProductCard data={makeData({ price: 75, oldPrice: 100 })} />)

    expect(screen.getByText("Save 25%")).toBeInTheDocument()
    expect(screen.getByText("$100.00")).toBeInTheDocument()
  })

  it("hides the saving badge when the old price is not higher", () => {
    render(<ProductCard data={makeData({ price: 100, oldPrice: 100 })} />)

    expect(screen.queryByText(/^Save /)).not.toBeInTheDocument()
    expect(screen.getByText("$100.00")).toBeInTheDocument()
  })

  it("reports availability from the stock count", () => {
    render(<ProductCard data={makeData({ stock: 0 })} />)

    expect(screen.getByText("Out of Stock")).toBeInTheDocument()
    expect(screen.queryByText("In Stock")).not.toBeInTheDocument()
  })

  it("omits the availability badge entirely when stock is unknown", () => {
    render(<ProductCard data={makeData({ stock: undefined })} />)

    expect(screen.queryByText("In Stock")).not.toBeInTheDocument()
    expect(screen.queryByText("Out of Stock")).not.toBeInTheDocument()
  })

  it("shows the rating to one decimal with its review count", () => {
    render(<ProductCard data={makeData({ overallStar: 4.25, reviewCount: 8 })} />)

    expect(screen.getByText("4.3 (8 reviews)")).toBeInTheDocument()
  })

  it("falls back to a generic supplier phrase without a brand", () => {
    render(<ProductCard data={makeData({ brand: null })} />)

    expect(screen.getByText(/from verified supplier/i)).toBeInTheDocument()
    expect(screen.queryByText("MARK3")).not.toBeInTheDocument()
  })

  // FIX: the price now goes through `formatCurrency` instead of a raw `toFixed(2)`, so
  // four-figure prices keep their thousands separator ("$1,234.50" instead of "$1234.50") —
  // consistent with the other price surfaces in the app.
  it("renders a four-figure price with a thousands separator", () => {
    render(<ProductCard data={makeData({ price: 1234.5, oldPrice: null })} />)

    expect(screen.getByText("$1,234.50")).toBeInTheDocument()
    expect(screen.queryByText("$1234.50")).not.toBeInTheDocument()
  })

  // BULGU: "Add to Cart", "Add to favorites" and the compare button carry no handler at all —
  // clicking them is a silent no-op for the shopper.
  it("renders inert Add to Cart / favourite / compare controls (current behaviour)", () => {
    render(<ProductCard data={makeData()} />)

    expect(screen.getByRole("button", { name: "Add to Cart" })).toBeEnabled()
    expect(screen.getByRole("button", { name: "Add to favorites" })).toBeEnabled()
    expect(screen.getAllByRole("button")).toHaveLength(3)
  })
})
