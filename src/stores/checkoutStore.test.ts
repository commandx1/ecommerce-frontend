import { beforeEach, describe, expect, it, vi } from "vitest"
import type { PlaceOrderPayload, PlaceOrderResponse } from "@/lib/api/orders"
import { type CheckoutStep, useCheckoutStore } from "./checkoutStore"

const store = () => useCheckoutStore.getState()

const orderPayload: PlaceOrderPayload = {
  addressId: "address-1",
  shippoRateOrders: [],
  uberRateOrders: [],
}

const orderResult: PlaceOrderResponse = {
  orderId: "order-1",
  totalPrice: 118.5,
  status: "CREATED",
  createdDate: "2026-08-22T10:00:00Z",
  orderItems: [],
}

/**
 * The global `afterEach` in `src/test/setup.ts` calls `reset()`, so every test here starts from
 * the post-reset baseline rather than from the module's declared initial state. The one test
 * that needs the untouched initial state re-imports the module in isolation.
 */
describe("checkoutStore baseline state", () => {
  it("starts on step 1", () => {
    expect(store().currentStep).toBe(1)
  })

  it("defaults applyTaxExemption to true", () => {
    // Surprising default: tax exemption is opted IN before the buyer says anything.
    expect(store().applyTaxExemption).toBe(true)
  })

  it("starts with an empty shipping address, not a demo record", () => {
    // Regression guard for K1: the initial `shippingAddress` used to be a hardcoded demo
    // record ("Michael Chen / Pacific Dental Group / 2847 Mission Street"). `useShippingDetails`
    // overwrites it once the buyer's saved addresses load, so the bug only surfaced when that
    // request failed or returned nothing - and then an unnoticed order shipped to a stranger.
    expect(store().shippingAddress).toEqual({
      firstName: "",
      lastName: "",
      company: "",
      street: "",
      city: "",
      state: "",
      zipCode: "",
      phone: "",
    })
  })

  it("restores the same empty address on reset, so a second checkout inherits nothing", () => {
    store().updateShippingAddress({ firstName: "Ayse", company: "Klinik", city: "Istanbul" })

    store().reset()

    expect(store().shippingAddress).toEqual({
      firstName: "",
      lastName: "",
      company: "",
      street: "",
      city: "",
      state: "",
      zipCode: "",
      phone: "",
    })
  })

  it("defaults every flag and free-text field to empty/false", () => {
    expect(store()).toMatchObject({
      orderPayload: null,
      orderResult: null,
      poNumber: "",
      department: "",
      specialInstructions: "",
      saveCard: false,
      cardName: "",
      selectedSavedCardId: "",
      paymentMethodId: "",
      paymentMethodSummary: "",
      autoOrderConsent: false,
      newCardAutoPaymentConsent: false,
      autoOrderUserProductIds: [],
      termsAgreed: false,
      selectedVendorShippingMethods: {},
      selectedShippingCost: 0,
    })
  })
})

describe("checkoutStore reset restores the declared initial state", () => {
  it("starts with an empty selectedShippingEtaText on a freshly imported module", async () => {
    vi.resetModules()
    const freshModule = await import("./checkoutStore")

    expect(freshModule.useCheckoutStore.getState().selectedShippingEtaText).toBe("")
  })

  // Y7 fix: `reset()` used to hardcode "Express Delivery - 2-3 business days" for
  // `selectedShippingEtaText` while the store's declared initial value was "" (checkoutStore.ts
  // :126 vs :174), so `reset()` never actually returned the store to its initial state. Both now
  // derive from the same `initialState` object.
  it("restores the empty selectedShippingEtaText on reset, matching the declared initial state", () => {
    store().setSelectedShippingEtaText("Ground - 5 business days")

    store().reset()

    expect(store().selectedShippingEtaText).toBe("")
  })

  it("clears the order payload and result on reset", () => {
    store().setOrderPayload(orderPayload)
    store().setOrderResult(orderResult)

    store().reset()

    expect(store().orderPayload).toBeNull()
    expect(store().orderResult).toBeNull()
  })
})

