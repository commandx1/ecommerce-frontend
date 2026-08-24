// Property-based companion to usePurchaseCalculator.test.ts.
//
// `parsePrice` and `resolveBulkPricing` are module-private (not exported) inside
// usePurchaseCalculator.ts, so they are exercised indirectly through the hook's public surface:
//   - parsePrice: isolated by feeding orderSummary.productPrice with bulkPricing=[] and no
//     selectedSupplierPrice, so unitPrice === parsePrice(orderSummary.productPrice) exactly.
//   - resolveBulkPricing (tier resolution): exercised through activeTier/unitPrice as `quantity`
//     is varied across a generated, well-formed ladder of tiers.
import { act, renderHook } from "@testing-library/react"
import fc from "fast-check"
import { describe, expect, it } from "vitest"
import { usePurchaseCalculator } from "./usePurchaseCalculator"

type CalculatorProps = Parameters<typeof usePurchaseCalculator>[0]
type BulkTier = CalculatorProps["bulkPricing"][number]

const makeOrderSummary = (productPrice: string): CalculatorProps["orderSummary"] => ({
  product: "Test product",
  productPrice,
  warranty: "$0.00",
  shipping: "$0.00",
  subtotal: "$0.00",
  tax: "$0.00",
  total: "$0.00",
})

const unitPriceFor = (productPrice: string) => {
  const { result } = renderHook(() =>
    usePurchaseCalculator({
      bulkPricing: [],
      warrantyOptions: [],
      orderSummary: makeOrderSummary(productPrice),
      stockCount: 1000,
    }),
  )
  return result.current.unitPrice
}

// --- parsePrice properties (via unitPrice, isolated as described above) -------------------------

describe("parsePrice property: never leaks NaN or Infinity into unitPrice", () => {
  it("for any string input, unitPrice is always a finite number, never NaN", () => {
    fc.assert(
      fc.property(fc.string({ maxLength: 40 }), (raw) => {
        const price = unitPriceFor(raw)
        expect(Number.isNaN(price)).toBe(false)
        expect(Number.isFinite(price)).toBe(true)
      }),
      { seed: 42 },
    )
  })

  it("for any string built from digits, $, commas and a decimal point, unitPrice is never NaN", () => {
    fc.assert(
      fc.property(fc.stringMatching(/^\$?[\d,]{0,10}(\.\d{0,2})?$/), (raw) => {
        const price = unitPriceFor(raw)
        expect(Number.isNaN(price)).toBe(false)
      }),
      { seed: 42 },
    )
  })
})

describe("parsePrice property: round-trip for well-formed currency strings", () => {
  // parsePrice(`$${n.toFixed(2)}`) should reproduce n exactly for non-negative n with <= 2 decimals,
  // since parsePrice only strips `$` and `,` before calling Number.parseFloat.
  it("parsePrice(`$` + n.toFixed(2)) round-trips to n for non-negative finite n", () => {
    fc.assert(
      fc.property(fc.double({ min: 0, max: 1_000_000, noNaN: true, noDefaultInfinity: true }), (n) => {
        const rounded = Math.round(n * 100) / 100
        const price = unitPriceFor(`$${rounded.toFixed(2)}`)
        expect(price).toBeCloseTo(rounded, 6)
      }),
      { seed: 42 },
    )
  })

  it("thousands separators are stripped without changing the parsed value", () => {
    fc.assert(
      fc.property(fc.integer({ min: 1000, max: 999_999_999 }), (n) => {
        const withCommas = `$${n.toLocaleString("en-US")}.00`
        const price = unitPriceFor(withCommas)
        expect(price).toBe(n)
      }),
      { seed: 42 },
    )
  })
})

describe("parsePrice property: unparseable strings fall back to zero (locked-in behavior)", () => {
  // FINDING (confirms table test, generalized): parsePrice uses `Number.parseFloat(...) || 0`, so
  // any string with no leading numeric prefix parses to 0 rather than throwing or surfacing an
  // error. This is existing behavior, locked in rather than changed.
  it("any string with no leading digit (after stripping $ and ,) parses to exactly 0", () => {
    fc.assert(
      fc.property(
        fc.string({ maxLength: 20 }).filter((s) => !/^[\d.]/.test(s.replace(/[$,]/g, "").trimStart())),
        (raw) => {
          expect(unitPriceFor(raw)).toBe(0)
        },
      ),
      { seed: 42 },
    )
  })

  it("an empty string parses to 0", () => {
    expect(unitPriceFor("")).toBe(0)
  })
})

// --- resolveBulkPricing (tier resolution) properties ----------------------------------------------

/**
 * Builds a well-formed ascending ladder of closed bands ["0-B1", "(B1+1)-B2", ...] topped with an
 * open-ended "(Bn+1)+" band, with unit price strictly decreasing as the band minimum increases -
 * the shape PaginationBar/the real bulk-pricing UI always produces. Boundaries and prices are
 * generated so every quantity from 0 up to well past the last boundary has a well-defined tier.
 */
