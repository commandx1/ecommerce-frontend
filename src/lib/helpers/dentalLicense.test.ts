import { describe, expect, it } from "vitest"
import { makeLicense } from "@/test/factories"
import { getRejectionReason, isDentalLicenseRequiredValue, resolveDentalLicenseStatus } from "./dentalLicense"

describe("isDentalLicenseRequiredValue", () => {
  it.each(["true", "TRUE", "yes", "YES", "1", "  yes  "])('treats "%s" as requiring a license', (value) => {
    expect(isDentalLicenseRequiredValue(value)).toBe(true)
  })

  it.each(["false", "no", "0", "", null, undefined])("treats %s as not requiring a license", (value) => {
    expect(isDentalLicenseRequiredValue(value)).toBe(false)
  })

  it("does not throw and returns false for a non-string runtime value", () => {
    // biome-ignore lint/suspicious/noExplicitAny: intentionally exercising a non-string value
    expect(isDentalLicenseRequiredValue(true as any)).toBe(false)
  })
})

describe("resolveDentalLicenseStatus", () => {
  it('is "valid" when an approved, unexpired license exists', () => {
    const licenses = [makeLicense({ approved: true, expired: false })]
    expect(resolveDentalLicenseStatus(licenses)).toBe("valid")
  })

  it('is "pending" when the only license is awaiting review', () => {
    const licenses = [makeLicense({ approved: null, expired: false })]
    expect(resolveDentalLicenseStatus(licenses)).toBe("pending")
  })

  it('is "expired" when the only license was approved but has since expired', () => {
    const licenses = [makeLicense({ approved: true, expired: true })]
    expect(resolveDentalLicenseStatus(licenses)).toBe("expired")
  })

  it('is "rejected" when the only license was rejected', () => {
    const licenses = [makeLicense({ approved: false })]
    expect(resolveDentalLicenseStatus(licenses)).toBe("rejected")
  })

  it('is "missing" for an empty license list', () => {
    expect(resolveDentalLicenseStatus([])).toBe("missing")
  })

  // A pending license that is ALSO marked expired matches neither the "valid" nor the "pending"
  // branch (both require `!expired`), so it falls all the way through to "missing" rather than
  // being miscounted as any actionable status.
  it('is "missing" when the only license is pending but flagged expired', () => {
    const licenses = [makeLicense({ approved: null, expired: true })]
    expect(resolveDentalLicenseStatus(licenses)).toBe("missing")
  })

  // Precedence: a buyer can hold several licenses at once. "valid" wins over every other status,
  // because checkout already works for them regardless of what else is on file.
  it("prefers valid over rejected, pending and expired licenses held at the same time", () => {
    const licenses = [
      makeLicense({ id: "l-1", approved: false }),
      makeLicense({ id: "l-2", approved: null, expired: false }),
      makeLicense({ id: "l-3", approved: true, expired: true }),
      makeLicense({ id: "l-4", approved: true, expired: false }),
    ]
    expect(resolveDentalLicenseStatus(licenses)).toBe("valid")
  })

  // Precedence: without a valid license, "pending" (still actionable, just waiting) outranks
  // "expired" and "rejected".
  it("prefers pending over rejected and expired when there is no valid license", () => {
    const licenses = [
      makeLicense({ id: "l-1", approved: false }),
      makeLicense({ id: "l-2", approved: true, expired: true }),
      makeLicense({ id: "l-3", approved: null, expired: false }),
    ]
    expect(resolveDentalLicenseStatus(licenses)).toBe("pending")
  })

  // Precedence: without a valid or pending license, "expired" (was approved once) outranks a
  // flat "rejected".
  it("prefers expired over rejected when there is no valid or pending license", () => {
    const licenses = [
      makeLicense({ id: "l-1", approved: false }),
      makeLicense({ id: "l-2", approved: true, expired: true }),
    ]
    expect(resolveDentalLicenseStatus(licenses)).toBe("expired")
  })
})

describe("getRejectionReason", () => {
  it("returns the trimmed rejection reason of the rejected license", () => {
    const licenses = [makeLicense({ approved: false, rejectDescription: "  Expired ID scan  " })]
    expect(getRejectionReason(licenses)).toBe("Expired ID scan")
  })

  it("returns null when the rejected license carries no reason", () => {
    const licenses = [makeLicense({ approved: false, rejectDescription: null })]
    expect(getRejectionReason(licenses)).toBeNull()
  })

  it("returns null when the reason is whitespace-only", () => {
    const licenses = [makeLicense({ approved: false, rejectDescription: "   " })]
    expect(getRejectionReason(licenses)).toBeNull()
  })

  it("returns null when there is no rejected license at all", () => {
    const licenses = [makeLicense({ approved: true, expired: false })]
    expect(getRejectionReason(licenses)).toBeNull()
  })
})