describe("checkoutStore step navigation", () => {
  it("sets an arbitrary step directly", () => {
    store().setStep(4)

    expect(store().currentStep).toBe(4)
  })

  it("advances one step at a time", () => {
    store().nextStep()
    store().nextStep()

    expect(store().currentStep).toBe(3)
  })

  it("clamps nextStep at 5", () => {
    store().setStep(5)

    store().nextStep()
    store().nextStep()

    expect(store().currentStep).toBe(5)
  })

  it("clamps previousStep at 1", () => {
    store().setStep(1)

    store().previousStep()
    store().previousStep()

    expect(store().currentStep).toBe(1)
  })

  it("walks back down from 5 to 1 without underflowing", () => {
    store().setStep(5)

    for (let index = 0; index < 10; index++) {
      store().previousStep()
    }

    expect(store().currentStep).toBe(1)
  })
})

describe("checkoutStore payment method", () => {
  it("clears the card selection only through reset", () => {
    store().setSelectedSavedCardId("card-123")
    store().setPaymentMethodId("pm_123")

    store().reset()

    expect(store().selectedSavedCardId).toBe("")
    expect(store().paymentMethodId).toBe("")
  })

  it("tracks and clears a tokenized-but-not-yet-charged new card", () => {
    const card = { paymentMethodId: "pm_new", brand: "visa", last4: "4242", expMonth: 9, expYear: 2030 }

    store().setPendingNewCard(card)
    expect(store().pendingNewCard).toEqual(card)

    store().setPendingNewCard(null)
    expect(store().pendingNewCard).toBeNull()
  })

  it("wipes the pending new card on reset", () => {
    store().setPendingNewCard({ paymentMethodId: "pm_new", brand: "visa", last4: "4242", expMonth: 9, expYear: 2030 })

    store().reset()

    expect(store().pendingNewCard).toBeNull()
  })
})

describe("checkoutStore auto order consent flags", () => {
  it("tracks the saved-card consent independently of the new-card consent", () => {
    store().setAutoOrderConsent(true)

    expect(store().autoOrderConsent).toBe(true)
    expect(store().newCardAutoPaymentConsent).toBe(false)
  })

  it("tracks the new-card consent independently of the saved-card consent", () => {
    store().setNewCardAutoPaymentConsent(true)

    expect(store().newCardAutoPaymentConsent).toBe(true)
    expect(store().autoOrderConsent).toBe(false)
  })

  it("keeps both consents when a new card is being saved alongside a saved-card upgrade", () => {
    store().setSaveCard(true)
    store().setAutoOrderConsent(true)
    store().setNewCardAutoPaymentConsent(true)

    expect(store()).toMatchObject({ saveCard: true, autoOrderConsent: true, newCardAutoPaymentConsent: true })
  })

  it("snapshots the auto order userProductIds", () => {
    store().setAutoOrderUserProductIds(["up-1", "up-2"])

    expect(store().autoOrderUserProductIds).toEqual(["up-1", "up-2"])
  })
})

