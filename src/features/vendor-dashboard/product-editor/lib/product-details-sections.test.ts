import { describe, expect, it } from "vitest"
import type { BarcodeLookupProduct, BarcodeProduct, NormalizedSearchProduct } from "@/lib/api/products"
import { makeProduct } from "@/test/factories"
import { buildDetailSections, EMPTY_VALUE, fmt, fmtList } from "./product-details-sections"

describe("fmt", () => {
  it.each([
    [null, EMPTY_VALUE],
    [undefined, EMPTY_VALUE],
    ["", EMPTY_VALUE],
    ["   ", EMPTY_VALUE],
    ["Composite", "Composite"],
    [0, "0"],
    [42, "42"],
  ])("fmt(%j) -> %j", (value, expected) => {
    expect(fmt(value as never)).toBe(expected)
  })
})

describe("fmtList", () => {
  it("returns the empty placeholder for undefined", () => {
    expect(fmtList(undefined, ", ")).toBe(EMPTY_VALUE)
  })

  it("drops blank/undefined entries and joins the rest with the separator", () => {
    expect(fmtList(["Alice", undefined, "  ", "Bob"], ", ")).toBe("Alice, Bob")
  })

  it("returns the empty placeholder when every entry is blank", () => {
    expect(fmtList([undefined, "  "], ", ")).toBe(EMPTY_VALUE)
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

const barcodeLookupProduct = (overrides: Partial<BarcodeLookupProduct> = {}): NormalizedSearchProduct => {
  const data: BarcodeLookupProduct = {
    barcode_number: "1234567890123",
    barcode_formats: "EAN_13",
    mpn: "MPN-1",
    model: "Model X",
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
    features: ["Fast cure", "Low shrinkage"],
    images: ["https://cdn.example/a.png"],
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

describe("buildDetailSections", () => {
  it("maps a local catalogue product's specs, dimensions, category path and attributes", () => {
    const product = localProduct({
      brand: "MARK3",
      manufacturer: "MARK3 Inc.",
      manufacturerCode: "MNF-1",
      categoryLevel1: "Restorative",
      categoryLevel2: "Composite",
      height: 5,
      length: 10,
      width: 7,
      weight: 2,
      distanceUnit: "cm",
      massUnit: "kg",
      attributes: [{ attributeName: "Color", attributeValue: "Blue" }],
    })

    const sections = buildDetailSections(product)

    expect(sections.specs).toContainEqual({ label: "Brand", value: "MARK3" })
    expect(sections.specs).toContainEqual({ label: "Category", value: "Restorative / Composite" })
    expect(sections.specs).toContainEqual({ label: "Dimensions", value: "L 10cm · W 7cm · H 5cm · 2 kg" })
    expect(sections.attributes).toEqual([{ label: "Color", value: "Blue" }])
  })

  it("falls back to subCategoriesId when no category level is set", () => {
    const product = localProduct({
      categoryLevel1: undefined,
      categoryLevel2: undefined,
      categoryLevel3: undefined,
      categoryLevel4: undefined,
      categoryLevel5: undefined,
      subCategoriesId: "sub-77",
    })

    expect(buildDetailSections(product).specs).toContainEqual({ label: "Category", value: "sub-77" })
  })

  it("drops attributes that are missing a name or a value", () => {
    const product = localProduct({
      attributes: [
        { attributeName: "Color", attributeValue: "Blue" },
        { attributeName: "Size", attributeValue: " " },
        { attributeName: "", attributeValue: "Large" },
      ],
    })

    expect(buildDetailSections(product).attributes).toEqual([{ label: "Color", value: "Blue" }])
  })

  it("prefers aboutProduct over description for a local product", () => {
    const product = localProduct({ aboutProduct: "About text", description: "Description text" })
    expect(buildDetailSections(product).description).toBe("About text")
  })

  it("maps a barcode-lookup product's specs, dimensions and wide fields", () => {
    const product = barcodeLookupProduct()

    const sections = buildDetailSections(product)

    expect(sections.specs).toContainEqual({ label: "Model", value: "Model X" })
    expect(sections.specs).toContainEqual({ label: "Dimensions", value: "L 10 · W 5 · H 3 · 1.2 kg" })
    expect(sections.wide).toContainEqual({ label: "Contributors", value: "Alice, Bob" })
    expect(sections.attributes).toEqual([])
    expect(sections.description).toBe("A great lookup product.")
  })

  it("maps a saved-barcode product (no lookup fields) to its narrower spec set", () => {
    const product = barcodeSavedProduct()

    const sections = buildDetailSections(product)

    expect(sections.specs).toEqual([
      { label: "Brand", value: "Acme" },
      { label: "Manufacturer", value: "Acme" },
      { label: "Manufacturer Code", value: "MPN-7" },
    ])
    expect(sections.wide).toEqual([
      { label: "Category", value: "Dental" },
      { label: "Barcode Format", value: "UPC_A" },
    ])
    expect(sections.attributes).toEqual([])
    expect(sections.description).toBe("")
  })
})
