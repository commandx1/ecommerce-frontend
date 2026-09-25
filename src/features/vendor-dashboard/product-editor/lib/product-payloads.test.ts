import { describe, expect, it } from "vitest"
import type { NormalizedSearchProduct } from "@/lib/api/products"
import { makeProduct } from "@/test/factories"
import { INITIAL_VALUES, type ProductFormValues } from "./product-form"
import { INITIAL_EXISTING_IMAGES, INITIAL_LINKED_IMAGES } from "./product-media"
import {
  buildListingUpdate,
  buildLocalListingPayload,
  buildProductVendorRequest,
  buildReviewPayload,
  SUBMIT_SUCCESS_MESSAGES,
  selectSubmitBranch,
  submitErrorMessage,
} from "./product-payloads"

const VALUES: ProductFormValues = {
  ...INITIAL_VALUES,
  name: "Composite Kit",
  detailedName: "Composite Kit 20 Shades",
  barcode: "4006381333931",
  barcodeFormats: "UPC_A",
  active: false,
  description: "A great dental product",
  manufacturerCode: "MNF-1",
  manufacturer: "MARK3",
  brand: "Acme Dental",
  exampleVariationsProductId: "p-var",
  categoryPath: ["Endodontic products", "Hand files-reamers-hedstroms", "K-Files"],
  manufacturerSiteProductPage: "https://example.com/p",
  dentalLicenseRequired: "Yes",
  height: "1",
  length: "2.5",
  width: "0",
  weight: "1.5",
  skuCode: "SKU-1",
  price: "42.5",
  stock: "7",
  shipmentFee: "5",
  heavyShippingSurcharge: "0",
  exportPackaging: true,
  fulfillmentPolicy: "Ships within 2 days",
}

const searchResult = (source: NormalizedSearchProduct["source"]): NormalizedSearchProduct => ({
  id: "p-1",
  barcode: "123",
  title: "Composite Kit",
  images: [],
  source,
  originalData: makeProduct(),
})

describe("selectSubmitBranch", () => {
  const base = {
    isEditMode: false,
    userProductId: null,
    isReviewEditMode: false,
    reviewProductId: null,
    selectedProduct: null,
  }

  it.each([
    ["plain create", {}, "createForReview"],
    ["plain edit", { isEditMode: true, userProductId: "up-9" }, "updateListing"],
    ["review edit", { isReviewEditMode: true, reviewProductId: "p-1" }, "updateForReview"],
    ["local catalogue product", { selectedProduct: searchResult("local") }, "createListing"],
    ["barcode-lookup product", { selectedProduct: searchResult("barcode_lookup") }, "createForReview"],
    [
      "local product while review editing",
      { isReviewEditMode: true, reviewProductId: "p-1", selectedProduct: searchResult("local") },
      "updateForReview",
    ],
    [
      "both edit and review-edit params",
      { isEditMode: true, userProductId: "up-9", isReviewEditMode: true, reviewProductId: "p-1" },
      "updateListing",
    ],
  ] as const)("%s -> %s", (_label, overrides, branch) => {
    expect(selectSubmitBranch({ ...base, ...overrides })).toBe(branch)
  })
})

describe("buildListingUpdate", () => {
  it("sends exactly price/discount/stock and the loaded active flag", () => {
    const payload = buildListingUpdate(VALUES, "15")
    expect(payload).toEqual({ price: 42.5, discount: 15, stock: 7, active: false })
    expect(Object.keys(payload)).toEqual(["price", "discount", "stock", "active"])
  })

  it.each(["", "   "])("sends a blank discount (%j) as 0", (discount) => {
    expect(buildListingUpdate(VALUES, discount).discount).toBe(0)
  })
})

describe("buildLocalListingPayload", () => {
  it("creates an active listing with no discount", () => {
    expect(buildLocalListingPayload("p-1", VALUES)).toEqual({
      productId: "p-1",
      price: 42.5,
      discount: 0,
      stock: 7,
      active: true,
    })
  })
})

