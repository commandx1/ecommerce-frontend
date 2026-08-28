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

  // A pasted number with a leading NANP country code ("1") is recognized and stripped,
  // recovering the real 10-digit number instead of truncating off its last digit.
  it("strips a leading country code '1' from an 11-digit input", () => {
    expect(normalizePhoneNumber("11234567890")).toBe("1234567890")
  })

  it("strips a leading country code '1' from a pasted +1-prefixed number", () => {
    expect(normalizePhoneNumber("+1 415 555 0123")).toBe("4155550123")
  })

  // An 11-digit input that does NOT start with "1" isn't a recognizable NANP country
  // code, so nothing is stripped — the digits are preserved rather than silently
  // truncated, letting downstream validation (e.g. the registration form's 10-digit
  // regex) reject it instead of silently accepting a corrupted number.
  it("does not strip or truncate an 11-digit input not starting with '1'", () => {
    expect(normalizePhoneNumber("44207946000")).toBe("44207946000")
  })

  it("does not truncate a long non-phone digit string; preserves all digits", () => {
    expect(normalizePhoneNumber("123456789012345")).toBe("123456789012345")
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

  // A pasted country-code-prefixed number formats to the correct 10-digit number,
  // instead of silently truncating to the wrong last-10-digits.
  it("strips a recognized country code before formatting an 11-digit input", () => {
    expect(formatPhoneNumber("11234567890")).toBe("(123) 456-7890")
  })

  it("strips a recognized country code before formatting a pasted +1 number", () => {
    expect(formatPhoneNumber("+1 415 555 0123")).toBe("(415) 555-0123")
  })

  // Unrecognized overflow (not a NANP country code) is preserved rather than truncated,
  // so no digits are silently dropped even though the grouped format is no longer
  // meaningful past 10 digits.
  it("does not drop digits when formatting an unrecognized 11-digit input", () => {
    expect(formatPhoneNumber("44207946000")).toBe("(442) 079-46000")
  })

  it("strips non-digit characters before formatting", () => {
    expect(formatPhoneNumber("(123) 456-7890")).toBe("(123) 456-7890")
  })
})
