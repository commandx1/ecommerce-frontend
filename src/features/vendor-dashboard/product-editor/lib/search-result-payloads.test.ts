import { describe, expect, it } from "vitest"
import type { BarcodeLookupProduct, BarcodeProduct, NormalizedSearchProduct } from "@/lib/api/products"
import { makeProduct } from "@/test/factories"
import {
  buildLocalListingFromSearchResult,
  buildReviewRequestFromSearchResult,
  validateSearchResultInputs,
} from "./search-result-payloads"

describe("validateSearchResultInputs", () => {
  it.each([
    ["", "10", "Price must be a positive number"],
    ["0", "10", "Price must be a positive number"],
    ["-5", "10", "Price must be a positive number"],
    ["abc", "10", "Price must be a positive number"],
    ["10", "", "Stock must be a non-negative number"],
    ["10", "-1", "Stock must be a non-negative number"],
    ["10", "abc", "Stock must be a non-negative number"],
    ["10", "0", null],
    ["9.99", "5", null],
  ])("price=%j stock=%j -> %j", (price, stock, expected) => {
    expect(validateSearchResultInputs(price, stock)).toBe(expected)
  })
})

const localProduct = (overrides: Parameters<typeof makeProduct>[0] = {}): NormalizedSearchProduct => {
  const product = makeProduct(overrides)
  return {
    id: product.id,
    barcode: String(product.barcode),
    title: product.name,
    brand: product.brand,
    category: undefined,
    images: product.coverPhotoPath ? [product.coverPhotoPath] : [],
    source: "local",
    originalData: product,
  }
}

describe("buildLocalListingFromSearchResult", () => {
  it("creates an active listing with no discount, priced and stocked from the form", () => {
    const product = localProduct({ id: "p-42" })

    expect(buildLocalListingFromSearchResult(product, "19.99", "7")).toEqual({
      productId: "p-42",
      price: 19.99,
      discount: 0,
      stock: 7,
      active: true,
    })
  })
})

const barcodeLookupProduct = (overrides: Partial<BarcodeLookupProduct> = {}): NormalizedSearchProduct => {
  const data: BarcodeLookupProduct = {
    barcode_number: "1234567890123",
    barcode_formats: "EAN_13",
    mpn: "MPN-1",
    model: "Model X",
    asin: "ASIN-1",
    title: "Barcode Lookup Product",
    category: "Dental > Composite",
    manufacturer: "MARK3",
    brand: "MARK3",
    contributors: ["Alice", "Bob"],
    length: "10",
    width: "5",
    height: "3",
    weight: "1.2",
    description: "A great lookup product.",
    images: ["https://cdn.example/a.png", "https://cdn.example/b.png"],
    ...overrides,
  }
  return {
    id: data.barcode_number,
    barcode: data.barcode_number,
    title: data.title || "",
    brand: data.brand,
    category: data.category,
    images: data.images || [],
    source: "barcode_lookup",
    originalData: data,
  }
}

const barcodeSavedProduct = (overrides: Partial<BarcodeProduct> = {}): NormalizedSearchProduct => {
  const data: BarcodeProduct = {
    id: 7,
    barcodeNumber: "9998887776665",
    barcodeFormats: "UPC_A",
    mpn: "MPN-7",
    title: "Saved Barcode Product",
    category: "Dental",
    manufacturer: "Acme",
    brand: "Acme",
    images: ["https://cdn.example/c.png"],
    ...overrides,
  }
  return {
    id: String(data.id),
    barcode: data.barcodeNumber,
    title: data.title || "",
    brand: data.brand,
    category: data.category,
    images: data.images || [],
    source: "barcode_lookup",
    originalData: data,
  }
}

describe("buildReviewRequestFromSearchResult", () => {
  it("maps a barcode-lookup product: attributes, cover/gallery split from images, numeric barcode", () => {
    const product = barcodeLookupProduct()

    const payload = buildReviewRequestFromSearchResult(product, "25", "3")

    expect(payload).toMatchObject({
      name: "Barcode Lookup Product",
      barcode: 1234567890123,
      barcodeFormats: "EAN_13",
      description: "A great lookup product.",
      manufacturer: "MARK3",
      manufacturerCode: "MPN-1",
      brand: "MARK3",
      length: 10,
      width: 5,
      height: 3,
      weight: 1.2,
      coverPhotoPath: "https://cdn.example/a.png",
      photoPhats: ["https://cdn.example/b.png"],
      price: 25,
      stock: 3,
      active: true,
    })
    expect(payload.attributes).toEqual(
      expect.arrayContaining([
        { attributeName: "Model", attributeValue: "Model X" },
        { attributeName: "ASIN", attributeValue: "ASIN-1" },
        { attributeName: "Contributors", attributeValue: "Alice, Bob" },
      ]),
    )
  })

  it("drops blank attribute values instead of sending empty strings", () => {
    const product = barcodeLookupProduct({ model: "", asin: undefined })
    const payload = buildReviewRequestFromSearchResult(product, "10", "1")
    expect(payload.attributes?.some((a) => a.attributeName === "Model")).toBe(false)
    expect(payload.attributes?.some((a) => a.attributeName === "ASIN")).toBe(false)
  })

  it("maps a saved-barcode product (no lookup-only fields) with no attributes", () => {
    const product = barcodeSavedProduct()

    const payload = buildReviewRequestFromSearchResult(product, "12.5", "4")

    expect(payload).toMatchObject({
      name: "Saved Barcode Product",
      barcode: 9998887776665,
      barcodeFormats: "UPC_A",
      manufacturer: "Acme",
      manufacturerCode: "MPN-7",
      brand: "Acme",
      length: undefined,
      width: undefined,
      height: undefined,
      weight: undefined,
      attributes: undefined,
      coverPhotoPath: "https://cdn.example/c.png",
      photoPhats: undefined,
      price: 12.5,
      stock: 4,
      active: true,
    })
  })

  it("falls back to EAN_13 when the source has no barcode format", () => {
    const product = barcodeLookupProduct({ barcode_formats: "" })
    expect(buildReviewRequestFromSearchResult(product, "1", "1").barcodeFormats).toBe("EAN_13")
  })

  it("sends barcode undefined instead of NaN when the barcode number is not numeric", () => {
    const product = barcodeLookupProduct({ barcode_number: "not-a-number" })
    expect(buildReviewRequestFromSearchResult(product, "1", "1").barcode).toBeUndefined()
  })
})
