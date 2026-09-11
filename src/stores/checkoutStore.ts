import { create } from "zustand"
import type { PlaceOrderPayload, PlaceOrderResponse, ShippoRateOrder, UberRateOrder } from "@/lib/api/orders"
import type { AutoOrderPeriod } from "@/lib/constants/auto-order"

export type CheckoutStep = 1 | 2 | 3 | 4 | 5

export interface ShippingAddress {
  firstName: string
  lastName: string
  company: string
  street: string
  city: string
  state: string
  zipCode: string
  phone: string
}

export interface PaymentMethod {
  type: "card" | "net30" | "wire" | "financing"
}

export interface VendorShippingSelection {
  sellerName: string
  methodText: string
  amount?: number
}

/** A seller whose lines could not be shipped, and the item names the buyer will lose. */
export interface ExcludedSellerLines {
  sellerName: string
  itemNames: string[]
}

interface CheckoutStore {
  currentStep: CheckoutStep
  shippingAddress: ShippingAddress
  paymentMethod: PaymentMethod
  orderPayload: PlaceOrderPayload | null
  /**
   * Cart lines that will NOT be ordered because no shipping rate could be selected for their
   * seller (rate lookup failed, or the carrier returned nothing). The backend only creates order
   * items for the products carried inside `shippoRateOrders`/`uberRateOrders`
   * (OrderCreationService:163-173), and once payment succeeds it soft-deletes the WHOLE cart
   * (CartService.processCartAfterPaymentSuccess:189-204) - not just what was ordered. So these
   * lines vanish twice over: never ordered, and gone from the cart afterwards. Final Review has
   * to say so before the buyer commits.
   */
  excludedFromOrder: ExcludedSellerLines[]
  orderResult: PlaceOrderResponse | null
  poNumber: string
  department: string
  specialInstructions: string
  applyTaxExemption: boolean
  saveCard: boolean
  cardName: string
  selectedSavedCardId: string
  paymentMethodId: string
  paymentMethodSummary: string
  /**
   * Consent to upgrade the selected saved card to off-session payments, so the
   * auto order items in this order can be charged later (`openToAutoOrder`).
   */
  autoOrderConsent: boolean
  /**
   * When a new card is being saved: allow it to be charged off-session and make
   * it the auto order card (`cardOpenToAutoPayment` / `cardAutoOrderCard`).
   */
  newCardAutoPaymentConsent: boolean
  /**
   * userProductIds the buyer set to repeat, snapshotted when the order is placed.
   * The confirmation screen waits for these to show up in `GET /auto-orders`,
   * which only happens once the Stripe webhook has captured the payment.
   */
  autoOrderUserProductIds: string[]
  termsAgreed: boolean
  selectedShippingEtaText: string
  selectedVendorShippingMethods: Record<string, VendorShippingSelection>
  selectedShippingCost: number
  setStep: (step: CheckoutStep) => void
  nextStep: () => void
  previousStep: () => void
  updateShippingAddress: (address: Partial<ShippingAddress>) => void
  updatePaymentMethod: (method: Partial<PaymentMethod>) => void
  updatePONumber: (po: string) => void
  updateDepartment: (dept: string) => void
  updateSpecialInstructions: (instructions: string) => void
  setApplyTaxExemption: (apply: boolean) => void
  setSaveCard: (save: boolean) => void
  setCardName: (name: string) => void
  setSelectedSavedCardId: (cardId: string) => void
  setPaymentMethodId: (paymentMethodId: string) => void
  setPaymentMethodSummary: (summary: string) => void
  setAutoOrderConsent: (consent: boolean) => void
  setNewCardAutoPaymentConsent: (consent: boolean) => void
  setAutoOrderUserProductIds: (userProductIds: string[]) => void
  setTermsAgreed: (agreed: boolean) => void
  setSelectedShippingEtaText: (etaText: string) => void
  setSelectedVendorShippingMethods: (
    methods:
      | Record<string, VendorShippingSelection>
      | ((prev: Record<string, VendorShippingSelection>) => Record<string, VendorShippingSelection>),
  ) => void
  setSelectedShippingCost: (cost: number) => void
  setOrderPayload: (payload: PlaceOrderPayload) => void
  /**
   * Rewrites `autoOrder` for one product inside the frozen `orderPayload` snapshot. Exists
   * because the payload is captured once at the step 2→3 transition (`useShippingDetails`) and
   * `useFinalReview.onPlaceOrder` builds the request body by spreading that snapshot without ever
   * re-reading the cart — a step-4 schedule change (Final Review's per-line controls) that only
   * updated the cart store would show as "changed"/"cancelled" on screen while the backend still
   * received the old schedule and created (or kept) the wrong subscription.
   */
  setPayloadAutoOrder: (userProductId: string, autoOrder: AutoOrderPeriod | null) => void
  setExcludedFromOrder: (excluded: ExcludedSellerLines[]) => void
  setOrderResult: (result: PlaceOrderResponse) => void
  /**
   * Wipes everything the shipping step froze — the ETA text, the per-vendor method map, the
   * shipping cost, the `orderPayload` snapshot, and the excluded-line list — without touching the
   * address, payment method, or any other field the buyer already filled in. `useCheckoutCartSync`
   * calls this when the cart changes underneath a frozen step 3/4 payload, so the buyer re-picks
   * shipping against the current cart instead of placing an order for lines that no longer match.
   */
  clearShippingSelection: () => void
  reset: () => void
}

