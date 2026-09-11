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

  // A11y: this icon-only link had no accessible name at all (axe `link-name`,
  // 4 nodes on `/` - the 4 trending-product cards share this component).
  // aria-label must name the product, not just say "link"/"view".
  it("gives the icon-only preview link an accessible name that names the product", () => {
    render(<ProductCard data={makeData({ name: "Intra Oral Mixing Tips" })} />)

    expect(screen.getByRole("link", { name: "View Intra Oral Mixing Tips details" })).toHaveAttribute(
      "href",
      "/products/p-1",
    )
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

  // The favourite and compare controls were removed (27 Aug 2026, user decision): both were
  // handler-less, so a shopper clicking them got a silent no-op. A control that cannot work is
  // worse than no control. This test is the guard against either one reappearing unwired - for
  // data WITHOUT `favoriteProductId` (the favorite heart is opt-in per card, see the sibling
  // test below for the case where it is set).
  it("does not render a favorites button when favoriteProductId is not set", () => {
    render(<ProductCard data={makeData()} />)

    expect(screen.queryByRole("button", { name: /favorites/i })).not.toBeInTheDocument()
    // The detail link (Eye icon) is a real <a>, so the only button left is Add to Cart.
    expect(screen.getAllByRole("button")).toHaveLength(1)
  })

  it("renders a favorites button when favoriteProductId is set", () => {
    render(<ProductCard data={makeData({ favoriteProductId: "p-1" })} />)

    expect(screen.getByRole("button", { name: "Save to favorites" })).toBeInTheDocument()
  })

  // Add to Cart is still unwired. Unlike favourite/compare it is a core catalogue action, so it
  // is being wired rather than removed - the shape of that (which vendor, what quantity) is a
  // product decision the user is taking separately. Deliberately left as a visible gap.
  it.todo("adds the product to the cart when Add to Cart is clicked")
})
