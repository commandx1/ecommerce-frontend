import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { formatRelativeDate } from "./relative-date"

const NOW = new Date("2026-08-30T12:00:00Z")

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(NOW)
})

afterEach(() => {
  vi.useRealTimers()
})

describe("formatRelativeDate", () => {
  it("returns an empty string for a null date", () => {
    expect(formatRelativeDate(null)).toBe("")
  })

  it("returns 'Today' for the same day", () => {
    expect(formatRelativeDate("2026-08-30T09:00:00Z")).toBe("Today")
  })

  it("returns 'Yesterday' for one day back", () => {
    expect(formatRelativeDate("2026-08-29T09:00:00Z")).toBe("Yesterday")
  })

  it.each([
    ["2026-08-25T09:00:00Z", "5 days ago"],
    ["2026-08-24T09:00:00Z", "6 days ago"],
  ])("returns '%s' -> %s for 2-6 days back", (date, expected) => {
    expect(formatRelativeDate(date)).toBe(expected)
  })

  it.each([
    ["2026-08-23T09:00:00Z", "1w ago"],
    ["2026-08-09T09:00:00Z", "3w ago"],
  ])("returns weeks-ago for 7-29 days back: %s -> %s", (date, expected) => {
    expect(formatRelativeDate(date)).toBe(expected)
  })

  it("falls back to a short date at 30 days and beyond", () => {
    expect(formatRelativeDate("2026-06-01T09:00:00Z")).not.toMatch(/ago$/)
  })
})
