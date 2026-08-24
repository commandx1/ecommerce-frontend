import { describe, expect, it } from "vitest"
import type { ProductDetailPageData } from "@/features/products/product-detail/types"
import { buildProductDetailMetadata, FALLBACK_PRODUCT_DETAIL_METADATA } from "./build-product-detail-metadata"

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
      product: { id: "p-1", name: "Intra Oral Mixing Tips", price: 56, ...overrides },
      userProducts: [],
    },
    questions: emptyQuestions,
  }
}

describe("buildProductDetailMetadata", () => {
  it("uses the product name as the title and aboutProduct as the description", () => {
    const data = makeData({ aboutProduct: "Disposable mixing tips." })
    expect(buildProductDetailMetadata(data)).toEqual({
      title: "Intra Oral Mixing Tips",
      description: "Disposable mixing tips.",
    })
  })

  it("falls back the description to product.description when aboutProduct is missing", () => {
    const data = makeData({ description: "Long-form description." })
    expect(buildProductDetailMetadata(data).description).toBe("Long-form description.")
  })

  it("falls back the description to a generic sentence when both fields are missing", () => {
    const data = makeData()
    expect(buildProductDetailMetadata(data).description).toBe(
      "Detailed information, supplier options, and reviews for this product.",
    )
  })

  it('falls back the title to "Product Detail" when the product has no name', () => {
    const data = makeData({ name: undefined as unknown as string })
    expect(buildProductDetailMetadata(data).title).toBe("Product Detail")
  })

  it("prefers aboutProduct over description when both are present", () => {
    const data = makeData({ aboutProduct: "About wins", description: "Description loses" })
    expect(buildProductDetailMetadata(data).description).toBe("About wins")
  })
})

describe("FALLBACK_PRODUCT_DETAIL_METADATA", () => {
  it("provides a static title and description for use before data is available", () => {
    expect(FALLBACK_PRODUCT_DETAIL_METADATA).toEqual({
      title: "Product Detail",
      description: "Detailed information about this product.",
    })
  })
})
