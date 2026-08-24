import { describe, expect, it } from "vitest"
import { getStockColorClass } from "./stockStyles"

// Note: the source takes a pre-computed color keyword ("green" | "yellow" | anything
// else), not a raw stock-count number — there are no numeric thresholds in this file.
// Tests cover the three branches the switch-like logic actually has.
describe("getStockColorClass", () => {
  it('returns the success classes for "green" (in stock)', () => {
    expect(getStockColorClass("green")).toBe("bg-success/14 text-success")
  })

  it('returns the warning classes for "yellow" (low stock)', () => {
    expect(getStockColorClass("yellow")).toBe("bg-warning/14 text-warning")
  })

  it('returns the muted/default classes for "gray" (out of stock)', () => {
    expect(getStockColorClass("gray")).toBe("bg-surface-muted text-text-secondary")
  })

  it("returns the muted/default classes for any unrecognized color value", () => {
    expect(getStockColorClass("purple")).toBe("bg-surface-muted text-text-secondary")
  })

  it("returns the muted/default classes for an empty string", () => {
    expect(getStockColorClass("")).toBe("bg-surface-muted text-text-secondary")
  })
})
