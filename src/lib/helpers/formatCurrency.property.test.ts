import fc from "fast-check"
import { describe, expect, it } from "vitest"
import formatCurrency from "./formatCurrency"

// formatCurrency(amount) = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" })
//   .format(Number.isFinite(amount) ? amount || 0 : 0)
//
// The `Number.isFinite` guard collapses any non-finite amount (NaN, Infinity, -Infinity) and any
// falsy amount (0, "", null, undefined via `as unknown as number`) to formatting 0. For every
// *finite* number this is a straight pass-through to Intl, so the properties below restrict the
// domain to finite doubles (fc.pre / a finite generator) and separately lock in that Infinity and
// -Infinity now format the same as 0 ("$0.00") instead of leaking a literal infinity symbol with
// no decimal digits.

const finiteAmount = fc.double({ noNaN: true, noDefaultInfinity: true, min: -1e12, max: 1e12 })

describe("formatCurrency property: currency symbol", () => {
  it("output for any finite number always starts with the USD symbol ($) or a minus sign followed by it", () => {
    fc.assert(
      fc.property(finiteAmount, (amount) => {
        const result = formatCurrency(amount)
        const stripped = result.startsWith("-") ? result.slice(1) : result
        expect(stripped.startsWith("$")).toBe(true)
      }),
      { seed: 42 },
    )
  })
})

describe("formatCurrency property: no NaN/Infinity leakage in the formatted string", () => {
  it("never contains the literal text NaN or Infinity for any finite input", () => {
    fc.assert(
      fc.property(finiteAmount, (amount) => {
        const result = formatCurrency(amount)
        expect(result).not.toContain("NaN")
        expect(result).not.toContain("Infinity")
      }),
      { seed: 42 },
    )
  })
})

describe("formatCurrency property: negative values are prefixed consistently", () => {
  it("a negative finite amount always formats with a leading minus sign before the currency symbol", () => {
    fc.assert(
      fc.property(
        finiteAmount.filter((n) => n < 0),
        (amount) => {
          const result = formatCurrency(amount)
          expect(result.startsWith("-$")).toBe(true)
        },
      ),
      { seed: 42 },
    )
  })

  it("a non-negative finite amount never contains a minus sign", () => {
    fc.assert(
      fc.property(
        finiteAmount.filter((n) => n >= 0),
        (amount) => {
          const result = formatCurrency(amount)
          expect(result.includes("-")).toBe(false)
        },
      ),
      { seed: 42 },
    )
  })
})

describe("formatCurrency property: always exactly two decimal digits", () => {
  it("the formatted string always ends with a decimal point followed by exactly two digits", () => {
    fc.assert(
      fc.property(finiteAmount, (amount) => {
        const result = formatCurrency(amount)
        expect(result).toMatch(/\.\d{2}$/)
      }),
      { seed: 42 },
    )
  })
})

describe("formatCurrency property: falsy amounts collapse to $0.00", () => {
  it("NaN, 0, empty string, null and undefined (all falsy) all format identically to $0.00", () => {
    const falsyInputs: unknown[] = [Number.NaN, 0, "" as unknown as number, null, undefined]
    for (const input of falsyInputs) {
      expect(formatCurrency(input as number)).toBe("$0.00")
    }
  })

  // FIX: `Number.isFinite` now catches Infinity/-Infinity before they reach Intl.NumberFormat, so
  // they collapse to "$0.00" the same way NaN already did, instead of leaking a literal infinity
  // symbol with no decimal digits.
  it("FIX: Infinity is caught by the `Number.isFinite` guard and formats as $0.00, same as NaN", () => {
    expect(formatCurrency(Number.POSITIVE_INFINITY)).toBe("$0.00")
    expect(formatCurrency(Number.NEGATIVE_INFINITY)).toBe("$0.00")
  })
})
