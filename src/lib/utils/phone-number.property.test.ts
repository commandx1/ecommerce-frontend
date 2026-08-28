import fc from "fast-check"
import { describe, expect, it } from "vitest"
import { formatPhoneNumber, normalizePhoneNumber } from "./phone-number"

// normalizePhoneNumber(v) strips non-digits, then strips a leading NANP country code "1"
// only when the result is exactly 11 digits starting with "1" (recovering the true 10-digit
// number instead of truncating it). Any other length is preserved as-is — no digits are ever
// silently dropped.
// formatPhoneNumber(v) = grouped rendering of normalizePhoneNumber(v)
//
// Both functions accept arbitrary strings and must never throw. normalizePhoneNumber is
// idempotent: once the country-code-stripping condition (length === 11 and starts with "1")
// no longer holds — which is guaranteed after at most one application, since stripping always
// changes the length to 10 — further applications are no-ops. formatPhoneNumber re-derives its
// digits from `value` via normalizePhoneNumber every call, and its own output only ever
// contains digits plus the literal characters "(", ")", " ", "-" (all non-digit, so they get stripped
// straight back out) — so re-formatting already-formatted output must reproduce the same string.

const anyString = fc.string({ maxLength: 200 })

describe("normalizePhoneNumber property: never throws and never contains non-digits", () => {
  it("returns a string of only digits for any input string", () => {
    fc.assert(
      fc.property(anyString, (value) => {
        const result = normalizePhoneNumber(value)
        expect(result).toMatch(/^\d*$/)
      }),
      { seed: 42 },
    )
  })
})

describe("normalizePhoneNumber property: no silent data loss outside the recognized country-code case", () => {
  it("preserves every digit when the digit count is not exactly 11, or is 11 but doesn't start with '1'", () => {
    fc.assert(
      fc.property(anyString, (value) => {
        const rawDigits = value.replace(/\D/g, "")
        const isRecognizedCountryCode = rawDigits.length === 11 && rawDigits.startsWith("1")
        if (!isRecognizedCountryCode) {
          expect(normalizePhoneNumber(value)).toBe(rawDigits)
        }
      }),
      { seed: 42 },
    )
  })

  it("recovers exactly the trailing 10 digits when a leading '1' country code is recognized", () => {
    fc.assert(
      fc.property(fc.stringMatching(/^1\d{10}$/), (elevenDigits) => {
        expect(normalizePhoneNumber(elevenDigits)).toBe(elevenDigits.slice(1))
      }),
      { seed: 42 },
    )
  })
})

describe("normalizePhoneNumber property: idempotency", () => {
  it("normalizing an already-normalized value is a no-op: f(f(x)) === f(x)", () => {
    fc.assert(
      fc.property(anyString, (value) => {
        const once = normalizePhoneNumber(value)
        const twice = normalizePhoneNumber(once)
        expect(twice).toBe(once)
      }),
      { seed: 42 },
    )
  })
})

describe("formatPhoneNumber property: never throws on arbitrary digit-bearing strings", () => {
  it("does not throw for any string input, including empty, unicode, and very long strings", () => {
    fc.assert(
      fc.property(anyString, (value) => {
        expect(() => formatPhoneNumber(value)).not.toThrow()
      }),
      { seed: 42 },
    )
  })

  it("does not throw for arbitrary sequences of random digits", () => {
    fc.assert(
      fc.property(fc.stringMatching(/^\d{0,20}$/), (digits) => {
        expect(() => formatPhoneNumber(digits)).not.toThrow()
      }),
      { seed: 42 },
    )
  })
})

describe("formatPhoneNumber property: idempotency", () => {
  it("re-formatting an already-formatted value reproduces the same string: f(f(x)) === f(x)", () => {
    fc.assert(
      fc.property(anyString, (value) => {
        const once = formatPhoneNumber(value)
        const twice = formatPhoneNumber(once)
        expect(twice).toBe(once)
      }),
      { seed: 42 },
    )
  })
})

describe("formatPhoneNumber property: output only contains digits of the normalized value plus formatting punctuation", () => {
  it("stripping non-digits from the formatted output reproduces normalizePhoneNumber(value)", () => {
    fc.assert(
      fc.property(anyString, (value) => {
        const formatted = formatPhoneNumber(value)
        const digitsInFormatted = formatted.replace(/\D/g, "")
        expect(digitsInFormatted).toBe(normalizePhoneNumber(value))
      }),
      { seed: 42 },
    )
  })
})
