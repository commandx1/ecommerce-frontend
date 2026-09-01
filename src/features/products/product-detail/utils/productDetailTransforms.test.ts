import { describe, expect, it } from "vitest"
import type { ProductDetail, UserProduct } from "../types"
import {
  buildPhotoPaths,
  buildSpecifications,
  buildSuppliers,
  buildThumbnailImages,
  resolveBestPriceVendorUserProductId,
  resolveDentalLicenseRequired,
  resolveMainImage,
  resolveSdsUrl,
} from "./productDetailTransforms"

const baseProduct: ProductDetail = {
  id: "prod-12345678",
  name: "Intra Oral Mixing Tips",
  price: 56,
}

const baseUserProduct: UserProduct = {
  id: "up-1",
  vendor: "Acme Dental",
  price: 56,
  stock: 40,
}

describe("buildPhotoPaths", () => {
  it("puts the cover photo first, ahead of the gallery paths", () => {
    const product: ProductDetail = { ...baseProduct, coverPhotoPath: "/cover.png", photoPhats: ["/a.png", "/b.png"] }
    expect(buildPhotoPaths(product)).toEqual(["/cover.png", "/a.png", "/b.png"])
  })

  it("returns just the gallery paths when there is no cover photo", () => {
    const product: ProductDetail = { ...baseProduct, photoPhats: ["/a.png"] }
    expect(buildPhotoPaths(product)).toEqual(["/a.png"])
  })

  it("returns an empty array when neither cover photo nor gallery paths exist", () => {
    expect(buildPhotoPaths(baseProduct)).toEqual([])
  })

  it("returns just the cover photo when there are no gallery paths", () => {
    const product: ProductDetail = { ...baseProduct, coverPhotoPath: "/cover.png" }
    expect(buildPhotoPaths(product)).toEqual(["/cover.png"])
  })

  // C axis: a malformed 200 body sending photoPhats as a truthy non-array (not iterable, e.g.
  // an object) previously crashed `[...product.photoPhats]` and took down the whole SSR render.
  it.each([
    ["an object", { foo: "bar" }],
    ["a number", 42],
    // A string is iterable, so it never threw, but it must not be spread into one bogus
    // "image path" per character either.
    ["a string", "not-an-array"],
  ])("falls back to no gallery paths when photoPhats is %s instead of an array", (_label, badPhotoPhats) => {
    const product = { ...baseProduct, photoPhats: badPhotoPhats } as unknown as ProductDetail
    expect(() => buildPhotoPaths(product)).not.toThrow()
    expect(buildPhotoPaths(product)).toEqual([])
  })
})

describe("buildThumbnailImages", () => {
  it("maps each photo path through getFullImageUrl", () => {
    expect(buildThumbnailImages(["/uploads/a.png", "/uploads/b.png"])).toEqual([
      "/api/images/uploads/a.png",
      "/api/images/uploads/b.png",
    ])
  })

  it("returns an empty array for an empty photo path list", () => {
    expect(buildThumbnailImages([])).toEqual([])
  })
})

describe("resolveMainImage", () => {
  it("prefers the cover photo over the first gallery path", () => {
    const product: ProductDetail = { ...baseProduct, coverPhotoPath: "/uploads/cover.png" }
    expect(resolveMainImage(product, ["/uploads/other.png"])).toBe("/api/images/uploads/cover.png")
  })

  it("falls back to the first photo path when there is no cover photo", () => {
    expect(resolveMainImage(baseProduct, ["/uploads/first.png"])).toBe("/api/images/uploads/first.png")
  })

  it("falls back to the placeholder image when there is no cover photo and no paths", () => {
    expect(resolveMainImage(baseProduct, [])).toBe("/dentypro-product-placeholder.png")
  })
})

