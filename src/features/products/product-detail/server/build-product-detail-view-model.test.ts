import { describe, expect, it } from "vitest"
import type { ProductDetailPageData, ReviewsResponse } from "@/features/products/product-detail/types"
import { buildProductDetailViewModel } from "./build-product-detail-view-model"

const emptyQuestions: ProductDetailPageData["questions"] = {
  content: [],
  pageable: {
    pageNumber: 0,
    pageSize: 10,
    sort: { empty: true, sorted: false, unsorted: true },
    offset: 0,
    paged: true,
    unpaged: false,
  },
  last: true,
  totalPages: 0,
  totalElements: 0,
  size: 10,
  number: 0,
  sort: { empty: true, sorted: false, unsorted: true },
  numberOfElements: 0,
  first: true,
  empty: true,
}

function makeData(overrides: Partial<ProductDetailPageData["productData"]["product"]> = {}): ProductDetailPageData {
  return {
    productData: {
      product: {
        id: "abcdef1234567890",
        name: "Intra Oral Mixing Tips",
        price: 56,
        ...overrides,
      },
      userProducts: [],
    },
    questions: emptyQuestions,
  }
}

describe("buildProductDetailViewModel", () => {
  it("builds the productId, sku, and category from the product and route id", () => {
    const data = makeData({ primaryMarket: "Impression Materials" })
    const vm = buildProductDetailViewModel("abcdef1234567890", data, null)

    expect(vm.productId).toBe("abcdef1234567890")
    expect(vm.productHero.sku).toBe("ABCDEF12")
    expect(vm.productCategory).toBe("Impression Materials")
  })

  it('falls back productCategory to "Products" when primaryMarket is missing', () => {
    const data = makeData()
    const vm = buildProductDetailViewModel("abcdef1234567890", data, null)
    expect(vm.productCategory).toBe("Products")
  })

  it("derives a positive relatedProductSeed from the first 8 hex chars of the id", () => {
    const data = makeData()
    const vm = buildProductDetailViewModel("abcdef1234567890", data, null)
    expect(vm.relatedProductSeed).toBe(0xabcdef12)
    expect(vm.relatedProductSeed).toBeGreaterThan(0)
  })

  it("falls back relatedProductSeed to 1 when the id does not parse to a positive hex number", () => {
    const data = makeData()
    const vm = buildProductDetailViewModel("zzzzzzzz", data, null)
    expect(vm.relatedProductSeed).toBe(1)
  })

  it("defaults productName and productPrice for missing fields", () => {
    const data = makeData({ name: undefined as unknown as string, price: undefined as unknown as number })
    const vm = buildProductDetailViewModel("abcdef1234567890", data, null)
    expect(vm.productName).toBe("")
    expect(vm.productPrice).toBe(0)
  })

  it("resolves the placeholder image when there are no photos at all", () => {
    const data = makeData()
    const vm = buildProductDetailViewModel("abcdef1234567890", data, null)
    expect(vm.productHero.mainImage).toBe("/dentypro-product-placeholder.png")
    expect(vm.productHero.thumbnailImages).toEqual([])
  })

  it("resolves the main image and thumbnails from the cover photo and gallery", () => {
    const data = makeData({ coverPhotoPath: "/uploads/cover.png", photoPhats: ["/uploads/a.png"] })
    const vm = buildProductDetailViewModel("abcdef1234567890", data, null)
    expect(vm.productHero.mainImage).toBe("/api/images/uploads/cover.png")
    expect(vm.productHero.thumbnailImages).toEqual(["/api/images/uploads/cover.png", "/api/images/uploads/a.png"])
  })

  it("marks dentalLicenseRequired true only for the exact string Yes", () => {
    const data = makeData({ dentalLicenseRequired: "Yes" })
    const vm = buildProductDetailViewModel("abcdef1234567890", data, null)
    expect(vm.productHero.dentalLicenseRequired).toBe(true)
  })

  it("marks dentalLicenseRequired false for any other value", () => {
    const data = makeData({ dentalLicenseRequired: "yes" })
    const vm = buildProductDetailViewModel("abcdef1234567890", data, null)
    expect(vm.productHero.dentalLicenseRequired).toBe(false)
  })

  it("always sets the hero badge to Available", () => {
    const data = makeData()
    const vm = buildProductDetailViewModel("abcdef1234567890", data, null)
    expect(vm.productHero.badge).toBe("Available")
  })

  it("passes through reviews and reviewsUserProductId as given", () => {
    const data = makeData()
    const reviews = { content: [] } as unknown as ReviewsResponse
    const vm = buildProductDetailViewModel("abcdef1234567890", data, reviews, "up-9")
    expect(vm.reviews).toBe(reviews)
    expect(vm.reviewsUserProductId).toBe("up-9")
  })

  it("passes through a null reviews payload", () => {
    const data = makeData()
    const vm = buildProductDetailViewModel("abcdef1234567890", data, null)
    expect(vm.reviews).toBeNull()
    expect(vm.reviewsUserProductId).toBeUndefined()
  })

  it("maps userProducts to the vendors list, defaulting missing vendor names to Vendor", () => {
    const data: ProductDetailPageData = {
      productData: {
        product: { id: "abcdef1234567890", name: "Item", price: 10 },
        userProducts: [
          { id: "up-1", vendor: "Acme", price: 10, stock: 5 },
          { id: "up-2", price: 12, stock: 0 },
        ],
      },
      questions: emptyQuestions,
    }
    const vm = buildProductDetailViewModel("abcdef1234567890", data, null)
    expect(vm.vendors).toEqual([
      { id: "up-1", vendor: "Acme" },
      { id: "up-2", vendor: "Vendor" },
    ])
  })

  it("defaults userProducts/vendors/suppliers to empty when userProducts is undefined", () => {
    const data: ProductDetailPageData = {
      productData: { product: { id: "abcdef1234567890", name: "Item", price: 10 } },
      questions: emptyQuestions,
    }
    const vm = buildProductDetailViewModel("abcdef1234567890", data, null)
    expect(vm.vendors).toEqual([])
    expect(vm.suppliers).toEqual([])
    expect(vm.bestPriceVendorUserProductId).toBeNull()
  })

  it("passes the questions payload through untouched", () => {
    const data = makeData()
    const vm = buildProductDetailViewModel("abcdef1234567890", data, null)
    expect(vm.questions).toBe(emptyQuestions)
  })
})
