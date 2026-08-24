import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { describeNextOrderDate } from "./auto-order-view-utils"

const NOW = new Date("2026-01-15T12:00:00Z")

describe("describeNextOrderDate", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(NOW)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("returns null for null", () => {
    expect(describeNextOrderDate(null)).toBeNull()
  })

  it("returns null for undefined", () => {
    expect(describeNextOrderDate(undefined)).toBeNull()
  })

  it("returns null for an empty string", () => {
    expect(describeNextOrderDate("")).toBeNull()
  })

  it("returns null for an unparseable value", () => {
    expect(describeNextOrderDate("not-a-date")).toBeNull()
  })

  it('returns "today" when the next order date is right now', () => {
    expect(describeNextOrderDate("2026-01-15T12:00:00")).toBe("today")
  })

  it('returns "tomorrow" for a naive LocalDateTime exactly one day ahead (treated as UTC)', () => {
    expect(describeNextOrderDate("2026-01-16T12:00:00")).toBe("tomorrow")
  })

  it('returns "tomorrow" for the equivalent value already carrying a Z suffix', () => {
    expect(describeNextOrderDate("2026-01-16T12:00:00Z")).toBe("tomorrow")
  })

  it('returns "tomorrow" for the equivalent value with a +00:00 offset', () => {
    expect(describeNextOrderDate("2026-01-16T12:00:00+00:00")).toBe("tomorrow")
  })

  it("normalizes a space-separated naive datetime the same as a T-separated one", () => {
    expect(describeNextOrderDate("2026-01-16 12:00:00")).toBe("tomorrow")
  })

  it('returns "in N days" for a date further in the future', () => {
    expect(describeNextOrderDate("2026-01-27T12:00:00")).toBe("in 12 days")
  })

  it('returns "due now" for a date in the past', () => {
    expect(describeNextOrderDate("2026-01-14T12:00:00")).toBe("due now")
  })

  it('returns "due now" for a date well in the past', () => {
    expect(describeNextOrderDate("2025-12-01T12:00:00")).toBe("due now")
  })
})
