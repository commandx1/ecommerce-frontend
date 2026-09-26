import { describe, expect, it } from "vitest"
import { render, screen } from "@/test/render"
import type { ProductHeroViewModel, SupplierViewModel } from "../types"
import ProductHeroDetails from "./ProductHeroDetails"

const product: ProductHeroViewModel = {
  productId: "p-1",
  title: "Dental Kit",
  description: "A kit",
  category: "Kits",
  bestPriceVendor: "Acme Dental",
  price: 56,
  rating: 4.5,
  reviewCount: 12,
  sku: "SKU-1",
  mainImage: "/image.png",
  thumbnailImages: [],
  dentalLicenseRequired: false,
}

const makeSupplier = (overrides: Partial<SupplierViewModel> = {}): SupplierViewModel => ({
  id: 1,
  userProductId: "up-1",
  name: "Acme Dental",
  alt: "Acme Dental logo",
  badge: "Verified",
  price: "$56.00",
  originalPrice: null,
  discount: 0,
  stock: "In Stock",
  stockColor: "green",
  stockCount: 40,
  shipping: "$5.00",
  shippingFee: "$5.00",
  heavyShippingFee: "$0.00",
  hasHeavyShippingFee: false,
  rating: 4.5,
  reviewCount: 12,
  uberDirectEligible: false,
  ...overrides,
})

describe("ProductHeroDetails", () => {
  it("hides the heavy shipping badge when the selected supplier has no heavy fee", () => {
    render(<ProductHeroDetails product={product} selectedSupplier={makeSupplier({ hasHeavyShippingFee: false })} />)

    expect(screen.queryByText(/Heavy shipping:/)).not.toBeInTheDocument()
  })

  it("shows the heavy shipping badge when the selected supplier has a positive heavy fee", () => {
    render(
      <ProductHeroDetails
        product={product}
        selectedSupplier={makeSupplier({ hasHeavyShippingFee: true, heavyShippingFee: "$20.00" })}
      />,
    )

    expect(screen.getByText(/Heavy shipping:/)).toBeInTheDocument()
    expect(screen.getByText("$20.00")).toBeInTheDocument()
  })
})
