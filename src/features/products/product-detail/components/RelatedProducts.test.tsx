import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@/test/render"
import type { CategoryCrumb } from "../types"
import RelatedProducts from "./RelatedProducts"

const mockResolveRelatedProducts = vi.fn()

vi.mock("../server/resolve-related-products", () => ({
  resolveRelatedProducts: (...args: unknown[]) => mockResolveRelatedProducts(...args),
}))

vi.mock("@/features/products/listing/components/listing/ProductCard", () => ({
  default: ({ data }: { data: { name: string } }) => <div data-testid="product-card">{data.name}</div>,
}))

function crumb(label: string, fullPath: string): CategoryCrumb {
  return { label, fullPath, href: `/products?categories=${encodeURIComponent(fullPath)}` }
}

describe("RelatedProducts", () => {
  it("renders nothing when the resolver finds no related products", async () => {
    mockResolveRelatedProducts.mockResolvedValueOnce([])

    const ui = await RelatedProducts({ productId: "p-1", categoryTrail: [] })

    expect(ui).toBeNull()
  })

  it("renders a card per resolved item and links View All at the root category", async () => {
    mockResolveRelatedProducts.mockResolvedValueOnce([
      { productId: "p-2", productName: "Related Sealer Two", price: 56 },
      { productId: "p-3", productName: "Related Sealer Three", price: 60 },
    ])
    const categoryTrail = [
      crumb("Endodontic products", "Endodontic products"),
      crumb("Endodontic sealers & cements", "Endodontic products > Endodontic sealers & cements"),
    ]

    const ui = await RelatedProducts({ productId: "p-1", categoryTrail })
    expect(ui).not.toBeNull()
    render(ui as NonNullable<typeof ui>)

    expect(screen.getByRole("heading", { name: "Related Products" })).toBeInTheDocument()
    const cards = screen.getAllByTestId("product-card")
    expect(cards.map((card) => card.textContent)).toEqual(["Related Sealer Two", "Related Sealer Three"])

    const link = screen.getByRole("link", { name: /View All Endodontic products/ })
    expect(link).toHaveAttribute("href", categoryTrail[0]!.href)

    expect(mockResolveRelatedProducts).toHaveBeenCalledWith({
      productId: "p-1",
      leafCategoryPath: "Endodontic products > Endodontic sealers & cements",
    })
  })

  it("falls back to the generic Products link when there is no category trail", async () => {
    mockResolveRelatedProducts.mockResolvedValueOnce([
      { productId: "p-2", productName: "Related Sealer Two", price: 56 },
    ])

    const ui = await RelatedProducts({ productId: "p-1", categoryTrail: [] })
    expect(ui).not.toBeNull()
    render(ui as NonNullable<typeof ui>)

    const link = screen.getByRole("link", { name: /View All Products/ })
    expect(link).toHaveAttribute("href", "/products")

    expect(mockResolveRelatedProducts).toHaveBeenCalledWith({
      productId: "p-1",
      leafCategoryPath: undefined,
    })
  })
})
