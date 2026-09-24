import { describe, expect, it } from "vitest"
import {
  CURRENCY,
  formatCurrency,
  formatLongDate,
  formatNumber,
  formatNumericDate,
  formatPaddedDate,
  formatPaddedDateTime,
  formatShortDate,
  formatTime,
  LOCALE,
  parseApiDate,
} from "./format"

describe("LOCALE / CURRENCY", () => {
  it("pins the locale and currency used by every formatter", () => {
    expect(LOCALE).toBe("en-US")
    expect(CURRENCY).toBe("USD")
  })
})

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

  it("falls back to $0.00 for null", () => {
    expect(formatCurrency(null as unknown as number)).toBe("$0.00")
  })

  it("falls back to $0.00 for undefined", () => {
    expect(formatCurrency(undefined as unknown as number)).toBe("$0.00")
  })

  it("falls back to $0.00 for NaN", () => {
    expect(formatCurrency(Number.NaN)).toBe("$0.00")
  })

  it("falls back to $0.00 for Infinity", () => {
    expect(formatCurrency(Number.POSITIVE_INFINITY)).toBe("$0.00")
  })

  it("falls back to $0.00 for -Infinity", () => {
    expect(formatCurrency(Number.NEGATIVE_INFINITY)).toBe("$0.00")
  })
})

describe("formatNumber", () => {
  it("groups thousands", () => {
    expect(formatNumber(1234567)).toBe("1,234,567")
  })

  it("formats a small integer without separators", () => {
    expect(formatNumber(7)).toBe("7")
  })

  it("formats zero", () => {
    expect(formatNumber(0)).toBe("0")
  })

  it("formats a negative number", () => {
    expect(formatNumber(-1234)).toBe("-1,234")
  })

  it("formats NaN as the literal string NaN (no guard, unlike formatCurrency)", () => {
    expect(formatNumber(Number.NaN)).toBe("NaN")
  })
})

// Dates are built from local (year, month, day, ...) components rather than parsed from ISO "Z"
// strings, so the assertions below don't depend on the machine's timezone (see the
// timezone-regex comment in order-view-utils.test.ts for why that matters).

describe("formatShortDate", () => {
  it("formats with a non-padded day and short month name", () => {
    expect(formatShortDate(new Date(2026, 4, 20))).toBe("May 20, 2026")
  })

  it("does not zero-pad single-digit days", () => {
    expect(formatShortDate(new Date(2026, 4, 5))).toBe("May 5, 2026")
  })

  it("accepts an ISO date string", () => {
    expect(formatShortDate("2026-01-01T12:00:00")).toBe("Jan 1, 2026")
  })

  it("returns the literal string Invalid Date for unparseable input, without throwing", () => {
    expect(formatShortDate("not-a-date")).toBe("Invalid Date")
  })
})

describe("formatLongDate", () => {
  it("formats with a long month name", () => {
    expect(formatLongDate(new Date(2026, 4, 20))).toBe("May 20, 2026")
  })

  it("spells out months that differ from their short form", () => {
    expect(formatLongDate(new Date(2026, 8, 1))).toBe("September 1, 2026")
  })
})

describe("formatPaddedDate", () => {
  it("zero-pads single-digit days", () => {
    expect(formatPaddedDate(new Date(2026, 4, 5))).toBe("May 05, 2026")
  })

  it("formats a two-digit day unchanged", () => {
    expect(formatPaddedDate(new Date(2026, 4, 20))).toBe("May 20, 2026")
  })

  it("returns the literal string Invalid Date for unparseable input, without throwing", () => {
    expect(formatPaddedDate("not-a-date")).toBe("Invalid Date")
  })
})

describe("formatPaddedDateTime", () => {
  it("formats date and time with a zero-padded day", () => {
    expect(formatPaddedDateTime(new Date(2026, 4, 5, 14, 30))).toBe("May 05, 2026, 02:30 PM")
  })
})

