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
  it("builds the productId and sku from the product and route id, and productCategory from the leaf category level", () => {
    const data = makeData({ categoryLevel2: "Impression Materials" })
    const vm = buildProductDetailViewModel("abcdef1234567890", data, null)

    expect(vm.productId).toBe("abcdef1234567890")
    expect(vm.productHero.sku).toBe("ABCDEF12")
    expect(vm.productCategory).toBe("Impression Materials")
  })

  it("derives productCategory and the hero category from the deepest set category level", () => {
    const data = makeData({ categoryLevel2: "Endodontic products", categoryLevel3: "Endodontic accessories" })
    const vm = buildProductDetailViewModel("abcdef1234567890", data, null)

    expect(vm.productCategory).toBe("Endodontic accessories")
    expect(vm.productHero.category).toBe("Endodontic accessories")
    expect(vm.categoryTrail).toEqual([
      {
        label: "Endodontic products",
        fullPath: "Endodontic products",
        href: `/products?${new URLSearchParams([["categories", "Endodontic products"]]).toString()}`,
      },
      {
        label: "Endodontic accessories",
        fullPath: "Endodontic products > Endodontic accessories",
        href: `/products?${new URLSearchParams([["categories", "Endodontic products > Endodontic accessories"]]).toString()}`,
      },
    ])
  })

  it('falls back productCategory to primaryMarket, or "Products", when no category levels are set', () => {
    const data = makeData({ primaryMarket: "Impression Materials" })
    let vm = buildProductDetailViewModel("abcdef1234567890", data, null)
    expect(vm.productCategory).toBe("Impression Materials")
    expect(vm.categoryTrail).toEqual([])

    vm = buildProductDetailViewModel("abcdef1234567890", makeData(), null)
    expect(vm.productCategory).toBe("Products")
    expect(vm.categoryTrail).toEqual([])
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

  // Regression: this used to compare against the exact string "Yes" and missed the backend's
  // actual "true" value, silently hiding the license notice for every gated product.
  it("marks dentalLicenseRequired true for the string true", () => {
    const data = makeData({ dentalLicenseRequired: "true" })
    const vm = buildProductDetailViewModel("abcdef1234567890", data, null)
    expect(vm.productHero.dentalLicenseRequired).toBe(true)
  })

  it("marks dentalLicenseRequired true case-insensitively for yes/1", () => {
    const data = makeData({ dentalLicenseRequired: "YES" })
    const vm = buildProductDetailViewModel("abcdef1234567890", data, null)
    expect(vm.productHero.dentalLicenseRequired).toBe(true)
  })

  it("marks dentalLicenseRequired false for any other value", () => {
    const data = makeData({ dentalLicenseRequired: "no" })
    const vm = buildProductDetailViewModel("abcdef1234567890", data, null)
    expect(vm.productHero.dentalLicenseRequired).toBe(false)
  })

  it("derives specifications and sdsUrl from the product's attributes and sds fields", () => {
    const data = makeData({
      attributes: [{ attributeName: "Packaging", attributeValue: "8.5 gram syringe" }],
      sds: "https://example.com/sds.pdf",
    })
    const vm = buildProductDetailViewModel("abcdef1234567890", data, null)
    expect(vm.specifications).toEqual([{ label: "Packaging", value: "8.5 gram syringe" }])
    expect(vm.sdsUrl).toBe("https://example.com/sds.pdf")
  })

  it("defaults specifications to [] and sdsUrl to null when attributes are absent", () => {
    const data = makeData()
    const vm = buildProductDetailViewModel("abcdef1234567890", data, null)
    expect(vm.specifications).toEqual([])
    expect(vm.sdsUrl).toBeNull()
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

  // C axis: a malformed 200 body sending `userProducts` as something other than an array
  // must not crash the SSR render of the whole product page. Same class as F77/F83/F99/F101/F104
  // — `|| []` only catches null/undefined, not a wrong-typed truthy value.
  describe("survives a malformed userProducts field (C axis)", () => {
    it.each([
      ["null", null],
      ["an object instead of an array", {}],
      ["a string instead of an array", "not-an-array"],
      ["a number instead of an array", 42],
    ])("defaults vendors/suppliers to empty when userProducts is %s", (_label, badUserProducts) => {
      const data = {
        productData: {
          product: { id: "abcdef1234567890", name: "Item", price: 10 },
          userProducts: badUserProducts,
        },
        questions: emptyQuestions,
      } as unknown as ProductDetailPageData

      let vm: ReturnType<typeof buildProductDetailViewModel> | undefined
      expect(() => {
        vm = buildProductDetailViewModel("abcdef1234567890", data, null)
      }).not.toThrow()

      expect(vm?.vendors).toEqual([])
      expect(vm?.suppliers).toEqual([])
      expect(vm?.bestPriceVendorUserProductId).toBeNull()
    })
  })

  // Impossible per backend code (not written): CustomerUserProductResponseDto.price/stock are
  // primitive `double`/`int` on the Java side, so a genuine array element can never carry a
  // null/undefined price or stock — only the array shape itself is worth guarding.

  it("does not crash when a photoPhats value is a non-iterable truthy object", () => {
    const data = makeData({ photoPhats: {} as unknown as string[] })
    expect(() => buildProductDetailViewModel("abcdef1234567890", data, null)).not.toThrow()
  })
})
