import { describe, expect, it } from "vitest"
import { ALL_FIELDS, type EditorMode, INITIAL_VALUES, type ProductFormValues, TAB_FIELDS } from "./product-form"
import { type ValidationContext, validateProductFields } from "./validate-product-fields"

const VALID: ProductFormValues = {
  ...INITIAL_VALUES,
  name: "Composite Kit",
  skuCode: "SKU-1",
  price: "42",
  stock: "7",
  shipmentFee: "5",
  heavyShippingSurcharge: "3",
  fulfillmentPolicy: "Ships within 2 days",
  description: "A great dental product",
  manufacturerCode: "MNF-1",
  manufacturer: "MARK3",
  brand: "Acme Dental",
  categoryPath: ["Endodontic products", "Hand files-reamers-hedstroms", "K-Files"],
  manufacturerSiteProductPage: "https://example.com/products/item",
  weight: "1.5",
}

const ctx = (overrides: Partial<ValidationContext> = {}): ValidationContext => ({
  mode: "create",
  editDiscount: "",
  hasCoverPhoto: true,
  ...overrides,
})

const validateAll = (values: Partial<ProductFormValues>, context: Partial<ValidationContext> = {}) =>
  validateProductFields({ ...VALID, ...values }, ctx(context), ALL_FIELDS)

describe("validateProductFields — full rule set (create and review edit)", () => {
  it.each<EditorMode>(["create", "reviewEdit"])("accepts a complete %s form", (mode) => {
    expect(validateAll({}, { mode })).toEqual({})
  })

  it.each<[keyof ProductFormValues, string | null, string, string]>([
    ["name", "   ", "name", "Product name is required"],
    ["barcode", "abc", "barcode", "Barcode must be a number"],
    ["barcode", "0", "barcode", "Barcode must be a positive number"],
    ["barcode", "-4", "barcode", "Barcode must be a positive number"],
    ["barcode", "123.5", "barcode", "Barcode must be a whole number"],
    ["barcode", "99999999999999999", "barcode", "Barcode is too large to submit accurately"],
    ["skuCode", " ", "skuCode", "SKU code is required"],
    ["price", "", "price", "Price is required"],
    ["price", "abc", "price", "Price must be a non-negative number"],
    ["price", "-1", "price", "Price must be a non-negative number"],
    ["stock", "", "stock", "Stock is required"],
    ["stock", "-1", "stock", "Stock must be a non-negative number"],
    ["stock", "7.5", "stock", "Stock must be a whole number"],
    ["shipmentFee", "", "shipmentFee", "Shipment fee is required"],
    ["shipmentFee", "-2", "shipmentFee", "Shipment fee must be a non-negative number"],
    ["heavyShippingSurcharge", "", "heavyShippingSurcharge", "Heavy shipping fee is required"],
    ["heavyShippingSurcharge", "x", "heavyShippingSurcharge", "Heavy shipping fee must be a non-negative number"],
    ["fulfillmentPolicy", "", "fulfillmentPolicy", "Fulfillment policy is required"],
    ["description", "", "description", "Description is required"],
    ["manufacturerCode", "", "manufacturerCode", "Manufacturer code is required"],
    ["manufacturer", "", "manufacturer", "Manufacturer is required"],
    ["brand", "", "brand", "Brand is required"],
    ["manufacturerSiteProductPage", "", "manufacturerSiteProductPage", "Manufacturer site product page is required"],
    [
      "manufacturerSiteProductPage",
      "not-a-url",
      "manufacturerSiteProductPage",
      "Manufacturer site product page must be a valid URL (starting with http:// or https://)",
    ],
    ["weight", "", "weight", "Weight is required"],
    ["weight", "0", "weight", "Weight must be greater than 0"],
    ["weight", "abc", "weight", "Weight must be greater than 0"],
    ["height", "-1", "height", "Height must be a non-negative number"],
    ["length", "x", "length", "Length must be a non-negative number"],
    ["width", "-0.5", "width", "Width must be a non-negative number"],
  ])("%s = %j -> %s: %s", (field, value, key, message) => {
    expect(validateAll({ [field]: value })).toEqual({ [key]: message })
  })

  it.each([
    ["barcode", ""],
    ["barcode", "12345678901234"],
    ["price", "0"],
    ["price", "999999.99"],
    ["stock", "0"],
    ["height", ""],
    ["height", "0"],
    ["width", "2.5"],
  ] as const)("accepts %s = %j", (field, value) => {
    expect(validateAll({ [field]: value })).toEqual({})
  })

  it.each([
    [null, "Category is required"],
    [[], "Category is required"],
    [["Endodontic products"], "Please select a category at every level"],
  ])("category %j -> %s", (categoryPath, message) => {
    expect(validateAll({ categoryPath })).toEqual({ category: message })
  })

  it("never lets a legacy category hint satisfy the required rule", () => {
    expect(validateAll({ categoryPath: null, legacyCategory: "Restorative > Composite" })).toEqual({
      category: "Category is required",
    })
  })

  it("requires a cover photo from any source", () => {
    expect(validateAll({}, { hasCoverPhoto: false })).toEqual({ coverPhoto: "Cover photo is required" })
  })

  it("ignores the edit-only discount", () => {
    expect(validateAll({}, { editDiscount: "-5" })).toEqual({})
  })

  it("reports errors in rule order (weight before the optional dimensions), which drives the submit tab jump", () => {
    const errors = validateProductFields(
      { ...INITIAL_VALUES, barcode: "x", height: "-1", length: "-1", width: "-1" },
      ctx({ hasCoverPhoto: false }),
      ALL_FIELDS,
    )
    expect(Object.keys(errors)).toEqual([
      "name",
      "barcode",
      "skuCode",
      "price",
      "stock",
      "shipmentFee",
      "heavyShippingSurcharge",
      "fulfillmentPolicy",
      "description",
      "manufacturerCode",
      "manufacturer",
      "brand",
      "category",
      "manufacturerSiteProductPage",
      "weight",
      "height",
      "length",
      "width",
      "coverPhoto",
    ])
  })

  it("only checks the fields it is given", () => {
    const blank = { ...INITIAL_VALUES }
    expect(Object.keys(validateProductFields(blank, ctx({ hasCoverPhoto: false }), TAB_FIELDS.basic))).toEqual([
      "name",
      "skuCode",
      "price",
      "stock",
      "shipmentFee",
      "heavyShippingSurcharge",
      "fulfillmentPolicy",
    ])
    expect(Object.keys(validateProductFields(blank, ctx({ hasCoverPhoto: false }), TAB_FIELDS.details))).toEqual([
      "description",
      "manufacturerCode",
      "manufacturer",
      "brand",
      "category",
      "manufacturerSiteProductPage",
      "weight",
    ])
    expect(validateProductFields(blank, ctx({ hasCoverPhoto: false }), TAB_FIELDS.media)).toEqual({
      coverPhoto: "Cover photo is required",
    })
    expect(validateProductFields(blank, ctx({ hasCoverPhoto: false }), [])).toEqual({})
  })
})

