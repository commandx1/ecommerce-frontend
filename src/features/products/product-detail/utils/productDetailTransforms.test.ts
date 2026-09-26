import { describe, expect, it } from "vitest"
import { defined } from "@/test/defined"
import type { ProductDetail, UserProduct } from "../types"
import {
  buildCategoryTrail,
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

describe("buildCategoryTrail", () => {
  it("builds a 2-level trail", () => {
    const product: ProductDetail = {
      ...baseProduct,
      categoryLevel1: "Dental Supplies",
      categoryLevel2: "Cements, liners & adhesives",
      categoryLevel3: "Cement",
    }
    expect(buildCategoryTrail(product)).toEqual([
      {
        label: "Cements, liners & adhesives",
        fullPath: "Cements, liners & adhesives",
        href: `/products?${new URLSearchParams([["categories", "Cements, liners & adhesives"]]).toString()}`,
      },
      {
        label: "Cement",
        fullPath: "Cements, liners & adhesives > Cement",
        href: `/products?${new URLSearchParams([["categories", "Cements, liners & adhesives > Cement"]]).toString()}`,
      },
    ])
  })

  it("builds a 3-level trail", () => {
    const product: ProductDetail = {
      ...baseProduct,
      categoryLevel1: "Dental Supplies",
      categoryLevel2: "Endodontic products",
      categoryLevel3: "Endodontic accessories",
      categoryLevel4: "Endo organizers & accessories",
    }
    const trail = buildCategoryTrail(product)
    expect(trail).toHaveLength(3)
    expect(trail.map((crumb) => crumb.label)).toEqual([
      "Endodontic products",
      "Endodontic accessories",
      "Endo organizers & accessories",
    ])
    expect(trail[2]!.fullPath).toBe("Endodontic products > Endodontic accessories > Endo organizers & accessories")
  })

  it("trims whitespace around level values", () => {
    const product: ProductDetail = {
      ...baseProduct,
      categoryLevel2: "  Cements, liners & adhesives  ",
      categoryLevel3: "  Cement  ",
    }
    const trail = buildCategoryTrail(product)
    expect(trail.map((crumb) => crumb.label)).toEqual(["Cements, liners & adhesives", "Cement"])
  })

  it("stops at the first missing level, ignoring deeper levels set out of order", () => {
    const product: ProductDetail = {
      ...baseProduct,
      categoryLevel2: "Endodontic products",
      categoryLevel3: "",
      categoryLevel4: "Endo organizers & accessories",
    }
    const trail = buildCategoryTrail(product)
    expect(trail).toHaveLength(1)
    expect(trail[0]!.label).toBe("Endodontic products")
  })

  it("returns an empty array when no category levels are set", () => {
    expect(buildCategoryTrail(baseProduct)).toEqual([])
  })

  it("URL-encodes the fullPath in href, including '&' and '>'", () => {
    const product: ProductDetail = {
      ...baseProduct,
      categoryLevel2: "Endodontic products",
      categoryLevel3: "Endodontic sealers & cements",
    }
    const trail = buildCategoryTrail(product)
    expect(trail[1]!.href).toContain("categories=Endodontic+products+%3E+Endodontic+sealers+%26+cements")
  })
})

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
    const supplier = defined(buildSuppliers([up], null)[0])
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

  it("pins the Best Seller listing first even when it is the farthest away", () => {
    const near: UserProduct = { ...baseUserProduct, id: "up-near", vendorDistance: "1 mi" }
    const far: UserProduct = { ...baseUserProduct, id: "up-far", vendorDistance: "50 mi" }
    const suppliers = buildSuppliers([near, far], "up-far")
    expect(suppliers.map((s) => s.userProductId)).toEqual(["up-far", "up-near"])
  })

  it("sorts the non-best-seller suppliers from nearest to farthest by distance", () => {
    const far: UserProduct = { ...baseUserProduct, id: "up-far", vendorDistance: "20 mi" }
    const mid: UserProduct = { ...baseUserProduct, id: "up-mid", vendorDistance: "5 mi" }
    const near: UserProduct = { ...baseUserProduct, id: "up-near", vendorDistance: "1 mi" }
    const suppliers = buildSuppliers([far, near, mid], null)
    expect(suppliers.map((s) => s.userProductId)).toEqual(["up-near", "up-mid", "up-far"])
  })

  it('parses "ft" distances as closer than "mi" distances', () => {
    const feet: UserProduct = { ...baseUserProduct, id: "up-feet", vendorDistance: "800 ft" }
    const miles: UserProduct = { ...baseUserProduct, id: "up-miles", vendorDistance: "2 mi" }
    const suppliers = buildSuppliers([miles, feet], null)
    expect(suppliers.map((s) => s.userProductId)).toEqual(["up-feet", "up-miles"])
  })

  it("handles comma thousands separators in the distance string", () => {
    const far: UserProduct = { ...baseUserProduct, id: "up-far", vendorDistance: "1,200 mi" }
    const near: UserProduct = { ...baseUserProduct, id: "up-near", vendorDistance: "300 mi" }
    const suppliers = buildSuppliers([far, near], null)
    expect(suppliers.map((s) => s.userProductId)).toEqual(["up-near", "up-far"])
  })

  it("pushes suppliers with a missing or unparseable distance to the end", () => {
    const near: UserProduct = { ...baseUserProduct, id: "up-near", price: 30, vendorDistance: "3 mi" }
    const missing: UserProduct = { ...baseUserProduct, id: "up-missing", price: 10, vendorDistance: undefined }
    const unparseable: UserProduct = { ...baseUserProduct, id: "up-unparseable", price: 20, vendorDistance: "unknown" }
    const suppliers = buildSuppliers([unparseable, missing, near], null)
    expect(suppliers.map((s) => s.userProductId)).toEqual(["up-near", "up-missing", "up-unparseable"])
  })

  it("keeps ascending price as the tie-breaker when distances are equal or absent", () => {
    const cheapSameDistance: UserProduct = {
      ...baseUserProduct,
      id: "up-cheap-same",
      price: 10,
      vendorDistance: "5 mi",
    }
    const expensiveSameDistance: UserProduct = {
      ...baseUserProduct,
      id: "up-expensive-same",
      price: 20,
      vendorDistance: "5 mi",
    }
    const cheapNoDistance: UserProduct = { ...baseUserProduct, id: "up-cheap-none", price: 30 }
    const expensiveNoDistance: UserProduct = { ...baseUserProduct, id: "up-expensive-none", price: 40 }
    const suppliers = buildSuppliers(
      [expensiveNoDistance, expensiveSameDistance, cheapNoDistance, cheapSameDistance],
      null,
    )
    expect(suppliers.map((s) => s.userProductId)).toEqual([
      "up-cheap-same",
      "up-expensive-same",
      "up-cheap-none",
      "up-expensive-none",
    ])
  })

  it("marks an out-of-stock listing as Out of Stock with a gray stock color", () => {
    const outOfStock: UserProduct = { ...baseUserProduct, stock: 0 }
    const supplier = defined(buildSuppliers([outOfStock], null)[0])
    expect(supplier.stock).toBe("Out of Stock")
    expect(supplier.stockColor).toBe("gray")
    expect(supplier.stockCount).toBe(0)
  })

  it("marks an in-stock listing as In Stock with a green stock color", () => {
    const inStock: UserProduct = { ...baseUserProduct, stock: 12 }
    const supplier = defined(buildSuppliers([inStock], null)[0])
    expect(supplier.stock).toBe("In Stock")
    expect(supplier.stockColor).toBe("green")
  })

  it("falls back to Vendor / <Vendor> logo for missing vendor and vendorLogo fields", () => {
    const up: UserProduct = { ...baseUserProduct, vendor: undefined, vendorLogo: undefined }
    const supplier = defined(buildSuppliers([up], null)[0])
    expect(supplier.name).toBe("Vendor")
    expect(supplier.alt).toBe("Vendor logo")
    expect(supplier.logo).toBeUndefined()
  })

  it("omits originalPrice when oldPrice equals the current price", () => {
    const up: UserProduct = { ...baseUserProduct, price: 56, oldPrice: 56 }
    const supplier = defined(buildSuppliers([up], null)[0])
    expect(supplier.originalPrice).toBeNull()
  })

  it("includes originalPrice when oldPrice differs from the current price", () => {
    const up: UserProduct = { ...baseUserProduct, price: 56, oldPrice: 70 }
    const supplier = defined(buildSuppliers([up], null)[0])
    expect(supplier.originalPrice).toBe("$70.00")
  })

  it("defaults discount to 0 when not a number", () => {
    const up: UserProduct = { ...baseUserProduct, discount: undefined }
    const supplier = defined(buildSuppliers([up], null)[0])
    expect(supplier.discount).toBe(0)
  })

  it('reports "Free" shipping when shipmentFee and heavyShippingSurcharge are both zero/missing', () => {
    const up: UserProduct = { ...baseUserProduct, shipmentFee: undefined, heavyShippingSurcharge: undefined }
    const supplier = defined(buildSuppliers([up], null)[0])
    expect(supplier.shipping).toBe("Free")
    expect(supplier.shippingFee).toBe("Free")
    expect(supplier.heavyShippingFee).toBe("Free")
    expect(supplier.hasHeavyShippingFee).toBe(false)
  })

  it("sums shipmentFee and heavyShippingSurcharge into the total shipping cost", () => {
    const up: UserProduct = { ...baseUserProduct, shipmentFee: 5, heavyShippingSurcharge: 2.5 }
    const supplier = defined(buildSuppliers([up], null)[0])
    expect(supplier.shipping).toBe("$7.50")
    expect(supplier.shippingFee).toBe("$5.00")
    expect(supplier.heavyShippingFee).toBe("$2.50")
    expect(supplier.hasHeavyShippingFee).toBe(true)
  })

  it("defaults rating and reviewCount to 0 when missing", () => {
    const up: UserProduct = { ...baseUserProduct, vendorRating: undefined, vendorReviewCount: undefined }
    const supplier = defined(buildSuppliers([up], null)[0])
    expect(supplier.rating).toBe(0)
    expect(supplier.reviewCount).toBe(0)
  })
})

describe("uberDirectEligible", () => {
  it.each<[boolean | undefined, string | undefined, boolean]>([
    [true, "3.2 mi", true],
    [true, "9.9 mi", true],
    [true, "10 mi", false],
    [true, "12.3 mi", false],
    [true, "800 ft", true],
    [true, "15 km", true],
    [true, "20 km", false],
    [true, undefined, false],
    [true, "unknown", false],
    [false, "1 mi", false],
    [undefined, "1 mi", false],
  ])("uberEnabled=%s, vendorDistance=%s -> %s", (uberEnabled, vendorDistance, expected) => {
    const up: UserProduct = { ...baseUserProduct, uberEnabled, vendorDistance }
    const supplier = defined(buildSuppliers([up], null)[0])
    expect(supplier.uberDirectEligible).toBe(expected)
  })
})
