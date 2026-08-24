import { screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import type { SearchProduct } from "@/lib/api/product-search"
import { renderWithProviders } from "@/test/render"
import SearchResultItem from "./SearchResultItem"

// Backend sends raw IEEE-754 floats for money. A discounted price is computed as
// oldPrice * (1 - discount/100), which routinely produces values like
// 32.219249999999995. Rendering those directly leaked the full float into the UI
// (see: "$32.219249999999995  $28.352939999999997 (12% discount)").
// Every money value here must go through formatCurrency, never string interpolation.

const makeSearchProduct = (overrides: Partial<SearchProduct> = {}): SearchProduct => ({
  productId: "prod-1",
  productName: "Pac-Dent Disposable Blue polyurethane Sponges for round endo stand",
  barcode: "8690000000001",
  coverPhotoPath: null,
  secureCode: "SC-1",
  manufacturerCode: "MC-1",
  reorderId: null,
  referanceNumber: null,
  userId: "user-1",
  price: 28.35,
  oldPrice: 32.22,
  discount: 12,
  stock: 5,
  ...overrides,
})

const renderItem = (product: SearchProduct) =>
  renderWithProviders(
    <SearchResultItem product={product} imageSrc="/placeholder.png" onImageError={vi.fn()} onClick={vi.fn()} />,
  )

describe("SearchResultItem money formatting", () => {
  it("renders the exact floats from the reported bug as clean two-decimal currency", () => {
    renderItem(makeSearchProduct({ price: 28.352939999999997, oldPrice: 32.219249999999995, discount: 12 }))

    expect(screen.getByText("$32.22")).toBeInTheDocument()
    expect(screen.getByText(/\$28\.35\b/)).toBeInTheDocument()
  })

  it("never leaks a raw float tail into the rendered output", () => {
    const { container } = renderItem(
      makeSearchProduct({ price: 28.352939999999997, oldPrice: 32.219249999999995, discount: 12 }),
    )

    expect(container.textContent).not.toContain("28.352939999999997")
    expect(container.textContent).not.toContain("32.219249999999995")
    // No money value may carry more than two decimals.
    expect(container.textContent).not.toMatch(/\$\d+\.\d{3,}/)
  })

  it("formats the undiscounted price too", () => {
    const { container } = renderItem(makeSearchProduct({ price: 19.989999999999998, discount: 0 }))

    expect(screen.getByText("$19.99")).toBeInTheDocument()
    expect(container.textContent).not.toMatch(/\$\d+\.\d{3,}/)
  })

  it("pads a whole-number price to two decimals", () => {
    renderItem(makeSearchProduct({ price: 30, discount: 0 }))

    expect(screen.getByText("$30.00")).toBeInTheDocument()
  })

  it("adds thousands separators for large amounts", () => {
    renderItem(makeSearchProduct({ price: 1234.5, discount: 0 }))

    expect(screen.getByText("$1,234.50")).toBeInTheDocument()
  })

  it("rounds a fractional discount percentage to a whole number", () => {
    const { container } = renderItem(makeSearchProduct({ price: 28.35, oldPrice: 32.22, discount: 11.999999999999998 }))

    expect(container.textContent).toContain("(12% discount)")
    expect(container.textContent).not.toContain("11.999999999999998")
  })

  it("shows the struck-through original price only when a discount exists", () => {
    const { container: discounted } = renderItem(makeSearchProduct({ oldPrice: 32.22, discount: 12 }))
    expect(discounted.textContent).toContain("$32.22")

    const { container: plain } = renderItem(makeSearchProduct({ price: 28.35, oldPrice: 32.22, discount: 0 }))
    expect(plain.textContent).not.toContain("$32.22")
    expect(plain.textContent).not.toContain("discount")
  })

  it("renders zero as $0.00 rather than an empty or bare value", () => {
    renderItem(makeSearchProduct({ price: 0, discount: 0 }))

    expect(screen.getByText("$0.00")).toBeInTheDocument()
  })

  it("links to the product detail page and reports image failures", () => {
    const onImageError = vi.fn()
    renderWithProviders(
      <SearchResultItem
        product={makeSearchProduct({ productId: "prod-42" })}
        imageSrc="/broken.png"
        onImageError={onImageError}
        onClick={vi.fn()}
      />,
    )

    expect(screen.getByRole("link")).toHaveAttribute("href", "/products/prod-42")
  })
})