describe("checkoutStore.setPayloadAutoOrder", () => {
  it("no-ops when orderPayload is null", () => {
    expect(store().orderPayload).toBeNull()

    store().setPayloadAutoOrder("up-1", "ONE_MONTH")

    expect(store().orderPayload).toBeNull()
  })

  it("rewrites autoOrder for the matching product across both shippoRateOrders and uberRateOrders, leaving others untouched", () => {
    store().setOrderPayload({
      addressId: "address-1",
      shippoRateOrders: [
        {
          shippoRateId: "rate-1",
          products: [
            { userProductId: "up-1", quantity: 2, autoOrder: "TWO_WEEKS" },
            { userProductId: "up-2", quantity: 1, autoOrder: null },
          ],
        },
      ],
      uberRateOrders: [
        {
          uberRateId: "uber-1",
          products: [{ userProductId: "up-1", quantity: 2, autoOrder: "TWO_WEEKS" }],
        },
      ],
    })

    store().setPayloadAutoOrder("up-1", "TWO_MONTHS")

    const { orderPayload } = store()
    expect(orderPayload?.shippoRateOrders[0].products).toEqual([
      { userProductId: "up-1", quantity: 2, autoOrder: "TWO_MONTHS" },
      { userProductId: "up-2", quantity: 1, autoOrder: null },
    ])
    expect(orderPayload?.uberRateOrders[0].products).toEqual([
      { userProductId: "up-1", quantity: 2, autoOrder: "TWO_MONTHS" },
    ])
  })

  it("cancels a repeat by writing null, without touching quantity", () => {
    store().setOrderPayload({
      addressId: "address-1",
      shippoRateOrders: [
        { shippoRateId: "rate-1", products: [{ userProductId: "up-1", quantity: 3, autoOrder: "ONE_MONTH" }] },
      ],
      uberRateOrders: [],
    })

    store().setPayloadAutoOrder("up-1", null)

    expect(store().orderPayload?.shippoRateOrders[0].products[0]).toEqual({
      userProductId: "up-1",
      quantity: 3,
      autoOrder: null,
    })
  })

  it("leaves an order with no matching product referentially unchanged", () => {
    store().setOrderPayload({
      addressId: "address-1",
      shippoRateOrders: [
        { shippoRateId: "rate-untouched", products: [{ userProductId: "up-other", quantity: 1, autoOrder: null }] },
      ],
      uberRateOrders: [],
    })
    const untouchedOrderBefore = store().orderPayload?.shippoRateOrders[0]

    store().setPayloadAutoOrder("up-1", "ONE_MONTH")

    expect(store().orderPayload?.shippoRateOrders[0]).toBe(untouchedOrderBefore)
  })
})

describe("checkoutStore shipping selections", () => {
  it("replaces the whole record when a plain object is passed", () => {
    store().setSelectedVendorShippingMethods({
      "seller-1": { sellerName: "Acme Dental", methodText: "Ground", amount: 9.5 },
    })

    store().setSelectedVendorShippingMethods({
      "seller-2": { sellerName: "Beta Dental", methodText: "Express", amount: 19 },
    })

    expect(store().selectedVendorShippingMethods).toEqual({
      "seller-2": { sellerName: "Beta Dental", methodText: "Express", amount: 19 },
    })
  })

  it("merges a new vendor in through the functional updater", () => {
    store().setSelectedVendorShippingMethods({
      "seller-1": { sellerName: "Acme Dental", methodText: "Ground", amount: 9.5 },
    })

    store().setSelectedVendorShippingMethods((prev) => ({
      ...prev,
      "seller-2": { sellerName: "Beta Dental", methodText: "Express", amount: 19 },
    }))

    expect(Object.keys(store().selectedVendorShippingMethods)).toEqual(["seller-1", "seller-2"])
  })

  it("updates an existing vendor through the functional updater", () => {
    store().setSelectedVendorShippingMethods({
      "seller-1": { sellerName: "Acme Dental", methodText: "Ground", amount: 9.5 },
    })

    store().setSelectedVendorShippingMethods((prev) => ({
      ...prev,
      "seller-1": { ...prev["seller-1"], methodText: "Overnight", amount: 29 },
    }))

    expect(store().selectedVendorShippingMethods["seller-1"]).toEqual({
      sellerName: "Acme Dental",
      methodText: "Overnight",
      amount: 29,
    })
  })

  it("accepts a vendor selection without an amount", () => {
    store().setSelectedVendorShippingMethods({
      "seller-1": { sellerName: "Acme Dental", methodText: "Free pickup" },
    })

    expect(store().selectedVendorShippingMethods["seller-1"].amount).toBeUndefined()
  })

  it("stores the aggregate shipping cost and eta text", () => {
    store().setSelectedShippingCost(24.75)
    store().setSelectedShippingEtaText("Ground - 5 business days")

    expect(store().selectedShippingCost).toBe(24.75)
    expect(store().selectedShippingEtaText).toBe("Ground - 5 business days")
  })

  it("empties the vendor selections on reset", () => {
    store().setSelectedVendorShippingMethods({
      "seller-1": { sellerName: "Acme Dental", methodText: "Ground", amount: 9.5 },
    })
    store().setSelectedShippingCost(9.5)

    store().reset()

    expect(store().selectedVendorShippingMethods).toEqual({})
    expect(store().selectedShippingCost).toBe(0)
  })

  it("clearShippingSelection resets only the frozen shipping fields, leaving other fields untouched", () => {
    store().setStep(3)
    store().updatePONumber("PO-9001")
    store().setPaymentMethodId("pm_123")
    store().setSelectedVendorShippingMethods({
      "seller-1": { sellerName: "Acme Dental", methodText: "Ground", amount: 9.5 },
    })
    store().setSelectedShippingCost(9.5)
    store().setSelectedShippingEtaText("Ground - 5 business days")
    store().setOrderPayload(orderPayload)
    store().setExcludedFromOrder([{ sellerName: "Beta Dental", itemNames: ["Widget"] }])

    store().clearShippingSelection()

    expect(store().selectedVendorShippingMethods).toEqual({})
    expect(store().selectedShippingCost).toBe(0)
    expect(store().selectedShippingEtaText).toBe("")
    expect(store().orderPayload).toBeNull()
    expect(store().excludedFromOrder).toEqual([])
    expect(store().poNumber).toBe("PO-9001")
    expect(store().currentStep).toBe(3)
    expect(store().paymentMethodId).toBe("pm_123")
  })
})