/**
 * Empty by design. This used to hold a hardcoded demo record ("Michael Chen /
 * Pacific Dental Group / 2847 Mission Street"), which `useShippingDetails`
 * overwrites once the buyer's saved addresses load - but if that request fails
 * or returns nothing, the checkout form stayed pre-filled with a stranger's
 * address and an unnoticed order would ship there. `reset()` restores this
 * same empty record, so a second checkout no longer inherits it either.
 */
const initialShippingAddress: ShippingAddress = {
  firstName: "",
  lastName: "",
  company: "",
  street: "",
  city: "",
  state: "",
  zipCode: "",
  phone: "",
}

const initialPaymentMethod: PaymentMethod = {
  type: "card",
}

/**
 * Single source of truth for the store's starting values. Both the store creator and `reset()`
 * spread this object, so the two can never drift apart again (Y7: `reset()` used to write a
 * hardcoded "Express Delivery - 2-3 business days" for `selectedShippingEtaText` while the
 * declared initial value was `""`, leaving the store in a state `reset()` itself never produced).
 */
const initialState = {
  currentStep: 1 as CheckoutStep,
  shippingAddress: initialShippingAddress,
  paymentMethod: initialPaymentMethod,
  orderPayload: null as PlaceOrderPayload | null,
  excludedFromOrder: [] as ExcludedSellerLines[],
  orderResult: null as PlaceOrderResponse | null,
  poNumber: "",
  department: "",
  specialInstructions: "",
  applyTaxExemption: true,
  saveCard: false,
  cardName: "",
  selectedSavedCardId: "",
  paymentMethodId: "",
  paymentMethodSummary: "",
  autoOrderConsent: false,
  newCardAutoPaymentConsent: false,
  autoOrderUserProductIds: [] as string[],
  termsAgreed: false,
  selectedShippingEtaText: "",
  selectedVendorShippingMethods: {} as Record<string, VendorShippingSelection>,
  selectedShippingCost: 0,
}

/**
 * Shared by `setPayloadAutoOrder` for both `shippoRateOrders` and `uberRateOrders` — same
 * `products` shape on both. Only builds new object/array references for an order that actually
 * contains the matching product, so orders untouched by this write keep their identity and don't
 * cause needless re-renders downstream.
 */
function withPatchedAutoOrder<T extends { products: { userProductId: string; autoOrder?: AutoOrderPeriod | null }[] }>(
  orders: T[],
  userProductId: string,
  autoOrder: AutoOrderPeriod | null,
): T[] {
  return orders.map((order) => {
    const matchIndex = order.products.findIndex((product) => product.userProductId === userProductId)
    if (matchIndex === -1) return order

    const nextProducts = [...order.products]
    nextProducts[matchIndex] = { ...nextProducts[matchIndex], autoOrder }
    return { ...order, products: nextProducts }
  })
}

