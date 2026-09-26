import { describe, expect, it } from "vitest"
import {
  formatDateOnly,
  formatDateTime,
  formatOrderItemStatus,
  formatRefundStatus,
  formatTimeOnly,
  getOrderItemStatusTagClass,
  getSellerFirstTwoLetters,
  getShippingLabelText,
} from "./order-format"

// Moved verbatim from app/buyer-dashboard/orders/lib/order-view-utils.test.ts (Phase 4 §7, O1) -
// assertions unchanged.

describe("formatRefundStatus (real RefundStatus values)", () => {
  it.each([
    { refundStatus: "APPROVED", expected: "Return Approved" },
    { refundStatus: "PENDING", expected: "Return Pending" },
    { refundStatus: "ON_WAY", expected: "Return On Way" },
    { refundStatus: "REJECTED_BY_STRIPE", expected: "Return Rejected By Stripe" },
    { refundStatus: "REJECTED_BY_SELLER", expected: "Return Rejected By Seller" },
    { refundStatus: "ERROR", expected: "Return Error" },
  ])("$refundStatus -> '$expected'", ({ refundStatus, expected }) => {
    expect(formatRefundStatus(refundStatus)).toBe(expected)
  })
})

// ---------------------------------------------------------------------------
// Priority 4: date/time formatting + `parseApiDate`'s timezone inference.
// Rule: don't hardcode machine-timezone-dependent wall-clock strings. Instead verify
// `parseApiDate`'s classification of "has timezone info" via INSTANT EQUIVALENCE - two input
// strings that represent the same real-world instant must render identically, no matter what
// timezone the test machine is in, because both sides go through the same formatter call in the
// same process. Y6/Y7-style backend timezone-shift bugs are explicitly out of scope; this only
// locks `parseApiDate`'s own classification (see src/lib/helpers/format.ts), not whether that
// classification is "correct" for any particular backend field.
// ---------------------------------------------------------------------------
describe("formatDateTime / formatDateOnly / formatTimeOnly - timezone regex behaviour", () => {
  const baselineZ = "2026-05-20T10:30:00Z"

  it.each([
    { name: "no tz, T separator (bare ISO local) -> treated as UTC", value: "2026-05-20T10:30:00" },
    {
      name: "no tz, space separator (legacy 'yyyy-MM-dd HH:mm:ss' backend format) -> treated as UTC",
      value: "2026-05-20 10:30:00",
    },
    {
      name: "explicit +00:00 offset -> recognized as already having tz info, parses to the same instant",
      value: "2026-05-20T10:30:00+00:00",
    },
    { name: "lowercase z suffix -> recognized as having tz info", value: "2026-05-20T10:30:00z" },
  ])("$name", ({ value }) => {
    expect(formatDateTime(value)).toBe(formatDateTime(baselineZ))
    expect(formatDateOnly(value)).toBe(formatDateOnly(baselineZ))
    expect(formatTimeOnly(value)).toBe(formatTimeOnly(baselineZ))
  })

  it("a +02:00 offset is honored (not blindly re-interpreted as UTC): 10:30+02:00 == 08:30Z", () => {
    expect(formatDateTime("2026-05-20T10:30:00+02:00")).toBe(formatDateTime("2026-05-20T08:30:00Z"))
    expect(formatTimeOnly("2026-05-20T10:30:00+02:00")).toBe(formatTimeOnly("2026-05-20T08:30:00Z"))
  })

  it("a -05:00 offset is honored: 10:30-05:00 == 15:30Z", () => {
    expect(formatDateTime("2026-05-20T10:30:00-05:00")).toBe(formatDateTime("2026-05-20T15:30:00Z"))
  })

  it("a date-only value with no time component is read as a LOCAL calendar date, not UTC midnight", () => {
    // Was: normalized to UTC midnight, same as "2026-05-20T00:00:00Z" - which rendered as the
    // previous day ("May 19, 2026") on any machine west of UTC (all of the US). A calendar date
    // like an order date must never shift days depending on the viewer's timezone, so this now
    // goes through `parseApiDate`'s date-only branch (`new Date(y, m-1, d)`) instead, and the two
    // no longer produce the same output on a US machine.
    expect(formatDateOnly("2026-05-20")).toBe("May 20, 2026")
  })

  it("a malformed single-digit offset (+2:00) fails the regex, gets 'Z' appended onto an already-offset string, and becomes an invalid date", () => {
    // Regex boundary: `\d{2}` requires two digits. This is the "not >= two digits" edge that a
    // sloppy regex mutation (e.g. \d{1,2}) would silently swallow.
    expect(formatDateTime("2026-05-20T10:30:00+2:00")).toBe("-")
  })

  it.each([
    { fn: formatDateTime, name: "formatDateTime" },
    { fn: formatDateOnly, name: "formatDateOnly" },
    { fn: formatTimeOnly, name: "formatTimeOnly" },
  ])("$name returns '-' for null, undefined, empty string, and unparseable input", ({ fn }) => {
    expect(fn(null)).toBe("-")
    expect(fn(undefined)).toBe("-")
    expect(fn("")).toBe("-")
    expect(fn("not-a-date")).toBe("-")
  })
})

