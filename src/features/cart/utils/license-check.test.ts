import { describe, expect, it } from "vitest"
import { makeCartItem, makeLicense } from "@/test/factories"
import { cartRequiresDentalLicense, hasValidDentalLicense } from "./license-check"

describe("cartRequiresDentalLicense", () => {
  // Fragile by design: the source does a strict `=== "Yes"` comparison, so only the
  // exact string "Yes" triggers the requirement. Any other casing, or a boolean true,
  // silently fails to require a license. Locking this in as-is per instructions.
  it('requires a license only for the exact string "Yes"', () => {
    const items = [
      makeCartItem({
        product: {
          id: "p-1",
          name: "Item",
          coverPhotoPath: "/x.png",
          productAlert: null,
          dentalLicenseRequired: "Yes",
        },
      }),
    ]
    expect(cartRequiresDentalLicense(items)).toBe(true)
  })

  it('does not require a license for lowercase "yes"', () => {
    const items = [
      makeCartItem({
        product: {
          id: "p-1",
          name: "Item",
          coverPhotoPath: "/x.png",
          productAlert: null,
          dentalLicenseRequired: "yes",
        },
      }),
    ]
    expect(cartRequiresDentalLicense(items)).toBe(false)
  })

  it('does not require a license for uppercase "YES"', () => {
    const items = [
      makeCartItem({
        product: {
          id: "p-1",
          name: "Item",
          coverPhotoPath: "/x.png",
          productAlert: null,
          dentalLicenseRequired: "YES",
        },
      }),
    ]
    expect(cartRequiresDentalLicense(items)).toBe(false)
  })

  it("does not require a license for the boolean true (only the literal string counts)", () => {
    const items = [
      makeCartItem({
        product: {
          id: "p-1",
          name: "Item",
          coverPhotoPath: "/x.png",
          productAlert: null,
          // biome-ignore lint/suspicious/noExplicitAny: intentionally exercising a non-string value
          dentalLicenseRequired: true as any,
        },
      }),
    ]
    expect(cartRequiresDentalLicense(items)).toBe(false)
  })

  it("does not require a license when the field is null", () => {
    const items = [
      makeCartItem({
        product: { id: "p-1", name: "Item", coverPhotoPath: "/x.png", productAlert: null, dentalLicenseRequired: null },
      }),
    ]
    expect(cartRequiresDentalLicense(items)).toBe(false)
  })

  it("does not require a license when the field is undefined", () => {
    const items = [
      makeCartItem({
        product: {
          id: "p-1",
          name: "Item",
          coverPhotoPath: "/x.png",
          productAlert: null,
          // biome-ignore lint/suspicious/noExplicitAny: intentionally exercising a missing value
          dentalLicenseRequired: undefined as any,
        },
      }),
    ]
    expect(cartRequiresDentalLicense(items)).toBe(false)
  })

  it("does not require a license when the field is an empty string", () => {
    const items = [
      makeCartItem({
        product: { id: "p-1", name: "Item", coverPhotoPath: "/x.png", productAlert: null, dentalLicenseRequired: "" },
      }),
    ]
    expect(cartRequiresDentalLicense(items)).toBe(false)
  })

  it("returns false for an empty cart", () => {
    expect(cartRequiresDentalLicense([])).toBe(false)
  })
})

describe("hasValidDentalLicense", () => {
  it("is true when a license is approved and not expired", () => {
    const licenses = [makeLicense({ approved: true, expired: false })]
    expect(hasValidDentalLicense(licenses)).toBe(true)
  })

  it("is false when approved but expired", () => {
    const licenses = [makeLicense({ approved: true, expired: true })]
    expect(hasValidDentalLicense(licenses)).toBe(false)
  })

  it("is false when approved is truthy but not strictly true (e.g. 1)", () => {
    const licenses = [makeLicense({ approved: 1 as unknown as boolean, expired: false })]
    expect(hasValidDentalLicense(licenses)).toBe(false)
  })

  it('is false when approved is truthy but not strictly true (e.g. "true")', () => {
    const licenses = [makeLicense({ approved: "true" as unknown as boolean, expired: false })]
    expect(hasValidDentalLicense(licenses)).toBe(false)
  })

  it("is false when approved is null (pending review)", () => {
    const licenses = [makeLicense({ approved: null, expired: false })]
    expect(hasValidDentalLicense(licenses)).toBe(false)
  })

  it("is false when approved is false (rejected)", () => {
    const licenses = [makeLicense({ approved: false, expired: false })]
    expect(hasValidDentalLicense(licenses)).toBe(false)
  })

  it("is false for an empty license list", () => {
    expect(hasValidDentalLicense([])).toBe(false)
  })

  it("is true when at least one of several licenses is valid", () => {
    const licenses = [makeLicense({ approved: false, expired: false }), makeLicense({ approved: true, expired: false })]
    expect(hasValidDentalLicense(licenses)).toBe(true)
  })
})
