import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { formatRelativeDate } from "./relativeDate"

const NOW = new Date("2026-01-15T12:00:00Z")

function daysAgo(days: number): string {
  return new Date(NOW.getTime() - days * 24 * 60 * 60 * 1000).toISOString()
}

describe("formatRelativeDate", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(NOW)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders "Today" for a timestamp from a moment ago (same calendar-day delta)', () => {
    const justNow = new Date(NOW.getTime() - 60 * 1000).toISOString()
    expect(formatRelativeDate(justNow)).toBe("Today")
  })

  it('renders "Today" for a timestamp one hour ago', () => {
    const oneHourAgo = new Date(NOW.getTime() - 60 * 60 * 1000).toISOString()
    expect(formatRelativeDate(oneHourAgo)).toBe("Today")
  })

  it('renders "1 day ago" for yesterday', () => {
    expect(formatRelativeDate(daysAgo(1))).toBe("1 day ago")
  })

  it('renders "N days ago" while under a week', () => {
    expect(formatRelativeDate(daysAgo(6))).toBe("6 days ago")
  })

  it('renders "1 weeks ago" at exactly 7 days (note: unpluralized "weeks", not "week")', () => {
    expect(formatRelativeDate(daysAgo(7))).toBe("1 weeks ago")
  })

  it('renders "N weeks ago" while under a month', () => {
    expect(formatRelativeDate(daysAgo(29))).toBe("4 weeks ago")
  })

  it('renders "1 months ago" at exactly 30 days', () => {
    expect(formatRelativeDate(daysAgo(30))).toBe("1 months ago")
  })

  it('renders "N months ago" while under a year', () => {
    expect(formatRelativeDate(daysAgo(364))).toBe("12 months ago")
  })

  it('renders "1 years ago" at exactly 365 days', () => {
    expect(formatRelativeDate(daysAgo(365))).toBe("1 years ago")
  })

  // Fragile fallback: a future date produces a negative diffInDays. There is no
  // dedicated branch for "in the future", so it falls through to the "days ago"
  // branch with a negative count, e.g. "-1 days ago" rather than "in 1 day".
  it("has no future-date branch: a date one day ahead renders as a negative days-ago string", () => {
    const oneDayAhead = new Date(NOW.getTime() + 24 * 60 * 60 * 1000).toISOString()
    expect(formatRelativeDate(oneDayAhead)).toBe("-1 days ago")
  })

  // Fragile fallback: an unparseable date string does not throw (Date silently
  // produces an Invalid Date), so the try/catch never triggers. All numeric
  // comparisons against NaN are false, so execution falls through to the final
  // "years ago" branch, rendering the literal string "NaN years ago".
  it("does not hit the catch block for an invalid date string; instead renders NaN years ago", () => {
    expect(formatRelativeDate("not-a-date")).toBe("NaN years ago")
  })
})