describe("validateProductFields — plain edit (listing only)", () => {
  const edit = (values: Partial<ProductFormValues>, editDiscount = "") =>
    validateProductFields(
      { ...INITIAL_VALUES, ...values },
      ctx({ mode: "edit", editDiscount, hasCoverPhoto: false }),
      ALL_FIELDS,
    )

  it("checks nothing but price, stock and discount (a blank catalogue form passes)", () => {
    expect(edit({ price: "56", stock: "40" })).toEqual({})
  })

  it.each([
    [{ price: "" }, "", { price: "Price is required" }],
    [{ price: "-5" }, "", { price: "Price must be a non-negative number" }],
    [{ stock: "" }, "", { stock: "Stock is required" }],
    [{ stock: "-1" }, "", { stock: "Stock must be a non-negative number" }],
    [{ stock: "7.5" }, "", { stock: "Stock must be a whole number" }],
    [{}, "-5", { discount: "Discount must be a non-negative number" }],
    [{}, "abc", { discount: "Discount must be a non-negative number" }],
    [{}, "  ", {}],
    [{}, "0", {}],
  ])("%j with discount %j -> %j", (values, discount, expected) => {
    expect(edit({ price: "56", stock: "40", ...values }, discount)).toEqual(expected)
  })

  it("orders price, stock, discount", () => {
    expect(Object.keys(edit({ price: "", stock: "" }, "-1"))).toEqual(["price", "stock", "discount"])
  })

  it("skips fields outside the given set", () => {
    expect(
      validateProductFields(
        { ...INITIAL_VALUES },
        ctx({ mode: "edit", editDiscount: "-1", hasCoverPhoto: false }),
        TAB_FIELDS.details,
      ),
    ).toEqual({})
  })
})
