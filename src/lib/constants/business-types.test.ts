import { describe, expect, it } from "vitest"
import { BUSINESS_TYPE_LABELS, BUSINESS_TYPE_OPTIONS, BUSINESS_TYPES } from "./business-types"

describe("BUSINESS_TYPES", () => {
  it("exposes the raw backend values", () => {
    expect(BUSINESS_TYPES.PERSONAL_CUSTOMER).toBe("Personal_Customer")
    expect(BUSINESS_TYPES.DENTAL_PRACTICE).toBe("Dental_Practice")
  })
})

describe("BUSINESS_TYPE_LABELS", () => {
  it("maps PERSONAL_CUSTOMER to its display label", () => {
    expect(BUSINESS_TYPE_LABELS[BUSINESS_TYPES.PERSONAL_CUSTOMER]).toBe("Personal Customer")
  })

  it("maps DENTAL_PRACTICE to its display label", () => {
    expect(BUSINESS_TYPE_LABELS[BUSINESS_TYPES.DENTAL_PRACTICE]).toBe("Dental Practice")
  })

  it("has exactly one label per business type value", () => {
    expect(Object.keys(BUSINESS_TYPE_LABELS)).toHaveLength(Object.values(BUSINESS_TYPES).length)
  })
})

describe("BUSINESS_TYPE_OPTIONS", () => {
  it("contains one option per business type, in declaration order", () => {
    expect(BUSINESS_TYPE_OPTIONS).toEqual([
      { value: "Personal_Customer", label: "Personal Customer" },
      { value: "Dental_Practice", label: "Dental Practice" },
    ])
  })

  it("keeps each option's value and label in sync with the source maps", () => {
    for (const option of BUSINESS_TYPE_OPTIONS) {
      expect(option.label).toBe(BUSINESS_TYPE_LABELS[option.value])
    }
  })
})
