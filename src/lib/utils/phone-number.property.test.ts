import fc from "fast-check"
import { describe, expect, it } from "vitest"
import { formatPhoneNumber, normalizePhoneNumber } from "./phone-number"

// normalizePhoneNumber(v) = v.replace(/\D/g, "").slice(0, 10)
// formatPhoneNumber(v) = grouped rendering of normalizePhoneNumber(v)
//
// Both functions accept arbitrary strings and must never throw. normalizePhoneNumber is a pure
// projection (strip non-digits, truncate to 10) so it is idempotent by construction. formatPhoneNumber
// re-derives its digits from `value` via normalizePhoneNumber every call, and its own output only ever
// contains digits plus the literal characters "(", ")", " ", "-" (all non-digit, so they get stripped
// straight back out) — so re-formatting already-formatted output must reproduce the same string.

const anyString = fc.string({ maxLength: 200 })

describe("normalizePhoneNumber property: never throws and always <= 10 digits", () => {
  it("returns a string of at most 10 characters, all digits, for any input string", () => {
    fc.assert(
      fc.property(anyString, (value) => {
        const result = normalizePhoneNumber(value)
        expect(result.length).toBeLessThanOrEqual(10)
        expect(result).toMatch(/^\d*$/)
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
