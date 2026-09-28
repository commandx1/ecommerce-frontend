import { describe, expect, it } from "vitest"
import { getFullImageUrl } from "@/lib/api/products"
import { makeProduct, makeUserProductDetailResponse, makeVendorUserProduct } from "@/test/factories"
import { INITIAL_VALUES } from "./product-form"
import { existingImagesOf, mapEditLoad, mapReviewEditLoad } from "./product-load-mappers"

const FULL_PRODUCT = makeProduct({
  name: "Composite Kit",
  detailedName: "Composite Kit 20 Shades",
  barcode: 4006381333931,
  barcodeFormats: "UPC_A",
  description: "desc",
  manufacturerCode: "MNF-1",
  manufacturer: "MARK3",
  brand: "Acme",
  exampleVariationsProductId: "p-var",
  manufacturerSiteProductPage: "https://example.com/p",
  dentalLicenseRequired: "Yes",
  height: 0,
  length: 2,
  width: undefined,
  weight: 1.5,
  coverPhotoPath: "/uploads/cover.png",
  photoPhats: ["/uploads/a.png", "https://cdn.example/b.png"],
  categoryLevel1: "Dental Supplies",
  categoryLevel2: "Endodontic products",
  categoryLevel3: "Hand files-reamers-hedstroms",
  categoryLevel4: "K-Files",
})

describe("existingImagesOf", () => {
  it("turns stored paths into absolute URLs", () => {
    expect(existingImagesOf(FULL_PRODUCT)).toEqual({
      coverPhoto: getFullImageUrl("/uploads/cover.png"),
      photos: [getFullImageUrl("/uploads/a.png"), "https://cdn.example/b.png"],
    })
  })

  it("is empty for a product without images", () => {
    expect(existingImagesOf(makeProduct({ coverPhotoPath: undefined, photoPhats: undefined }))).toEqual({
      coverPhoto: null,
      photos: [],
    })
  })
})

describe("mapEditLoad", () => {
  it("seeds only the fields the listing form shows, plus the discount", () => {
    const { values, editDiscount, existingImages } = mapEditLoad(
      FULL_PRODUCT,
      makeVendorUserProduct({ price: 56, stock: 40, discount: 20, active: false, skuCode: "SKU-9", shipmentFee: 9 }),
    )
    expect(values).toEqual({
      ...INITIAL_VALUES,
      name: "Composite Kit",
      detailedName: "Composite Kit 20 Shades",
      barcode: "4006381333931",
      barcodeFormats: "UPC_A",
      active: false,
      description: "desc",
      manufacturerCode: "MNF-1",
      brand: "Acme",
      price: "56",
      stock: "40",
    })
    expect(editDiscount).toBe("20")
    expect(existingImages).toEqual(existingImagesOf(FULL_PRODUCT))
  })

  it("blanks a missing barcode instead of showing the literal text 'undefined'", () => {
    const { values } = mapEditLoad(
      makeProduct({
        name: undefined,
        barcode: undefined,
        barcodeFormats: undefined,
        brand: undefined,
        detailedName: undefined,
        description: undefined,
      }),
      makeVendorUserProduct(),
    )
    expect(values.barcode).toBe("")
    expect(values.name).toBe("")
    expect(values.barcodeFormats).toBe("EAN_13")
    expect(values.brand).toBe("")
  })

  it("blanks a null barcode the same way as a missing one", () => {
    const { values } = mapEditLoad(makeProduct({ barcode: null as unknown as number }), makeVendorUserProduct())
    expect(values.barcode).toBe("")
  })

  it("keeps a real numeric barcode as its string form", () => {
    const { values } = mapEditLoad(makeProduct({ barcode: 12345 }), makeVendorUserProduct())
    expect(values.barcode).toBe("12345")
  })

  it('keeps a zero barcode as "0" rather than blanking it', () => {
    const { values } = mapEditLoad(makeProduct({ barcode: 0 }), makeVendorUserProduct())
    expect(values.barcode).toBe("0")
  })
})

describe("mapReviewEditLoad", () => {
  it("seeds the whole form from the rejected product and its listing", () => {
    const { values, existingImages } = mapReviewEditLoad(
      FULL_PRODUCT,
      makeUserProductDetailResponse({
        active: true,
        skuCode: "SKU-9",
        price: 10,
        stock: 5,
        shipmentFee: 0,
        heavyShippingSurcharge: 2,
        fulfillmentPolicy: "Ships within 5 business days",
      }),
    )
    expect(values).toEqual({
      ...INITIAL_VALUES,
      name: "Composite Kit",
      detailedName: "Composite Kit 20 Shades",
      barcode: "4006381333931",
      barcodeFormats: "UPC_A",
      active: true,
      description: "desc",
      manufacturerCode: "MNF-1",
      manufacturer: "MARK3",
      brand: "Acme",
      exampleVariationsProductId: "p-var",
      categoryPath: ["Endodontic products", "Hand files-reamers-hedstroms", "K-Files"],
      legacyCategory: null,
      manufacturerSiteProductPage: "https://example.com/p",
      dentalLicenseRequired: "Yes",
      height: "0",
      length: "2",
      width: "",
      weight: "1.5",
      skuCode: "SKU-9",
      price: "10",
      stock: "5",
      shipmentFee: "0",
      heavyShippingSurcharge: "2",
      fulfillmentPolicy: "Ships within 5 days",
    })
    expect(existingImages).toEqual(existingImagesOf(FULL_PRODUCT))
  })

  it("keeps a non-leaf stored category only as a legacy hint", () => {
    const { values } = mapReviewEditLoad(
      makeProduct({ categoryLevel1: "Restorative", categoryLevel2: "Composite" }),
      makeUserProductDetailResponse(),
    )
    expect(values.categoryPath).toBeNull()
    expect(values.legacyCategory).toBe("Restorative > Composite")
  })

  it("falls back to blanks and defaults when optional fields are missing", () => {
    const { values } = mapReviewEditLoad(
      makeProduct({ barcode: 0, barcodeFormats: undefined, dentalLicenseRequired: undefined }),
      makeUserProductDetailResponse({
        skuCode: undefined,
        shipmentFee: undefined,
        heavyShippingSurcharge: undefined,
        fulfillmentPolicy: undefined,
      }),
    )
    expect(values).toMatchObject({
      barcode: "",
      barcodeFormats: "EAN_13",
      dentalLicenseRequired: "No",
      skuCode: "",
      shipmentFee: "",
      heavyShippingSurcharge: "",
      fulfillmentPolicy: "",
    })
  })
})
