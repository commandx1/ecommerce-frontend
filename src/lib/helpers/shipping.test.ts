import { describe, expect, it } from "vitest"
import { hasHeavyShipmentFee } from "./shipping"

describe("hasHeavyShipmentFee", () => {
  it("is false for null", () => {
    expect(hasHeavyShipmentFee(null)).toBe(false)
  })

  it("is false for undefined", () => {
    expect(hasHeavyShipmentFee(undefined)).toBe(false)
  })

  it("is false for zero", () => {
    expect(hasHeavyShipmentFee(0)).toBe(false)
  })

  it("is false for a negative number", () => {
    expect(hasHeavyShipmentFee(-5)).toBe(false)
  })

  it("is false for NaN", () => {
    expect(hasHeavyShipmentFee(Number.NaN)).toBe(false)
  })

  it("is false for Infinity", () => {
    expect(hasHeavyShipmentFee(Number.POSITIVE_INFINITY)).toBe(false)
  })

  it("is false for a string number (not a number type)", () => {
    expect(hasHeavyShipmentFee("5" as unknown as number)).toBe(false)
  })

  it("is true for a positive number", () => {
    expect(hasHeavyShipmentFee(12.5)).toBe(true)
  })
})