describe("buildSpecifications", () => {
  it("keeps the backend order of attribute rows", () => {
    const product: ProductDetail = {
      ...baseProduct,
      attributes: [
        { attributeName: "Packaging", attributeValue: "8.5 gram syringe" },
        { attributeName: "Type", attributeValue: "Adhesive resin cement" },
      ],
    }
    expect(buildSpecifications(product)).toEqual([
      { label: "Packaging", value: "8.5 gram syringe" },
      { label: "Type", value: "Adhesive resin cement" },
    ])
  })

  it("drops rows with a null or empty attributeValue", () => {
    const product: ProductDetail = {
      ...baseProduct,
      attributes: [
        { attributeName: "Packaging", attributeValue: null },
        { attributeName: "Type", attributeValue: "" },
        { attributeName: "Color", attributeValue: "Shade A2" },
      ],
    }
    expect(buildSpecifications(product)).toEqual([{ label: "Color", value: "Shade A2" }])
  })

  it("drops rows with an empty attributeName", () => {
    const product: ProductDetail = {
      ...baseProduct,
      attributes: [{ attributeName: "  ", attributeValue: "Some value" }],
    }
    expect(buildSpecifications(product)).toEqual([])
  })

  it("returns an empty array when there are no attributes", () => {
    expect(buildSpecifications(baseProduct)).toEqual([])
  })

  // C axis: a malformed 200 body sending `attributes` as a truthy non-array must not crash the
  // page render - same class as buildPhotoPaths' photoPhats guard above.
  it.each([
    ["an object", { foo: "bar" }],
    ["a string", "not-an-array"],
    ["a number", 42],
  ])("returns an empty array without throwing when attributes is %s instead of an array", (_label, badAttributes) => {
    const product = { ...baseProduct, attributes: badAttributes } as unknown as ProductDetail
    expect(() => buildSpecifications(product)).not.toThrow()
    expect(buildSpecifications(product)).toEqual([])
  })
})

describe("resolveSdsUrl", () => {
  it("returns an https:// SDS link as-is", () => {
    const product: ProductDetail = { ...baseProduct, sds: "https://example.com/sds.pdf" }
    expect(resolveSdsUrl(product)).toBe("https://example.com/sds.pdf")
  })

  it("returns an http:// SDS link as-is", () => {
    const product: ProductDetail = { ...baseProduct, sds: "http://example.com/sds.pdf" }
    expect(resolveSdsUrl(product)).toBe("http://example.com/sds.pdf")
  })

  it("returns null when sds is missing", () => {
    expect(resolveSdsUrl(baseProduct)).toBeNull()
  })

  it("returns null when sds is an empty string", () => {
    expect(resolveSdsUrl({ ...baseProduct, sds: "" })).toBeNull()
  })

  it("returns null when sds is not a URL", () => {
    expect(resolveSdsUrl({ ...baseProduct, sds: "SDS-001" })).toBeNull()
  })
})

describe("resolveDentalLicenseRequired", () => {
  it.each(["true", "True", "TRUE", "yes", "1"])("treats %s as license required", (value) => {
    expect(resolveDentalLicenseRequired(value)).toBe(true)
  })

  it.each(["false", "", null, undefined])("treats %s as license not required", (value) => {
    expect(resolveDentalLicenseRequired(value)).toBe(false)
  })
})

describe("resolveBestPriceVendorUserProductId", () => {
  it("returns the product's explicit bestPriceVendorUserProductId when set", () => {
    const product: ProductDetail = { ...baseProduct, bestPriceVendorUserProductId: "up-explicit" }
    expect(resolveBestPriceVendorUserProductId(product, [baseUserProduct])).toBe("up-explicit")
  })

  it("returns null when there are no user products and no explicit id", () => {
    expect(resolveBestPriceVendorUserProductId(baseProduct, [])).toBeNull()
  })

  it("picks the cheapest user product's id when no explicit id is set", () => {
    const cheap: UserProduct = { ...baseUserProduct, id: "up-cheap", price: 10 }
    const expensive: UserProduct = { ...baseUserProduct, id: "up-expensive", price: 99 }
    expect(resolveBestPriceVendorUserProductId(baseProduct, [expensive, cheap])).toBe("up-cheap")
  })

  it("falls back to null if the cheapest user product has a nullish id", () => {
    const noId: UserProduct = { ...baseUserProduct, id: undefined as unknown as string, price: 5 }
    expect(resolveBestPriceVendorUserProductId(baseProduct, [noId])).toBeNull()
  })
})

