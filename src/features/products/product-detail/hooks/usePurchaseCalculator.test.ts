import { act, renderHook } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { usePurchaseCalculator } from "./usePurchaseCalculator"

type CalculatorProps = Parameters<typeof usePurchaseCalculator>[0]
type BulkTier = CalculatorProps["bulkPricing"][number]
type WarrantyOption = CalculatorProps["warrantyOptions"][number]

const makeTier = (overrides: Partial<BulkTier> & Pick<BulkTier, "range" | "price">): BulkTier => ({
  id: 1,
  note: "",
  selected: false,
  ...overrides,
})

const makeWarranty = (
  overrides: Partial<WarrantyOption> & Pick<WarrantyOption, "value" | "price">,
): WarrantyOption => ({
  id: 1,
  title: "",
  description: "",
  selected: false,
  ...overrides,
})

const makeOrderSummary = (
  overrides: Partial<CalculatorProps["orderSummary"]> = {},
): CalculatorProps["orderSummary"] => ({
  product: "Test product",
  productPrice: "$0.00",
  warranty: "$0.00",
  shipping: "$0.00",
  subtotal: "$0.00",
  tax: "$0.00",
  total: "$0.00",
  ...overrides,
})

/** The three-band ladder the tier-resolution tests below all share. */
const threeTiers = (): BulkTier[] => [
  makeTier({ id: 1, range: "1-9", price: "$100.00" }),
  makeTier({ id: 2, range: "10-49", price: "$90.00" }),
  makeTier({ id: 3, range: "50+", price: "$80.00" }),
]

const makeProps = (overrides: Partial<CalculatorProps> = {}): CalculatorProps => ({
  bulkPricing: threeTiers(),
  warrantyOptions: [makeWarranty({ id: 1, value: "standard", price: "Free", selected: true })],
  orderSummary: makeOrderSummary(),
  stockCount: 1000,
  ...overrides,
})

const renderCalculator = (overrides: Partial<CalculatorProps> = {}) =>
  renderHook((props: CalculatorProps) => usePurchaseCalculator(props), { initialProps: makeProps(overrides) })