const CARD_ONLY_FIELDS = {
  selectedSavedCardId: "",
  paymentMethodId: "",
  paymentMethodSummary: "",
} as const

export const useCheckoutStore = create<CheckoutStore>((set) => ({
  ...initialState,
  setStep: (step) => set({ currentStep: step }),
  nextStep: () => set((state) => ({ currentStep: Math.min(5, state.currentStep + 1) as CheckoutStep })),
  previousStep: () => set((state) => ({ currentStep: Math.max(1, state.currentStep - 1) as CheckoutStep })),
  updateShippingAddress: (address) => set((state) => ({ shippingAddress: { ...state.shippingAddress, ...address } })),
  updatePaymentMethod: (method) =>
    set((state) => {
      const nextPaymentMethod = { ...state.paymentMethod, ...method }
      // Y8: whenever the selected payment method is not (or is no longer) card-based, drop the
      // card-specific selection so a stale `paymentMethodId` can't ride along into the order
      // payload for a payment method that no longer uses it (e.g. net30/wire/financing).
      if (nextPaymentMethod.type !== "card") {
        return { paymentMethod: nextPaymentMethod, ...CARD_ONLY_FIELDS }
      }
      return { paymentMethod: nextPaymentMethod }
    }),
  updatePONumber: (po) => set({ poNumber: po }),
  updateDepartment: (dept) => set({ department: dept }),
  updateSpecialInstructions: (instructions) => set({ specialInstructions: instructions }),
  setApplyTaxExemption: (apply) => set({ applyTaxExemption: apply }),
  setSaveCard: (save) => set({ saveCard: save }),
  setCardName: (name) => set({ cardName: name }),
  setSelectedSavedCardId: (cardId) => set({ selectedSavedCardId: cardId }),
  setPaymentMethodId: (paymentMethodId) => set({ paymentMethodId }),
  setPaymentMethodSummary: (summary) => set({ paymentMethodSummary: summary }),
  setAutoOrderConsent: (consent) => set({ autoOrderConsent: consent }),
  setNewCardAutoPaymentConsent: (consent) => set({ newCardAutoPaymentConsent: consent }),
  setAutoOrderUserProductIds: (userProductIds) => set({ autoOrderUserProductIds: userProductIds }),
  setTermsAgreed: (agreed) => set({ termsAgreed: agreed }),
  setSelectedShippingEtaText: (etaText) => set({ selectedShippingEtaText: etaText }),
  setSelectedVendorShippingMethods: (methods) =>
    set((state) => ({
      selectedVendorShippingMethods:
        typeof methods === "function" ? methods(state.selectedVendorShippingMethods) : methods,
    })),
  setSelectedShippingCost: (cost) => set({ selectedShippingCost: cost }),
  setOrderPayload: (payload) => set({ orderPayload: payload }),
  setPayloadAutoOrder: (userProductId, autoOrder) =>
    set((state) => {
      if (!state.orderPayload) return {}
      return {
        orderPayload: {
          ...state.orderPayload,
          shippoRateOrders: withPatchedAutoOrder<ShippoRateOrder>(
            state.orderPayload.shippoRateOrders,
            userProductId,
            autoOrder,
          ),
          uberRateOrders: withPatchedAutoOrder<UberRateOrder>(
            state.orderPayload.uberRateOrders,
            userProductId,
            autoOrder,
          ),
        },
      }
    }),
  setExcludedFromOrder: (excluded) => set({ excludedFromOrder: excluded }),
  setOrderResult: (result) => set({ orderResult: result }),
  clearShippingSelection: () =>
    set({
      selectedShippingEtaText: initialState.selectedShippingEtaText,
      selectedVendorShippingMethods: initialState.selectedVendorShippingMethods,
      selectedShippingCost: initialState.selectedShippingCost,
      orderPayload: initialState.orderPayload,
      excludedFromOrder: initialState.excludedFromOrder,
    }),
  reset: () => set({ ...initialState }),
}))
