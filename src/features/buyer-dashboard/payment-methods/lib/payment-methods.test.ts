import { describe, expect, it } from "vitest"
import type { PaymentMethodStatus, SavedPaymentMethod } from "../paymentMethodsData"
import { addModalDefaults, selectAutoOrderMethod, selectDefault } from "./payment-methods"

function makeMethod(overrides: Partial<SavedPaymentMethod> = {}): SavedPaymentMethod {
  return {
    id: "pm-1",
    type: "visa",
    brandLabel: "Visa",
    nickname: "Main Card",
    last4: "4242",
    cardholder: "Jane Doe",
    expiryMonth: "09",
    expiryYear: "2028",
    billingAddress: "123 Main St",
    status: "active",
    openToAutoPayment: false,
    autoOrderCard: false,
    ...overrides,
  }
}

describe("selectDefault", () => {
  it("returns null for an empty wallet", () => {
    expect(selectDefault([])).toBeNull()
  })

  it.each<PaymentMethodStatus>(["backup", "active"])(
    "returns null when no card has status %s promoted to default",
    (status) => {
      expect(selectDefault([makeMethod({ status })])).toBeNull()
    },
  )

  it("returns the card whose status is 'default'", () => {
    const target = makeMethod({ id: "pm-default", status: "default" })
    const methods = [makeMethod({ id: "pm-1", status: "backup" }), target, makeMethod({ id: "pm-2", status: "active" })]

    expect(selectDefault(methods)).toBe(target)
  })

  it("returns the first default when more than one is (incorrectly) marked default", () => {
    const first = makeMethod({ id: "pm-1", status: "default" })
    const second = makeMethod({ id: "pm-2", status: "default" })

    expect(selectDefault([first, second])).toBe(first)
  })
})

describe("selectAutoOrderMethod", () => {
  it("returns null for an empty wallet", () => {
    expect(selectAutoOrderMethod([])).toBeNull()
  })

  it("returns null when no card is enrolled for auto orders", () => {
    expect(selectAutoOrderMethod([makeMethod({ autoOrderCard: false })])).toBeNull()
  })

  it("returns the card with autoOrderCard: true", () => {
    const target = makeMethod({ id: "pm-auto", autoOrderCard: true })
    const methods = [makeMethod({ id: "pm-1", autoOrderCard: false }), target]

    expect(selectAutoOrderMethod(methods)).toBe(target)
  })

  it("is independent of default status - the auto-order card need not be the default", () => {
    const target = makeMethod({ id: "pm-auto", status: "backup", autoOrderCard: true })

    expect(selectAutoOrderMethod([makeMethod({ id: "pm-default", status: "default" }), target])).toBe(target)
  })
})

describe("addModalDefaults", () => {
  it.each<[string, SavedPaymentMethod[], { hasCards: boolean; hasAutoOrderCard: boolean }]>([
    ["an empty wallet", [], { hasCards: false, hasAutoOrderCard: false }],
    [
      "cards but none enrolled for auto orders",
      [makeMethod({ autoOrderCard: false })],
      { hasCards: true, hasAutoOrderCard: false },
    ],
    [
      "cards with one enrolled for auto orders",
      [makeMethod({ autoOrderCard: false }), makeMethod({ id: "pm-2", autoOrderCard: true })],
      { hasCards: true, hasAutoOrderCard: true },
    ],
  ])("%s -> %j", (_label, methods, expected) => {
    expect(addModalDefaults(methods)).toEqual(expected)
  })
})
