import { create } from "zustand"
import type { PlaceOrderPayload, PlaceOrderResponse } from "@/lib/api/orders"

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

interface CheckoutStore {
  currentStep: CheckoutStep
  shippingAddress: ShippingAddress
  paymentMethod: PaymentMethod
  orderPayload: PlaceOrderPayload | null
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
  setOrderResult: (result: PlaceOrderResponse) => void
  reset: () => void
}

const initialShippingAddress: ShippingAddress = {
  firstName: "Michael",
  lastName: "Chen",
  company: "Pacific Dental Group",
  street: "2847 Mission Street, Suite 300",
  city: "San Francisco",
  state: "CA",
  zipCode: "94110",
  phone: "(415) 555-0123",
}

const initialPaymentMethod: PaymentMethod = {
  type: "card",
}

export const useCheckoutStore = create<CheckoutStore>((set) => ({
  currentStep: 1,
  shippingAddress: initialShippingAddress,
  paymentMethod: initialPaymentMethod,
  orderPayload: null,
  orderResult: null,
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
  autoOrderUserProductIds: [],
  termsAgreed: false,
  selectedShippingEtaText: "",
  selectedVendorShippingMethods: {},
  selectedShippingCost: 0,
  setStep: (step) => set({ currentStep: step }),
  nextStep: () => set((state) => ({ currentStep: Math.min(5, state.currentStep + 1) as CheckoutStep })),
  previousStep: () => set((state) => ({ currentStep: Math.max(1, state.currentStep - 1) as CheckoutStep })),
  updateShippingAddress: (address) => set((state) => ({ shippingAddress: { ...state.shippingAddress, ...address } })),
  updatePaymentMethod: (method) => set((state) => ({ paymentMethod: { ...state.paymentMethod, ...method } })),
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
  setOrderResult: (result) => set({ orderResult: result }),
  reset: () =>
    set({
      currentStep: 1,
      shippingAddress: initialShippingAddress,
      paymentMethod: initialPaymentMethod,
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
      autoOrderUserProductIds: [],
      termsAgreed: false,
      selectedShippingEtaText: "Express Delivery - 2-3 business days",
      selectedVendorShippingMethods: {},
      selectedShippingCost: 0,
      orderPayload: null,
      orderResult: null,
    }),
}))
