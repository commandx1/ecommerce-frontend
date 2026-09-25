import { describe, expect, it } from "vitest"
import {
  ALL_FIELDS,
  adjacentTab,
  countTabErrors,
  fieldsBetweenTabs,
  getTabForField,
  INITIAL_VALUES,
  resolveEditorMode,
  TAB_FIELDS,
  type TabKey,
  withoutError,
} from "./product-form"

describe("INITIAL_VALUES", () => {
  it("starts blank except for the barcode format, active flag and license default", () => {
    expect(INITIAL_VALUES).toEqual({
      name: "",
      detailedName: "",
      barcode: "",
      barcodeFormats: "EAN_13",
      active: true,
      description: "",
      manufacturerCode: "",
      manufacturer: "",
      brand: "",
      exampleVariationsProductId: "",
      categoryPath: null,
      legacyCategory: null,
      manufacturerSiteProductPage: "",
      dentalLicenseRequired: "No",
      height: "",
      length: "",
      width: "",
      weight: "",
      skuCode: "",
      price: "",
      stock: "",
      shipmentFee: "",
      heavyShippingSurcharge: "",
      exportPackaging: false,
      fulfillmentPolicy: "",
    })
  })
})

describe("getTabForField", () => {
  it.each([
    ["name", "basic"],
    ["barcode", "basic"],
    ["discount", "basic"],
    ["fulfillmentPolicy", "basic"],
    ["description", "details"],
    ["category", "details"],
    ["weight", "details"],
    ["coverPhoto", "media"],
    // Anything unknown (including the `submit` key) lands on the last tab.
    ["submit", "media"],
    ["unknown", "media"],
  ])("%s -> %s", (field, tab) => {
    expect(getTabForField(field)).toBe(tab)
  })

  it("maps every field listed in TAB_FIELDS back to its own tab", () => {
    for (const tab of Object.keys(TAB_FIELDS) as TabKey[]) {
      for (const field of TAB_FIELDS[tab]) expect(getTabForField(field)).toBe(tab)
    }
  })
})

describe("ALL_FIELDS", () => {
  it("is every tab's fields in tab order", () => {
    expect(ALL_FIELDS).toEqual([...TAB_FIELDS.basic, ...TAB_FIELDS.details, ...TAB_FIELDS.media])
  })
})

describe("countTabErrors", () => {
  const errors = { name: "x", price: "x", description: "x", coverPhoto: "x", submit: "backend said no" }

  it.each([
    ["basic", 2],
    ["details", 1],
    ["media", 1],
  ] as const)("counts %s errors (never the submit error)", (tab, count) => {
    expect(countTabErrors(errors, tab)).toBe(count)
  })

  it("is 0 with no errors", () => {
    expect(countTabErrors({}, "basic")).toBe(0)
  })
})

describe("fieldsBetweenTabs", () => {
  it.each([
    ["basic", "details", [...TAB_FIELDS.basic]],
    ["basic", "media", [...TAB_FIELDS.basic, ...TAB_FIELDS.details]],
    ["details", "media", [...TAB_FIELDS.details]],
    ["basic", "basic", []],
    ["details", "basic", []],
    ["media", "basic", []],
    ["media", "details", []],
  ] as const)("%s -> %s", (from, to, expected) => {
    expect(fieldsBetweenTabs(from, to)).toEqual(expected)
  })
})

describe("adjacentTab", () => {
  it.each([
    ["basic", -1, null],
    ["basic", 1, "details"],
    ["details", -1, "basic"],
    ["details", 1, "media"],
    ["media", -1, "details"],
    ["media", 1, null],
  ] as const)("%s %i -> %s", (tab, step, expected) => {
    expect(adjacentTab(tab, step)).toBe(expected)
  })
})

describe("withoutError", () => {
  it("drops the named error", () => {
    expect(withoutError({ name: "a", price: "b" }, "name")).toEqual({ price: "b" })
  })

  it("returns the same object when there is nothing to drop", () => {
    const errors = { price: "b" }
    expect(withoutError(errors, "name")).toBe(errors)
  })
})

describe("resolveEditorMode", () => {
  it.each([
    [false, false, "create"],
    [true, false, "edit"],
    [false, true, "reviewEdit"],
    // Both URL params present: review edit wins (the full form and its labels).
    [true, true, "reviewEdit"],
  ] as const)("isEditMode=%s isReviewEditMode=%s -> %s", (isEditMode, isReviewEditMode, mode) => {
    expect(resolveEditorMode({ isEditMode, isReviewEditMode })).toBe(mode)
  })
})
