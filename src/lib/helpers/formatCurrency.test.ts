import { describe, expect, it } from "vitest"
import formatCurrency from "./formatCurrency"

describe("formatCurrency", () => {
  it("formats a whole number as USD", () => {
    expect(formatCurrency(10)).toBe("$10.00")
  })

  it("formats a decimal amount", () => {
    expect(formatCurrency(19.99)).toBe("$19.99")
  })

  it("formats zero", () => {
    expect(formatCurrency(0)).toBe("$0.00")
  })

  it("formats a negative amount", () => {
    expect(formatCurrency(-42.5)).toBe("-$42.50")
  })

  it("formats a very large amount with thousands separators", () => {
    expect(formatCurrency(1234567.89)).toBe("$1,234,567.89")
  })

  it("falls back to $0.00 for null (source uses `amount || 0`)", () => {
    expect(formatCurrency(null as unknown as number)).toBe("$0.00")
  })

  it("falls back to $0.00 for undefined (source uses `amount || 0`)", () => {
    expect(formatCurrency(undefined as unknown as number)).toBe("$0.00")
  })

  it("falls back to $0.00 for Infinity instead of leaking a literal infinity symbol", () => {
    expect(formatCurrency(Number.POSITIVE_INFINITY)).toBe("$0.00")
  })

  it("falls back to $0.00 for -Infinity instead of leaking a literal infinity symbol", () => {
    expect(formatCurrency(Number.NEGATIVE_INFINITY)).toBe("$0.00")
  })
})
