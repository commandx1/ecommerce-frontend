import { createRef } from "react"
import { describe, expect, it, vi } from "vitest"
import type { SearchProduct } from "@/lib/api/product-search"
import { render, screen } from "@/test/render"
import SearchResultsDropdown from "./SearchResultsDropdown"

const product: SearchProduct = {
  productId: "p-1",
  productName: "Intra Oral Mixing Tips",
  barcode: "123456789012",
  coverPhotoPath: null,
  secureCode: "sc-1",
  manufacturerCode: "mc-1",
  userId: "u-1",
  price: 56,
  oldPrice: 70,
  discount: 20,
  stock: 10,
}

function renderDropdown(overrides: Partial<Parameters<typeof SearchResultsDropdown>[0]> = {}) {
  return render(
    <SearchResultsDropdown
      dropdownRef={createRef<HTMLDivElement>()}
      results={[product]}
      isLoading={false}
      show
      getImageSrc={() => "/placeholder.png"}
      onImageError={vi.fn()}
      onResultClick={vi.fn()}
      {...overrides}
    />,
  )
}

describe("SearchResultsDropdown", () => {
  // This panel floats over the page. It shipped with no background and no shadow, so the results
  // rendered straight on top of whatever was behind them and were unreadable - measured in the
  // browser as backgroundColor rgba(0,0,0,0) with a 602x92 result sitting inside it. Nothing in
  // the DOM assertions caught it, which is exactly why this is locked here.
  it("carries an opaque surface so the results are readable over the page", () => {
    const { container } = renderDropdown()

    const panel = container.querySelector("div.absolute")
    expect(panel).not.toBeNull()
    expect(panel?.className).toContain("bg-surface-elevated")
  })

  it("lifts off the page with a border and a shadow", () => {
    const { container } = renderDropdown()

    const panel = container.querySelector("div.absolute")
    expect(panel?.className).toContain("shadow-panel")
    expect(panel?.className).toContain("border-border-soft")
  })

  it("renders a result for each product", () => {
    renderDropdown()

    expect(screen.getByText("Intra Oral Mixing Tips")).toBeInTheDocument()
  })

  it("says so when a settled search found nothing", () => {
    renderDropdown({ results: [], isLoading: true })

    expect(screen.getByText("No results found")).toBeInTheDocument()
  })

  it("renders nothing when hidden", () => {
    // `@/test/render` wraps children in providers, so the container is never literally empty -
    // assert on the panel itself instead.
    const { container } = renderDropdown({ show: false })

    expect(container.querySelector("div.absolute")).toBeNull()
  })
})