describe("buildProductVendorRequest", () => {
  const noImages = { existing: INITIAL_EXISTING_IMAGES, linked: INITIAL_LINKED_IMAGES }

  it("maps every field in wire order and always sends active: true", () => {
    const payload = buildProductVendorRequest(VALUES, noImages, [{ attributeName: "Color", attributeValue: "Blue" }])
    const expected = {
      name: "Composite Kit",
      detailedName: "Composite Kit 20 Shades",
      coverPhotoPath: undefined,
      photoPhats: undefined,
      barcode: 4006381333931,
      barcodeFormats: "UPC_A",
      description: "A great dental product",
      manufacturerCode: "MNF-1",
      manufacturer: "MARK3",
      brand: "Acme Dental",
      exampleVariationsProductId: "p-var",
      categoryLevel1: "Dental Supplies",
      categoryLevel2: "Endodontic products",
      categoryLevel3: "Hand files-reamers-hedstroms",
      categoryLevel4: "K-Files",
      manufacturerSiteProductPage: "https://example.com/p",
      dentalLicenseRequired: "Yes",
      height: 1,
      length: 2.5,
      width: 0,
      weight: 1.5,
      attributes: [{ attributeName: "Color", attributeValue: "Blue" }],
      skuCode: "SKU-1",
      price: 42.5,
      stock: 7,
      active: true,
      shipmentFee: 5,
      heavyShippingSurcharge: 0,
      exportPackaging: true,
      fulfillmentPolicy: "Ships within 2 days",
    }
    expect(payload).toEqual(expected)
    expect(Object.keys(JSON.parse(JSON.stringify(payload)))).toEqual(
      Object.keys(expected).filter((k) => k !== "coverPhotoPath" && k !== "photoPhats"),
    )
  })

  it("drops blank optional fields instead of sending empty strings", () => {
    const json = JSON.parse(
      JSON.stringify(
        buildProductVendorRequest(
          {
            ...VALUES,
            detailedName: " ",
            barcode: "",
            description: "",
            exampleVariationsProductId: "",
            height: "",
            length: "",
            width: "",
            skuCode: "",
            shipmentFee: "",
            fulfillmentPolicy: "",
            categoryPath: null,
          },
          noImages,
          [],
        ),
      ),
    )
    for (const key of [
      "detailedName",
      "barcode",
      "description",
      "exampleVariationsProductId",
      "height",
      "length",
      "width",
      "skuCode",
      "shipmentFee",
      "fulfillmentPolicy",
      "attributes",
      "categoryLevel2",
    ]) {
      expect(json).not.toHaveProperty(key)
    }
    expect(json.name).toBe("Composite Kit")
    // Level 1 is the fixed tree root, so it is sent even without a picked category.
    expect(json.categoryLevel1).toBe("Dental Supplies")
  })

  it("keeps only attributes with both a name and a value", () => {
    const payload = buildProductVendorRequest(VALUES, noImages, [
      { attributeName: "Color", attributeValue: "Blue" },
      { attributeName: "Size", attributeValue: " " },
      { attributeName: "", attributeValue: "Large" },
    ])
    expect(payload.attributes).toEqual([{ attributeName: "Color", attributeValue: "Blue" }])
  })

  it.each([
    [
      "existing cover wins over a linked one",
      { coverPhoto: "https://img/existing.png", photos: [] },
      { coverPhoto: "https://cdn/linked.png", photos: [] },
      "https://img/existing.png",
      undefined,
    ],
    [
      "linked cover when there is no existing one",
      { coverPhoto: null, photos: [] },
      { coverPhoto: "https://cdn/linked.png", photos: [] },
      "https://cdn/linked.png",
      undefined,
    ],
    [
      "existing photos first, then linked ones",
      { coverPhoto: null, photos: ["https://img/e1.png"] },
      { coverPhoto: null, photos: ["https://cdn/l1.png", "https://cdn/l2.png"] },
      undefined,
      ["https://img/e1.png", "https://cdn/l1.png", "https://cdn/l2.png"],
    ],
  ])("image fallback paths: %s", (_label, existing, linked, coverPhotoPath, photoPhats) => {
    const payload = buildProductVendorRequest(VALUES, { existing, linked }, [])
    expect(payload.coverPhotoPath).toEqual(coverPhotoPath)
    expect(payload.photoPhats).toEqual(photoPhats)
  })
})

describe("buildReviewPayload", () => {
  const data = { name: "Composite Kit" }

  it("attaches the picked files", () => {
    const cover = new File(["c"], "cover.png")
    const photo = new File(["a"], "a.png")
    expect(buildReviewPayload(data, { coverPhoto: cover, photos: [photo] })).toEqual({
      data,
      coverPhoto: cover,
      photos: [photo],
    })
  })

  it("leaves both file parts undefined when nothing was picked", () => {
    expect(buildReviewPayload(data, { coverPhoto: null, photos: [] })).toEqual({
      data,
      coverPhoto: undefined,
      photos: undefined,
    })
  })
})

describe("SUBMIT_SUCCESS_MESSAGES", () => {
  it("has the toast for each branch", () => {
    expect(SUBMIT_SUCCESS_MESSAGES).toEqual({
      updateListing: "Product updated successfully!",
      createListing: "Product created successfully!",
      updateForReview: "Product updated and resubmitted for review!",
      createForReview: "Product submitted for review!",
    })
  })
})

describe("submitErrorMessage", () => {
  it.each([
    [new Error("Barcode already registered"), "create", "Barcode already registered"],
    [new Error(), "create", "Failed to create product. Please try again."],
    [new Error(), "edit", "Failed to update product. Please try again."],
    [{}, "reviewEdit", "Failed to update product. Please try again."],
  ] as const)("%o in %s mode -> %s", (error, mode, message) => {
    expect(submitErrorMessage(error, mode)).toBe(message)
  })
})