describe("usePurchaseCalculator", () => {
  describe("tier resolution", () => {
    it("picks the first tier for the smallest quantity", () => {
      const { result } = renderCalculator()

      act(() => {
        result.current.setQuantity(1)
      })

      expect(result.current.activeTier?.range).toBe("1-9")
      expect(result.current.unitPrice).toBe(100)
    })

    // Lower boundary pair 9/10: 9 is still the first band, 10 tips into the second.
    it("keeps quantity 9 on the first tier", () => {
      const { result } = renderCalculator()

      act(() => {
        result.current.setQuantity(9)
      })

      expect(result.current.activeTier?.range).toBe("1-9")
      expect(result.current.unitPrice).toBe(100)
    })

    it("moves quantity 10 to the second tier", () => {
      const { result } = renderCalculator()

      act(() => {
        result.current.setQuantity(10)
      })

      expect(result.current.activeTier?.range).toBe("10-49")
      expect(result.current.unitPrice).toBe(90)
    })

    // Upper boundary pair 49/50: 49 is the last quantity on the second band.
    it("keeps quantity 49 on the second tier", () => {
      const { result } = renderCalculator()

      act(() => {
        result.current.setQuantity(49)
      })

      expect(result.current.activeTier?.range).toBe("10-49")
      expect(result.current.unitPrice).toBe(90)
    })

    it("moves quantity 50 to the open-ended tier", () => {
      const { result } = renderCalculator()

      act(() => {
        result.current.setQuantity(50)
      })

      expect(result.current.activeTier?.range).toBe("50+")
      expect(result.current.unitPrice).toBe(80)
    })

    it("keeps a very large quantity on the open-ended tier", () => {
      const { result } = renderCalculator()

      act(() => {
        result.current.setQuantity(500)
      })

      expect(result.current.activeTier?.range).toBe("50+")
      expect(result.current.unitPrice).toBe(80)
    })

    // Tiers are scanned in descending-minimum order, so an open-ended band whose minimum is
    // lower than the quantity can never be shadowed by a closed band declared before it.
    it("does not fall back to a closed band when an open-ended band already matches", () => {
      const { result } = renderCalculator({
        bulkPricing: [
          makeTier({ id: 1, range: "50+", price: "$80.00" }),
          makeTier({ id: 2, range: "10-49", price: "$90.00" }),
          makeTier({ id: 3, range: "1-9", price: "$100.00" }),
        ],
      })

      act(() => {
        result.current.setQuantity(100)
      })

      expect(result.current.activeTier?.range).toBe("50+")
    })

    it('matches the "1 unit" wording only at quantity 1', () => {
      const { result } = renderCalculator({
        bulkPricing: [
          makeTier({ id: 1, range: "1 Unit", price: "$120.00" }),
          makeTier({ id: 2, range: "2-4 Units", price: "$110.00" }),
        ],
      })

      expect(result.current.activeTier?.range).toBe("1 Unit")

      act(() => {
        result.current.setQuantity(2)
      })

      expect(result.current.activeTier?.range).toBe("2-4 Units")
    })

    it('leaves a lone "1 unit" tier unmatched above quantity 1 and falls back to it anyway', () => {
      const { result } = renderCalculator({
        bulkPricing: [makeTier({ id: 1, range: "1 Unit", price: "$120.00" })],
      })

      act(() => {
        result.current.setQuantity(5)
      })

      // No band matched, so the fallback chain hands back the only entry there is.
      expect(result.current.activeTier?.range).toBe("1 Unit")
    })

    // Tiers are sorted DESCENDING by their minimum before the scan (see `resolveBulkPricing`),
    // specifically so two open-ended ("+") bands can never shadow each other regardless of the
    // order the caller declared them in. This only bites with two "+" bands: a single one always
    // matches correctly with or without sorting, which is why the other tests here don't catch a
    // broken/removed sort.
    it("checks the higher open-ended band first even when the caller declares it after the lower one", () => {
      const { result } = renderCalculator({
        bulkPricing: [
          makeTier({ id: 1, range: "10+", price: "$90.00" }),
          makeTier({ id: 2, range: "50+", price: "$80.00" }),
        ],
      })

      act(() => {
        result.current.setQuantity(60)
      })

      expect(result.current.activeTier?.id).toBe(2)
      expect(result.current.unitPrice).toBe(80)
    })

    // The sort's own min-extraction takes the substring BEFORE the dash, not just its first
    // character. "9+" vs "10+" is the pair that tells them apart: comparing first characters
    // alone ranks "9" above "1", the wrong way round, while the real two-digit values (9 vs 10)
    // rank the other way.
    it("sorts open-ended bands by their full numeric minimum, not just its first digit", () => {
      const { result } = renderCalculator({
        bulkPricing: [
          makeTier({ id: 1, range: "9+", price: "$95.00" }),
          makeTier({ id: 2, range: "10+", price: "$90.00" }),
        ],
      })

      act(() => {
        result.current.setQuantity(15)
      })

      expect(result.current.activeTier?.id).toBe(2)
    })

    /**
     * A tier whose range has no "+" and no "-" and no "1 unit" wording either can only ever be
     * matched by REACHING the last `else if` branch AND its condition genuinely being true. This
     * catches a mutant that forces entry into that branch regardless of the tier's real content
     * (the earlier decoy tests below can't: the tier that legitimately reaches this branch there
     * already contains real "1 unit" wording, so forcing the check can't be told apart from it
     * actually passing).
     */
    it("does not match an arbitrary range at quantity 1 just because it fell through to the last branch", () => {
      const { result } = renderCalculator({
        bulkPricing: [
          makeTier({ id: 1, range: "bulk", price: "$50.00" }),
          makeTier({ id: 2, range: "10-49", price: "$90.00", selected: true }),
        ],
      })

      expect(result.current.activeTier?.id).toBe(2)
    })

    /**
     * A tier whose range has no "+" and no "-" (so it only ever matches through the "1 unit"
     * branch) is paired with a decoy tier flagged `selected: true`. If the "1 unit" branch's own
     * conditions are weakened - a case-sensitive `toLowerCase()` dropped, the wording check
     * forced true/false, its `quantity === 1` guard forced either way - the scan either matches
     * the wrong tier or falls through to the decoy, and either divergence is caught below.
     */
    describe("the lone-wording branch is independently guarded", () => {
      const wordingVsDecoy = () => [
        makeTier({ id: 1, range: "1 Unit", price: "$120.00" }),
        makeTier({ id: 2, range: "10-49", price: "$90.00", selected: true }),
      ]

      it("matches the wording tier at quantity 1 instead of falling back to the decoy", () => {
        const { result } = renderCalculator({ bulkPricing: wordingVsDecoy() })

        expect(result.current.activeTier?.id).toBe(1)
      })

      it("does not match the wording tier once quantity moves past 1, even though it is scanned first", () => {
        const { result } = renderCalculator({ bulkPricing: wordingVsDecoy() })

        act(() => {
          result.current.setQuantity(2)
        })

        // Neither band's numeric range covers 2, so the decoy's `selected: true` wins the
        // fallback - UNLESS the wording tier's own `quantity === 1` guard has been weakened
        // to also fire here.
        expect(result.current.activeTier?.id).toBe(2)
      })
    })
  })

  describe("fallback chain when no tier matches", () => {
    // Level 1: the pre-selected tier wins when the quantity is outside every declared band.
    it("falls back to the tier flagged as selected", () => {
      const { result } = renderCalculator({
        bulkPricing: [
          makeTier({ id: 1, range: "1-9", price: "$100.00" }),
          makeTier({ id: 2, range: "10-49", price: "$90.00", selected: true }),
        ],
      })

      act(() => {
        result.current.setQuantity(100)
      })

      expect(result.current.activeTier?.id).toBe(2)
      expect(result.current.unitPrice).toBe(90)
    })

    // Level 2: with nothing flagged, the first declared tier is used.
    it("falls back to the first tier when nothing is flagged as selected", () => {
      const { result } = renderCalculator({
        bulkPricing: [
          makeTier({ id: 1, range: "1-9", price: "$100.00" }),
          makeTier({ id: 2, range: "10-49", price: "$90.00" }),
        ],
      })

      act(() => {
        result.current.setQuantity(100)
      })

      expect(result.current.activeTier?.id).toBe(1)
      expect(result.current.unitPrice).toBe(100)
    })

    // Level 3a: no tiers at all -> activeTier is undefined and the supplier price takes over.
    it("uses the selected supplier price when bulkPricing is empty", () => {
      const { result } = renderCalculator({
        bulkPricing: [],
        selectedSupplierPrice: "$42.50",
        orderSummary: makeOrderSummary({ productPrice: "$999.00" }),
      })

      expect(result.current.activeTier).toBeUndefined()
      expect(result.current.unitPrice).toBe(42.5)
    })

    // Level 3b: no tiers and no supplier price -> the order summary's product price is last resort.
    it("uses the order summary product price when there is no tier and no supplier price", () => {
      const { result } = renderCalculator({
        bulkPricing: [],
        orderSummary: makeOrderSummary({ productPrice: "$999.00" }),
      })

      expect(result.current.activeTier).toBeUndefined()
      expect(result.current.unitPrice).toBe(999)
    })

    // A matched tier outranks the supplier price even when both are present.
    it("prefers a matched tier over the supplier price", () => {
      const { result } = renderCalculator({ selectedSupplierPrice: "$5.00" })

      expect(result.current.unitPrice).toBe(100)
    })
  })

  describe("price string parsing", () => {
    it("strips the currency symbol and thousands separators", () => {
      const { result } = renderCalculator({
        bulkPricing: [makeTier({ id: 1, range: "1-9", price: "$1,234.56" })],
      })

      expect(result.current.unitPrice).toBe(1234.56)
    })

    it("treats an empty price string as zero", () => {
      const { result } = renderCalculator({
        bulkPricing: [makeTier({ id: 1, range: "1-9", price: "" })],
      })

      expect(result.current.unitPrice).toBe(0)
    })

    // Number.parseFloat("abc") is NaN; the `|| 0` guard keeps NaN out of every downstream total.
    it("treats an unparseable price as zero instead of leaking NaN", () => {
      const { result } = renderCalculator({
        bulkPricing: [makeTier({ id: 1, range: "1-9", price: "abc" })],
      })

      expect(result.current.unitPrice).toBe(0)
      expect(Number.isNaN(result.current.total)).toBe(false)
      expect(result.current.total).toBe(0)
    })

    it("parses a zero price to zero", () => {
      const { result } = renderCalculator({
        bulkPricing: [makeTier({ id: 1, range: "1-9", price: "$0.00" })],
      })

      expect(result.current.unitPrice).toBe(0)
    })

    // "Free" is what the real warranty data ships for the included tier; it must not become NaN.
    it('treats a non-numeric warranty price such as "Free" as zero', () => {
      const { result } = renderCalculator()

      expect(result.current.warrantyPrice).toBe(0)
    })
  })

  describe("stock clamping", () => {
    it("clamps the quantity down to the available stock", () => {
      const { result } = renderCalculator({ stockCount: 5 })

      act(() => {
        result.current.setQuantity(10)
      })

      expect(result.current.quantity).toBe(5)
    })

    // SUSPECTED BUG (locked in, not fixed): the clamp is `setQuantity(stockCount || 1)`, so a
    // product with zero stock still ends up with a selectable quantity of 1 rather than 0.
    it("clamps to 1 - not 0 - when stock is zero", () => {
      const { result } = renderCalculator({ stockCount: 0 })

      act(() => {
        result.current.setQuantity(10)
      })

      expect(result.current.quantity).toBe(1)
    })

    // The clamp effect depends on `quantity` as well as `stockCount`, so a value it can never
    // satisfy (quantity 1 > stockCount 0) risks a setState/render loop. React bails out because
    // the next value equals the current one; this pins that the render count stays bounded.
    it("does not re-render endlessly while stock is zero", () => {
      let renderCount = 0
      const { rerender } = renderHook(
        (props: CalculatorProps) => {
          renderCount += 1
          return usePurchaseCalculator(props)
        },
        { initialProps: makeProps({ stockCount: 0 }) },
      )

      const afterMount = renderCount
      rerender(makeProps({ stockCount: 0 }))

      expect(afterMount).toBeLessThanOrEqual(3)
      expect(renderCount).toBeLessThanOrEqual(6)
    })

    it("clamps automatically when the stockCount prop drops below the chosen quantity", () => {
      const { result, rerender } = renderCalculator({ stockCount: 50 })

      act(() => {
        result.current.setQuantity(20)
      })
      expect(result.current.quantity).toBe(20)

      rerender(makeProps({ stockCount: 8 }))

      expect(result.current.quantity).toBe(8)
    })

    it("leaves the quantity alone when it still fits in stock", () => {
      const { result, rerender } = renderCalculator({ stockCount: 50 })

      act(() => {
        result.current.setQuantity(20)
      })
      rerender(makeProps({ stockCount: 30 }))

      expect(result.current.quantity).toBe(20)
    })

    // The clamp guard is a strict `>`, not `>=`: quantity sitting exactly AT stockCount must
    // survive untouched. A positive stockCount can't tell `>` from `>=` apart here (the clamp
    // target `stockCount || 1` equals stockCount either way), so zero stock is the one value
    // where the two guards produce different quantities (1 vs 0).
    it("does not re-clamp a quantity of exactly 0 when stock is also 0", () => {
      const { result } = renderCalculator({ stockCount: 0 })

      act(() => {
        result.current.setQuantity(0)
      })

      expect(result.current.quantity).toBe(0)
    })
  })

  describe("warranty selection", () => {
    const warranties = (): WarrantyOption[] => [
      makeWarranty({ id: 1, value: "standard", price: "Free", selected: true }),
      makeWarranty({ id: 2, value: "extended", price: "+$299.00" }),
    ]

    it("starts on the option flagged as selected", () => {
      const { result } = renderCalculator({ warrantyOptions: warranties() })

      expect(result.current.selectedWarranty).toBe("standard")
    })

    it('falls back to the first option, then to "standard", when nothing is flagged', () => {
      const withoutFlag = renderCalculator({
        warrantyOptions: [makeWarranty({ id: 2, value: "extended", price: "+$299.00" })],
      })
      expect(withoutFlag.result.current.selectedWarranty).toBe("extended")

      const withoutOptions = renderCalculator({ warrantyOptions: [] })
      expect(withoutOptions.result.current.selectedWarranty).toBe("standard")
    })

    it("adds the chosen warranty price to the subtotal", () => {
      const { result } = renderCalculator({ warrantyOptions: warranties() })

      act(() => {
        result.current.setSelectedWarranty("extended")
      })

      expect(result.current.warrantyPrice).toBe(299)
      expect(result.current.subtotal).toBe(100 + 299)
    })

    // REGRESSION GUARD: the reset effect keys off the resolved default *value*, so re-rendering
    // with a brand-new array of the same content must NOT stomp the user's pick.
    it("keeps the user's pick when warrantyOptions is a new array with the same default", () => {
      const { result, rerender } = renderCalculator({ warrantyOptions: warranties() })

      act(() => {
        result.current.setSelectedWarranty("extended")
      })
      expect(result.current.selectedWarranty).toBe("extended")

      rerender(makeProps({ warrantyOptions: warranties() }))

      expect(result.current.selectedWarranty).toBe("extended")
    })

    // SUSPECTED UX BUG (locked in, not fixed): as soon as the resolved default changes - e.g. the
    // parent re-derives options with a different `selected` flag - the user's explicit choice is
    // silently overwritten by the new default.
    it("overwrites the user's pick when the resolved default warranty changes", () => {
      const { result, rerender } = renderCalculator({ warrantyOptions: warranties() })

      act(() => {
        result.current.setSelectedWarranty("extended")
      })

      rerender(
        makeProps({
          warrantyOptions: [
            makeWarranty({ id: 1, value: "standard", price: "Free" }),
            makeWarranty({ id: 2, value: "premium", price: "+$499.00", selected: true }),
          ],
        }),
      )

      expect(result.current.selectedWarranty).toBe("premium")
      expect(result.current.warrantyPrice).toBe(499)
    })

    it("falls back to the order summary warranty when the selected value matches no option", () => {
      const { result } = renderCalculator({
        warrantyOptions: warranties(),
        orderSummary: makeOrderSummary({ warranty: "$25.00" }),
      })

      act(() => {
        result.current.setSelectedWarranty("does-not-exist")
      })

      expect(result.current.warrantyPrice).toBe(25)
    })
  })

  describe("totals", () => {
    it("computes productTotal, subtotal, tax and total from the resolved unit price", () => {
      const { result } = renderCalculator({
        warrantyOptions: [makeWarranty({ id: 1, value: "standard", price: "$50.00", selected: true })],
        selectedSupplierShippingFee: "$10.00",
      })

      act(() => {
        result.current.setQuantity(2)
      })

      expect(result.current.productTotal).toBe(200)
      expect(result.current.subtotal).toBe(250)
      expect(result.current.shippingPrice).toBe(20)
      expect(result.current.tax).toBe(25)
      expect(result.current.total).toBe(295)
    })

    // Shipping is deliberately outside the taxable base: tax is 10% of subtotal only.
    it("does not tax the shipping fee", () => {
      const { result } = renderCalculator({ selectedSupplierShippingFee: "$1000.00" })

      expect(result.current.subtotal).toBe(100)
      expect(result.current.tax).toBe(10)
      expect(result.current.total).toBe(100 + 1000 + 10)
    })

    it("prefers the order summary shipping when no supplier shipping fee is given", () => {
      const { result } = renderCalculator({ orderSummary: makeOrderSummary({ shipping: "$15.00" }) })

      expect(result.current.shippingFeePrice).toBe(15)
    })

    // SURPRISING BEHAVIOUR (locked in, not fixed): both the base shipping fee and the heavy
    // surcharge are multiplied per unit, so a "flat" $75 heavy fee becomes $750 at quantity 10.
    it("multiplies the heavy shipping surcharge per unit rather than charging it once", () => {
      const { result } = renderCalculator({
        selectedSupplierShippingFee: "$10.00",
        selectedSupplierHeavyShippingFee: "$75.00",
      })

      act(() => {
        result.current.setQuantity(10)
      })

      expect(result.current.heavyShippingFeePrice).toBe(750)
      expect(result.current.shippingFeePrice).toBe(100)
      expect(result.current.shippingPrice).toBe(850)
    })

    it("charges no heavy surcharge when the supplier does not declare one", () => {
      const { result } = renderCalculator({ selectedSupplierShippingFee: "$10.00" })

      expect(result.current.heavyShippingFeePrice).toBe(0)
      expect(result.current.shippingPrice).toBe(10)
    })

    // FLOATING-POINT LEAK (locked in, not fixed): `subtotal * 0.1` is raw IEEE-754 arithmetic and
    // no rounding happens anywhere in the hook, so tax/total can carry a binary-float tail. Any
    // consumer rendering these values must format them; printing them raw shows "569.7000000000001".
    it("returns an unrounded IEEE-754 total", () => {
      const { result } = renderCalculator({
        bulkPricing: [makeTier({ id: 1, range: "1-9", price: "$1,234.56" })],
      })

      act(() => {
        result.current.setQuantity(7)
      })

      expect(result.current.subtotal).toBe(8641.92)
      expect(result.current.tax).toBe(864.192)
      // 8641.92 + 864.192 does not land on 9506.112 in binary floating point.
      expect(result.current.total).toBe(9506.112000000001)
      expect(result.current.total).not.toBe(9506.112)
    })

    it("returns an unrounded IEEE-754 product total", () => {
      const { result } = renderCalculator({
        bulkPricing: [makeTier({ id: 1, range: "1-9", price: "$99.99" })],
      })

      act(() => {
        result.current.setQuantity(3)
      })

      expect(result.current.productTotal).toBe(299.96999999999997)
      expect(result.current.productTotal).not.toBe(299.97)
    })

    it("accumulates a float tail on the product total too", () => {
      const { result } = renderCalculator({
        bulkPricing: [makeTier({ id: 1, range: "1-9", price: "$0.10" })],
        warrantyOptions: [makeWarranty({ id: 1, value: "standard", price: "$0.20", selected: true })],
      })

      expect(result.current.subtotal).toBe(0.30000000000000004)
      expect(result.current.subtotal).not.toBe(0.3)
    })

    it("keeps everything at zero for an empty configuration", () => {
      const { result } = renderCalculator({ bulkPricing: [], warrantyOptions: [] })

      expect(result.current.unitPrice).toBe(0)
      expect(result.current.subtotal).toBe(0)
      expect(result.current.tax).toBe(0)
      expect(result.current.total).toBe(0)
    })
  })
})
