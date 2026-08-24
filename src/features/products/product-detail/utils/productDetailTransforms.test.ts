import { describe, expect, it } from "vitest"
import type { ProductDetail, UserProduct } from "../types"
import {
  buildDescription,
  buildFeatures,
  buildPhotoPaths,
  buildSuppliers,
  buildThumbnailImages,
  resolveBestPriceVendorUserProductId,
  resolveMainImage,
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

describe("buildFeatures", () => {
  it("builds bullet points from brand, manufacturerCode, packaging, type, and size", () => {
    const product: ProductDetail = {
      ...baseProduct,
      brand: "MARK3",
      manufacturerCode: "MK-1001",
      packaging: "Box of 100",
      type: "Mixing Tip",
      size: "Large",
    }
    expect(buildFeatures(product)).toEqual([
      "Brand: MARK3",
      "Manufacturer Code: MK-1001",
      "Box of 100",
      "Mixing Tip",
      "Size: Large",
    ])
  })

  it("includes only the fields that are present", () => {
    const product: ProductDetail = { ...baseProduct, brand: "MARK3" }
    expect(buildFeatures(product)).toEqual(["Brand: MARK3"])
  })

  it("falls back to generic marketing bullets when no descriptive fields are present", () => {
    expect(buildFeatures(baseProduct)).toEqual([
      "Professional Grade",
      "Quality Assured",
      "Fast Delivery",
      "Verified Supplier",
    ])
  })
})

describe("buildDescription", () => {
  it("collects aboutProduct and description as paragraphs, in that order", () => {
    const product: ProductDetail = { ...baseProduct, aboutProduct: "About text", description: "Full description" }
    const result = buildDescription(product, ["feature-1"])
    expect(result.paragraphs).toEqual(["About text", "Full description"])
    expect(result.benefits).toEqual(["feature-1"])
  })

  it("omits missing paragraph fields instead of inserting empty strings", () => {
    const product: ProductDetail = { ...baseProduct, description: "Only description" }
    expect(buildDescription(product, []).paragraphs).toEqual(["Only description"])
  })

  it("always includes the fixed included-items list", () => {
    const result = buildDescription(baseProduct, [])
    expect(result.included).toEqual([
      { icon: "box", text: "Protective carrying case" },
      { icon: "book", text: "Quick-start guide" },
      { icon: "tools", text: "Calibration tools" },
      { icon: "shield-check", text: "Warranty registration card" },
    ])
  })

  it("prefers the product description for the installation note when present", () => {
    const product: ProductDetail = { ...baseProduct, description: "Full description", aboutProduct: "About text" }
    expect(buildDescription(product, []).installationNote).toEqual({
      title: "Installation Note",
      text: "Full description",
    })
  })

  it("falls back to aboutProduct for the installation note when description is missing", () => {
    const product: ProductDetail = { ...baseProduct, aboutProduct: "About text" }
    expect(buildDescription(product, []).installationNote.text).toBe("About text")
  })

  it("falls back to a generic installation note when both fields are missing", () => {
    expect(buildDescription(baseProduct, []).installationNote.text).toBe(
      "Installation should be performed by trained dental professionals.",
    )
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
