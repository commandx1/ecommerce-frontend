import { describe, expect, it } from "vitest"
import { formatUnreadBadge } from "./format-unread-badge"

describe("formatUnreadBadge", () => {
  it("returns null for zero, negative, missing or non-finite counts", () => {
    expect(formatUnreadBadge(0)).toBeNull()
    expect(formatUnreadBadge(-1)).toBeNull()
    expect(formatUnreadBadge(undefined)).toBeNull()
    expect(formatUnreadBadge(null)).toBeNull()
    expect(formatUnreadBadge(Number.NaN)).toBeNull()
    expect(formatUnreadBadge(Number.POSITIVE_INFINITY)).toBeNull()
  })

  it("returns the count as a string when within the cap", () => {
    expect(formatUnreadBadge(1)).toBe("1")
    expect(formatUnreadBadge(99)).toBe("99")
  })

  it("caps at '99+' above 99", () => {
    expect(formatUnreadBadge(100)).toBe("99+")
  })
})