const tierLadderArb = fc
  .uniqueArray(fc.integer({ min: 1, max: 200 }), { minLength: 1, maxLength: 5 })
  .map((boundaries) => [...boundaries].sort((a, b) => a - b))
  .chain((boundaries) =>
    fc
      .uniqueArray(fc.integer({ min: 1, max: 100000 }), {
        minLength: boundaries.length + 1,
        maxLength: boundaries.length + 1,
      })
      .map((prices) => {
        // Sort prices descending so price strictly decreases as quantity increases.
        const sortedPrices = [...prices].sort((a, b) => b - a)
        const tiers: BulkTier[] = []
        let prevMax = 0
        boundaries.forEach((boundary, i) => {
          tiers.push({
            id: i + 1,
            range: `${prevMax + 1}-${boundary}`,
            price: `$${sortedPrices[i].toFixed(2)}`,
            note: "",
            selected: false,
          })
          prevMax = boundary
        })
        tiers.push({
          id: boundaries.length + 1,
          range: `${prevMax + 1}+`,
          price: `$${sortedPrices[boundaries.length].toFixed(2)}`,
          note: "",
          selected: false,
        })
        return { tiers, maxBoundary: prevMax }
      }),
  )

describe("tier resolution property: unit price is monotonically non-increasing as quantity increases", () => {
  it("for a well-formed ascending tier ladder, a larger quantity never yields a strictly higher unit price", () => {
    fc.assert(
      fc.property(
        tierLadderArb,
        fc.integer({ min: 1, max: 250 }),
        fc.integer({ min: 1, max: 250 }),
        ({ tiers }, qtyA, qtyB) => {
          const [lowQty, highQty] = qtyA <= qtyB ? [qtyA, qtyB] : [qtyB, qtyA]

          const { result: resultLow } = renderHook((props: CalculatorProps) => usePurchaseCalculator(props), {
            initialProps: {
              bulkPricing: tiers,
              warrantyOptions: [],
              orderSummary: makeOrderSummary("$0.00"),
              stockCount: 1_000_000,
            },
          })
          const { result: resultHigh } = renderHook((props: CalculatorProps) => usePurchaseCalculator(props), {
            initialProps: {
              bulkPricing: tiers,
              warrantyOptions: [],
              orderSummary: makeOrderSummary("$0.00"),
              stockCount: 1_000_000,
            },
          })

          act(() => {
            resultLow.current.setQuantity(lowQty)
          })
          act(() => {
            resultHigh.current.setQuantity(highQty)
          })

          expect(resultHigh.current.unitPrice).toBeLessThanOrEqual(resultLow.current.unitPrice)
        },
      ),
      { seed: 42, numRuns: 50 },
    )
  })
})

describe("tier resolution property: every quantity in range resolves to a defined tier with a finite price", () => {
  it("for any quantity from 1 up to well past the ladder's top boundary, activeTier is defined and unitPrice is finite", () => {
    fc.assert(
      fc.property(tierLadderArb, fc.integer({ min: 1, max: 300 }), ({ tiers, maxBoundary }, quantityOffset) => {
        const quantity = Math.min(quantityOffset, maxBoundary + 50)
        const { result } = renderHook((props: CalculatorProps) => usePurchaseCalculator(props), {
          initialProps: {
            bulkPricing: tiers,
            warrantyOptions: [],
            orderSummary: makeOrderSummary("$0.00"),
            stockCount: 1_000_000,
          },
        })
        act(() => {
          result.current.setQuantity(quantity)
        })
        expect(result.current.activeTier).toBeDefined()
        expect(Number.isFinite(result.current.unitPrice)).toBe(true)
      }),
      { seed: 42, numRuns: 50 },
    )
  })
})

describe("tier resolution property: safe on empty and single-tier ladders", () => {
  it("an empty bulkPricing list never throws and falls back to a finite unit price of 0 (no supplier/order price)", () => {
    const { result } = renderHook(() =>
      usePurchaseCalculator({
        bulkPricing: [],
        warrantyOptions: [],
        orderSummary: makeOrderSummary("$0.00"),
        stockCount: 100,
      }),
    )
    expect(result.current.activeTier).toBeUndefined()
    expect(result.current.unitPrice).toBe(0)
  })

  it("a single-tier ladder resolves to that tier for any quantity, including far outside a closed range", () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 100000 }), fc.integer({ min: 1, max: 100000 }), (price, quantity) => {
        const { result } = renderHook(() =>
          usePurchaseCalculator({
            bulkPricing: [{ id: 1, range: "50+", price: `$${price.toFixed(2)}`, note: "", selected: false }],
            warrantyOptions: [],
            orderSummary: makeOrderSummary("$0.00"),
            stockCount: 1_000_000,
          }),
        )
        act(() => {
          result.current.setQuantity(quantity)
        })
        expect(result.current.activeTier?.id).toBe(1)
        expect(result.current.unitPrice).toBe(price)
      }),
      { seed: 42, numRuns: 30 },
    )
  })
})
