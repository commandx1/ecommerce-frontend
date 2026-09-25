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

/**
 * A card tokenized via `stripe.createPaymentMethod` in step 3 but not yet charged (that only
 * happens in step 4). Kept in memory only — never persisted — so a buyer who backs out of step 4
 * doesn't have to re-enter the card, but a page reload doesn't leave a stale `pm_...` id around.
 */
export interface PendingNewCard {
  paymentMethodId: string
  brand: string
  last4: string
  expMonth: number | null
  expYear: number | null
}

interface CheckoutStore {
  currentStep: CheckoutStep
  shippingAddress: ShippingAddress
  orderPayload: PlaceOrderPayload | null
  /**
   * Cart lines that will NOT be ordered because no shipping rate could be selected for their
   * seller. The backend orders only the products inside the rate orders and, on payment success,
   * soft-deletes the WHOLE cart - so these lines are lost twice. Final Review must say so.
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
  pendingNewCard: PendingNewCard | null
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
  updatePONumber: (po: string) => void
  updateDepartment: (dept: string) => void
  updateSpecialInstructions: (instructions: string) => void
  setApplyTaxExemption: (apply: boolean) => void
  setSaveCard: (save: boolean) => void
  setCardName: (name: string) => void
  setSelectedSavedCardId: (cardId: string) => void
  setPendingNewCard: (card: PendingNewCard | null) => void
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
   * Rewrites `autoOrder` for one product inside the frozen `orderPayload` snapshot, which
   * `onPlaceOrder` sends without re-reading the cart - a step-4 schedule change must land here too.
   */
  setPayloadAutoOrder: (userProductId: string, autoOrder: AutoOrderPeriod | null) => void
  setExcludedFromOrder: (excluded: ExcludedSellerLines[]) => void
  setOrderResult: (result: PlaceOrderResponse) => void
  /**
   * Wipes everything the shipping step froze (ETA text, per-vendor methods, shipping cost,
   * `orderPayload`, excluded lines) but keeps the address and payment fields. Called by
   * `useCheckoutCartSync` when the cart changes under a frozen step 3/4 payload.
   */
  clearShippingSelection: () => void
  reset: () => void
}

/**
 * Empty by design: a pre-filled record would stay in the form if the saved-address request fails,
 * and an unnoticed order would ship to it. `reset()` restores this same empty record.
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

/** The store's starting values; both the creator and `reset()` spread this so they cannot drift. */
const initialState = {
  currentStep: 1 as CheckoutStep,
  shippingAddress: initialShippingAddress,
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
  pendingNewCard: null as PendingNewCard | null,
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
 * Used by `setPayloadAutoOrder` for both `shippoRateOrders` and `uberRateOrders`. Only orders that
 * contain the product get new references, so untouched orders keep their identity.
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

export const useCheckoutStore = create<CheckoutStore>((set) => ({
  ...initialState,
  setStep: (step) => set({ currentStep: step }),
  nextStep: () => set((state) => ({ currentStep: Math.min(5, state.currentStep + 1) as CheckoutStep })),
  previousStep: () => set((state) => ({ currentStep: Math.max(1, state.currentStep - 1) as CheckoutStep })),
  updateShippingAddress: (address) => set((state) => ({ shippingAddress: { ...state.shippingAddress, ...address } })),
  updatePONumber: (po) => set({ poNumber: po }),
  updateDepartment: (dept) => set({ department: dept }),
  updateSpecialInstructions: (instructions) => set({ specialInstructions: instructions }),
  setApplyTaxExemption: (apply) => set({ applyTaxExemption: apply }),
  setSaveCard: (save) => set({ saveCard: save }),
  setCardName: (name) => set({ cardName: name }),
  setSelectedSavedCardId: (cardId) => set({ selectedSavedCardId: cardId }),
  setPendingNewCard: (card) => set({ pendingNewCard: card }),
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
