import { describe, expect, it } from "vitest"
import { BUSINESS_TYPE_LABELS, BUSINESS_TYPE_OPTIONS, BUSINESS_TYPES } from "./business-types"

describe("BUSINESS_TYPES", () => {
  it("exposes the raw backend values", () => {
    expect(BUSINESS_TYPES.PERSONAL_CUSTOMER).toBe("Personal_Customer")
    expect(BUSINESS_TYPES.DENTAL_PRACTICE).toBe("Dental_Practice")
  })

  it("has exactly 15 values", () => {
    expect(Object.values(BUSINESS_TYPES)).toHaveLength(15)
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
  // BUSINESS_TYPES still carries all 15 backend values, but the register form deliberately
  // offers only two of them: commit 1fd86af commented the other 13 out of BUSINESS_TYPE_OPTIONS.
  // The two lists are therefore NOT expected to be the same length — asserting the exact
  // shortlist is what keeps an accidental re-open (or a further trim) visible.
  it("offers only the two business types the register form still exposes", () => {
    expect(BUSINESS_TYPE_OPTIONS).toHaveLength(2)
    expect(BUSINESS_TYPE_OPTIONS.map((option) => option.value)).toEqual([
      BUSINESS_TYPES.DENTAL_PRACTICE,
      BUSINESS_TYPES.PERSONAL_CUSTOMER,
    ])
  })

  it("does not offer the commented-out business types", () => {
    const offered = new Set<string>(BUSINESS_TYPE_OPTIONS.map((option) => option.value))
    expect(offered.has(BUSINESS_TYPES.EDUCATIONAL_OR_GOVERNMENT_DENTAL_FACILITY)).toBe(false)
    expect(offered.has(BUSINESS_TYPES.OTHER)).toBe(false)
  })

  it("starts with Dental Practice", () => {
    expect(BUSINESS_TYPE_OPTIONS[0]).toEqual({ value: "Dental_Practice", label: "Dental Practice" })
  })

  it("keeps each option's value and label in sync with the source maps", () => {
    for (const option of BUSINESS_TYPE_OPTIONS) {
      expect(option.label).toBe(BUSINESS_TYPE_LABELS[option.value])
    }
  })
})
