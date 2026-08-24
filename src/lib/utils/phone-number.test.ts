import { describe, expect, it } from "vitest"
import { formatPhoneNumber, normalizePhoneNumber } from "./phone-number"

describe("normalizePhoneNumber", () => {
  it("strips letters, spaces, parentheses and dashes, keeping only digits", () => {
    expect(normalizePhoneNumber("(123) 456-7890")).toBe("1234567890")
  })

  it("strips letters mixed into the input", () => {
    expect(normalizePhoneNumber("abc123def456")).toBe("123456")
  })

  it("returns an empty string for an empty input", () => {
    expect(normalizePhoneNumber("")).toBe("")
  })

  it("returns an empty string when there are no digits at all", () => {
    expect(normalizePhoneNumber("abc-def")).toBe("")
  })

  // Edge case: an 11+ digit input is silently truncated to 10 digits rather than
  // rejected. This masks user input errors (e.g. an accidental leading "1" country
  // code, or a typo) instead of surfacing them. Locking in current behavior.
  it("silently truncates 11+ digit input down to 10 digits", () => {
    expect(normalizePhoneNumber("11234567890")).toBe("1123456789")
  })

  it("silently truncates a long non-phone digit string down to 10 digits", () => {
    expect(normalizePhoneNumber("123456789012345")).toBe("1234567890")
  })
})

describe("formatPhoneNumber", () => {
  it("returns an empty string for 0 digits", () => {
    expect(formatPhoneNumber("")).toBe("")
  })

  it("formats 1-3 digits as `(123`", () => {
    expect(formatPhoneNumber("123")).toBe("(123")
  })

  it("formats a single digit as `(1`", () => {
    expect(formatPhoneNumber("1")).toBe("(1")
  })

  it("formats 4-6 digits as `(123) 456`", () => {
    expect(formatPhoneNumber("123456")).toBe("(123) 456")
  })

  it("formats 4 digits as `(123) 4`", () => {
    expect(formatPhoneNumber("1234")).toBe("(123) 4")
  })

  it("formats 7-10 digits as `(123) 456-7890`", () => {
    expect(formatPhoneNumber("1234567890")).toBe("(123) 456-7890")
  })

  it("formats 7 digits as `(123) 456-7`", () => {
    expect(formatPhoneNumber("1234567")).toBe("(123) 456-7")
  })

  // Edge case: 11+ digit input is silently truncated to 10 digits before formatting,
  // masking the extra digits instead of flagging them as invalid.
  it("silently truncates 11+ digit input to 10 digits before formatting", () => {
    expect(formatPhoneNumber("11234567890")).toBe("(112) 345-6789")
  })

  it("strips non-digit characters before formatting", () => {
    expect(formatPhoneNumber("(123) 456-7890")).toBe("(123) 456-7890")
  })
})