describe("checkoutStore address and order metadata", () => {
  it("merges partial shipping address updates", () => {
    store().updateShippingAddress({ city: "Oakland", zipCode: "94607" })

    expect(store().shippingAddress).toMatchObject({
      firstName: "",
      city: "Oakland",
      zipCode: "94607",
    })
  })

  it("keeps the untouched fields when an empty patch is applied", () => {
    const before = store().shippingAddress

    store().updateShippingAddress({})

    expect(store().shippingAddress).toEqual(before)
  })

  it("stores the purchase order metadata", () => {
    store().updatePONumber("PO-9001")
    store().updateDepartment("Orthodontics")
    store().updateSpecialInstructions("Leave at the back door")

    expect(store()).toMatchObject({
      poNumber: "PO-9001",
      department: "Orthodontics",
      specialInstructions: "Leave at the back door",
    })
  })

  it("stores the card save preferences and terms agreement", () => {
    store().setSaveCard(true)
    store().setCardName("Practice Amex")
    store().setTermsAgreed(true)
    store().setApplyTaxExemption(false)

    expect(store()).toMatchObject({
      saveCard: true,
      cardName: "Practice Amex",
      termsAgreed: true,
      applyTaxExemption: false,
    })
  })

  it("restores applyTaxExemption to true on reset", () => {
    store().setApplyTaxExemption(false)

    store().reset()

    expect(store().applyTaxExemption).toBe(true)
  })

  it("keeps the order payload and result until reset", () => {
    store().setOrderPayload(orderPayload)
    store().setOrderResult(orderResult)

    expect(store().orderPayload).toEqual(orderPayload)
    expect(store().orderResult).toEqual(orderResult)
  })
})

/**
 * `getInitialState()` returns the object the creator produced at module load and `set()` never
 * mutates in place, so it is the only place these literal defaults are ever independently
 * observed - every other test in this file reaches the same values through `reset()`, which has
 * its own (already-covered) copy of these literals and would mask a defect here.
 */
describe("checkoutStore defaults", () => {
  it("starts every field at its documented empty/off default", () => {
    const initial = useCheckoutStore.getInitialState()

    expect(initial.poNumber).toBe("")
    expect(initial.department).toBe("")
    expect(initial.specialInstructions).toBe("")
    expect(initial.applyTaxExemption).toBe(true)
    expect(initial.cardName).toBe("")
    expect(initial.pendingNewCard).toBeNull()
    expect(initial.paymentMethodId).toBe("")
    expect(initial.paymentMethodSummary).toBe("")
    expect(initial.autoOrderConsent).toBe(false)
    expect(initial.newCardAutoPaymentConsent).toBe(false)
    expect(initial.autoOrderUserProductIds).toEqual([])
    expect(initial.termsAgreed).toBe(false)
  })
})

describe("checkoutStore step type", () => {
  beforeEach(() => {
    store().setStep(1)
  })

  it("accepts every declared step value", () => {
    const steps: CheckoutStep[] = [1, 2, 3, 4, 5]

    for (const step of steps) {
      store().setStep(step)
      expect(store().currentStep).toBe(step)
    }
  })
})