describe("getSellerFirstTwoLetters", () => {
  it.each([
    { name: "empty string -> 'SE' fallback", value: "", expected: "SE" },
    { name: "whitespace only -> 'SE' fallback", value: "   ", expected: "SE" },
    { name: "single word, 2+ letters -> first two letters uppercased", value: "acme", expected: "AC" },
    { name: "single word, 1 letter -> that one letter", value: "a", expected: "A" },
    { name: "two words -> first letter of each, uppercased", value: "Acme Store", expected: "AS" },
    { name: "three+ words -> only the first two are used", value: "Acme Dental Store", expected: "AD" },
    { name: "extra internal whitespace is collapsed", value: "  Acme    Store  ", expected: "AS" },
  ])("$name", ({ value, expected }) => {
    expect(getSellerFirstTwoLetters(value)).toBe(expected)
  })
})

// Backend contract check (order/enums/OrderItemStatus.java): tested with the real enum tokens.
describe("formatOrderItemStatus", () => {
  it.each([
    { status: "WAITING_FOR_SHIPMENT", expected: "Waiting For Shipment" },
    { status: "ON_WAY", expected: "On Way" },
    { status: "DELIVERED", expected: "Delivered" },
    { status: "SELLER_REJECTED_RETURN", expected: "Seller Rejected Return" },
    { status: "CANCELLATION_PENDING", expected: "Cancellation Pending" },
  ])("$status -> '$expected'", ({ status, expected }) => {
    expect(formatOrderItemStatus(status)).toBe(expected)
  })

  it("handles a leading underscore (empty first segment) without throwing", () => {
    expect(formatOrderItemStatus("_LEADING")).toBe(" Leading")
  })
})

describe("getOrderItemStatusTagClass", () => {
  it.each([
    { status: "CANCELLED", token: "danger" },
    { status: "CANCELLATION_PENDING", token: "danger" },
    { status: "CANCELLED_ONLY_ITEMS", token: "danger" },
    { status: "DELIVERED", token: "success" },
    { status: "ON_WAY", token: "warning" },
    { status: "WAITING_FOR_UBER_DIRECT", token: "warning" },
    { status: "PROCESSING", token: "warning" },
    { status: "PAYMENT_FAILED", token: "warning" },
    { status: "RETURNED", token: "brand" },
    { status: "REFUNDED", token: "brand" },
    { status: "SELLER_REJECTED_RETURN", token: "brand" },
    { status: "SHIPMENT_ERROR", token: "brand" },
  ])("$status -> class contains '$token'", ({ status, token }) => {
    expect(getOrderItemStatusTagClass(status)).toContain(token)
  })

  // Regression for a real bug found and fixed during this test pass: WAITING_FOR_SHIPMENT
  // contains the substring "SHIP", which used to make the "already shipped" branch match a
  // not-yet-shipped item, giving it the same brand/blue badge as SHIPMENT_ERROR. A waiting item
  // must render with the neutral "waiting" (warning) styling, distinct from anything shipped.
  it("does NOT tag a not-yet-shipped item (WAITING_FOR_SHIPMENT) with the 'already shipped' brand color", () => {
    const waitingClass = getOrderItemStatusTagClass("WAITING_FOR_SHIPMENT")
    expect(waitingClass).toContain("warning")
    expect(waitingClass).not.toContain("brand")
  })
})

describe("getShippingLabelText", () => {
  it("returns the plain label text for a normal (non-return) shipment", () => {
    expect(getShippingLabelText(false)).toBe("Shipping Label")
  })

  it("returns the return-specific label text for a return shipment", () => {
    expect(getShippingLabelText(true)).toBe("Return Shipping Label")
  })
})
