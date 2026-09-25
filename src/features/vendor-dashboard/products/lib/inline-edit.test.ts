import { describe, expect, it } from "vitest"
import {
  isDiscountOutOfRange,
  keepOriginalIfUnchanged,
  parseEditingDraft,
  parseWholeNumber,
  toDecimalInput,
} from "./inline-edit"

describe("toDecimalInput", () => {
  it("rounds the backend's float noise to a display-friendly string", () => {
    expect(toDecimalInput(32.219249999999995)).toBe("32.22")
  })

  it("defaults a missing value to 0", () => {
    expect(toDecimalInput(undefined)).toBe("0")
  })

  it("respects a custom fraction-digit count", () => {
    expect(toDecimalInput(1.005, 0)).toBe("1")
  })
})

describe("keepOriginalIfUnchanged", () => {
  it("returns the untouched original when the rounded value matches it", () => {
    expect(keepOriginalIfUnchanged(32.22, 32.219249999999995)).toBe(32.219249999999995)
  })

  it("returns the new value once it actually differs from the rounded original", () => {
    expect(keepOriginalIfUnchanged(40, 32.219249999999995)).toBe(40)
  })

  it("treats a missing original as 0", () => {
    expect(keepOriginalIfUnchanged(0, undefined)).toBe(0)
    expect(keepOriginalIfUnchanged(5, undefined)).toBe(5)
  })
})

describe("parseWholeNumber", () => {
  it.each([
    ["12", 12],
    ["0", 0],
    ["-3", -3],
  ])("accepts the whole number %s", (input, expected) => {
    expect(parseWholeNumber(input)).toBe(expected)
  })

  it("rejects a fractional value instead of truncating it", () => {
    expect(parseWholeNumber("1.5")).toBeNull()
  })

  it("rejects blank and non-numeric input", () => {
    expect(parseWholeNumber("")).toBeNull()
    expect(parseWholeNumber("   ")).toBeNull()
    expect(parseWholeNumber("abc")).toBeNull()
  })
})

describe("isDiscountOutOfRange", () => {
  it("accepts 0 and 100 as boundary values", () => {
    expect(isDiscountOutOfRange("0")).toBe(false)
    expect(isDiscountOutOfRange("100")).toBe(false)
  })

  it("flags anything outside 0-100", () => {
    expect(isDiscountOutOfRange("150")).toBe(true)
    expect(isDiscountOutOfRange("-1")).toBe(true)
  })

  it("leaves a blank draft to the required-field guard instead of flagging it", () => {
    expect(isDiscountOutOfRange("")).toBe(false)
    expect(isDiscountOutOfRange("   ")).toBe(false)
  })

  it("leaves an unparseable draft alone", () => {
    expect(isDiscountOutOfRange("abc")).toBe(false)
  })
})

describe("parseEditingDraft", () => {
  const validDraft = {
    price: "56",
    discount: "20",
    stock: "40",
    active: "active" as const,
    shipmentFee: "5",
    heavyShippingSurcharge: "0",
  }

  it("parses every field of a valid draft", () => {
    expect(parseEditingDraft(validDraft)).toEqual({
      price: 56,
      discount: 20,
      stock: 40,
      active: true,
      shipmentFee: 5,
      heavyShippingSurcharge: 0,
    })
  })

  it("maps the inactive draft status to false", () => {
    expect(parseEditingDraft({ ...validDraft, active: "inactive" })?.active).toBe(false)
  })

  it.each([
    ["a negative price", { ...validDraft, price: "-1" }],
    ["a discount below 0", { ...validDraft, discount: "-1" }],
    ["a discount above 100", { ...validDraft, discount: "150" }],
    ["a fractional stock count", { ...validDraft, stock: "1.5" }],
    ["a negative stock count", { ...validDraft, stock: "-1" }],
    ["a non-finite shipment fee", { ...validDraft, shipmentFee: "abc" }],
    ["a negative heavy-shipping surcharge", { ...validDraft, heavyShippingSurcharge: "-1" }],
    ["a blank required field", { ...validDraft, price: "" }],
  ])("returns null for %s", (_label, draft) => {
    expect(parseEditingDraft(draft)).toBeNull()
  })
})