describe("formatNumericDate", () => {
  it("formats with the locale-default numeric date shape", () => {
    expect(formatNumericDate(new Date(2026, 4, 5))).toBe("5/5/2026")
  })

  it("returns the literal string Invalid Date for unparseable input, without throwing", () => {
    expect(formatNumericDate("not-a-date")).toBe("Invalid Date")
  })
})

describe("formatTime", () => {
  it("formats hour and minute, 12-hour clock", () => {
    expect(formatTime(new Date(2026, 4, 5, 14, 30))).toBe("02:30 PM")
  })

  it("returns the literal string Invalid Date for unparseable input, without throwing", () => {
    expect(formatTime("not-a-date")).toBe("Invalid Date")
  })
})

// parseApiDate is the UTC contract every date formatter above goes through: the backend
// (ecommerce-api) serializes createdDate/timestamp fields from a zoneless Java LocalDateTime on a
// UTC JVM, so a wire string with no zone suffix always means UTC - never the viewer's local time.
// These assertions are written to hold regardless of the machine's timezone (compare via UTC/local
// component getters or Date.UTC, never a hardcoded formatted string), and are also run under
// TZ=America/Los_Angeles / TZ=America/New_York in CI to prove the parsing is timezone-independent.
describe("parseApiDate", () => {
  it("passes a Date instance through unchanged", () => {
    const original = new Date(2026, 4, 20, 10, 30)
    expect(parseApiDate(original)).toBe(original)
  })

  it("treats a number as epoch milliseconds", () => {
    const ms = Date.UTC(2026, 4, 20, 10, 30)
    expect(parseApiDate(ms).getTime()).toBe(ms)
  })

  it("reads a date-only 'YYYY-MM-DD' string as a LOCAL calendar date, never shifting the day", () => {
    const parsed = parseApiDate("2026-05-20")
    expect(parsed.getFullYear()).toBe(2026)
    expect(parsed.getMonth()).toBe(4)
    expect(parsed.getDate()).toBe(20)
    expect(parsed.getHours()).toBe(0)
  })

  it("treats a zoneless 'T'-separated datetime string as UTC", () => {
    const parsed = parseApiDate("2026-05-20T02:00:00")
    expect(parsed.getTime()).toBe(Date.UTC(2026, 4, 20, 2, 0, 0))
  })

  it("treats a zoneless space-separated datetime string (legacy backend format) as UTC", () => {
    const parsed = parseApiDate("2026-05-20 02:00:00")
    expect(parsed.getTime()).toBe(Date.UTC(2026, 4, 20, 2, 0, 0))
  })

  it("treats a zoneless datetime string with fractional seconds as UTC", () => {
    const parsed = parseApiDate("2026-05-20T02:00:00.123456")
    expect(parsed.getUTCFullYear()).toBe(2026)
    expect(parsed.getUTCMonth()).toBe(4)
    expect(parsed.getUTCDate()).toBe(20)
    expect(parsed.getUTCHours()).toBe(2)
  })

  it("honors an explicit Z suffix as already being UTC", () => {
    const parsed = parseApiDate("2026-05-20T02:00:00Z")
    expect(parsed.getTime()).toBe(Date.UTC(2026, 4, 20, 2, 0, 0))
  })

  it("honors an explicit +hh:mm offset instead of re-interpreting it as UTC", () => {
    const parsed = parseApiDate("2026-05-20T10:30:00+02:00")
    expect(parsed.getTime()).toBe(Date.UTC(2026, 4, 20, 8, 30, 0))
  })

  it("honors an explicit -hh:mm offset instead of re-interpreting it as UTC", () => {
    const parsed = parseApiDate("2026-05-20T10:30:00-05:00")
    expect(parsed.getTime()).toBe(Date.UTC(2026, 4, 20, 15, 30, 0))
  })

  it("returns an Invalid Date for unparseable input instead of throwing", () => {
    const parsed = parseApiDate("not-a-date")
    expect(Number.isNaN(parsed.getTime())).toBe(true)
  })
})