describe("buildSuppliers", () => {
  it("returns an empty list when there are no user products", () => {
    expect(buildSuppliers([], null)).toEqual([])
  })

  it("builds a single supplier entry, formatting the price as $1,234.56-style currency", () => {
    const up: UserProduct = { ...baseUserProduct, id: "up-1", price: 1234.56 }
    const [supplier] = buildSuppliers([up], null)
    expect(supplier.price).toBe("$1,234.56")
    expect(supplier.id).toBe(1)
    expect(supplier.userProductId).toBe("up-1")
  })

  it("marks the best-price vendor's listing with the Best Seller badge and others as Verified", () => {
    const cheap: UserProduct = { ...baseUserProduct, id: "up-cheap", price: 10 }
    const expensive: UserProduct = { ...baseUserProduct, id: "up-expensive", price: 20 }
    const suppliers = buildSuppliers([expensive, cheap], "up-cheap")
    const byId = Object.fromEntries(suppliers.map((s) => [s.userProductId, s]))
    expect(byId["up-cheap"].badge).toBe("Best Seller")
    expect(byId["up-expensive"].badge).toBe("Verified")
  })

  it("sorts suppliers by ascending price", () => {
    const cheap: UserProduct = { ...baseUserProduct, id: "up-cheap", price: 10 }
    const expensive: UserProduct = { ...baseUserProduct, id: "up-expensive", price: 20 }
    const suppliers = buildSuppliers([expensive, cheap], null)
    expect(suppliers.map((s) => s.userProductId)).toEqual(["up-cheap", "up-expensive"])
  })

  it("marks an out-of-stock listing as Out of Stock with a gray stock color", () => {
    const outOfStock: UserProduct = { ...baseUserProduct, stock: 0 }
    const [supplier] = buildSuppliers([outOfStock], null)
    expect(supplier.stock).toBe("Out of Stock")
    expect(supplier.stockColor).toBe("gray")
    expect(supplier.stockCount).toBe(0)
  })

  it("marks an in-stock listing as In Stock with a green stock color", () => {
    const inStock: UserProduct = { ...baseUserProduct, stock: 12 }
    const [supplier] = buildSuppliers([inStock], null)
    expect(supplier.stock).toBe("In Stock")
    expect(supplier.stockColor).toBe("green")
  })

  it("falls back to Vendor / <Vendor> logo for missing vendor and vendorLogo fields", () => {
    const up: UserProduct = { ...baseUserProduct, vendor: undefined, vendorLogo: undefined }
    const [supplier] = buildSuppliers([up], null)
    expect(supplier.name).toBe("Vendor")
    expect(supplier.alt).toBe("Vendor logo")
    expect(supplier.logo).toBeUndefined()
  })

  it("omits originalPrice when oldPrice equals the current price", () => {
    const up: UserProduct = { ...baseUserProduct, price: 56, oldPrice: 56 }
    const [supplier] = buildSuppliers([up], null)
    expect(supplier.originalPrice).toBeNull()
  })

  it("includes originalPrice when oldPrice differs from the current price", () => {
    const up: UserProduct = { ...baseUserProduct, price: 56, oldPrice: 70 }
    const [supplier] = buildSuppliers([up], null)
    expect(supplier.originalPrice).toBe("$70.00")
  })

  it("defaults discount to 0 when not a number", () => {
    const up: UserProduct = { ...baseUserProduct, discount: undefined }
    const [supplier] = buildSuppliers([up], null)
    expect(supplier.discount).toBe(0)
  })

  it('reports "Free" shipping when shipmentFee and heavyShippingSurcharge are both zero/missing', () => {
    const up: UserProduct = { ...baseUserProduct, shipmentFee: undefined, heavyShippingSurcharge: undefined }
    const [supplier] = buildSuppliers([up], null)
    expect(supplier.shipping).toBe("Free")
    expect(supplier.shippingFee).toBe("Free")
    expect(supplier.heavyShippingFee).toBe("Free")
  })

  it("sums shipmentFee and heavyShippingSurcharge into the total shipping cost", () => {
    const up: UserProduct = { ...baseUserProduct, shipmentFee: 5, heavyShippingSurcharge: 2.5 }
    const [supplier] = buildSuppliers([up], null)
    expect(supplier.shipping).toBe("$7.50")
    expect(supplier.shippingFee).toBe("$5.00")
    expect(supplier.heavyShippingFee).toBe("$2.50")
  })

  it("defaults rating and reviewCount to 0 when missing", () => {
    const up: UserProduct = { ...baseUserProduct, vendorRating: undefined, vendorReviewCount: undefined }
    const [supplier] = buildSuppliers([up], null)
    expect(supplier.rating).toBe(0)
    expect(supplier.reviewCount).toBe(0)
  })
})
