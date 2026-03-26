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

export interface BillingAddress {
  sameAsShipping: boolean
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

interface CheckoutStore {
  currentStep: CheckoutStep
  shippingAddress: ShippingAddress
  billingAddress: BillingAddress
  paymentMethod: PaymentMethod
  orderPayload: PlaceOrderPayload | null
  orderResult: PlaceOrderResponse | null
  poNumber: string
  department: string
  specialInstructions: string
  applyTaxExemption: boolean
  saveCard: boolean
  cardName: string
  termsAgreed: boolean
  marketingAgreed: boolean
  hipaaAgreed: boolean
  selectedShippingEtaText: string
  selectedShippingCost: number
  setStep: (step: CheckoutStep) => void
  nextStep: () => void
  previousStep: () => void
  updateShippingAddress: (address: Partial<ShippingAddress>) => void
  updateBillingAddress: (address: Partial<BillingAddress>) => void
  setBillingSameAsShipping: (same: boolean) => void
  updatePaymentMethod: (method: Partial<PaymentMethod>) => void
  updatePONumber: (po: string) => void
  updateDepartment: (dept: string) => void
  updateSpecialInstructions: (instructions: string) => void
  setApplyTaxExemption: (apply: boolean) => void
  setSaveCard: (save: boolean) => void
  setCardName: (name: string) => void
  setTermsAgreed: (agreed: boolean) => void
  setMarketingAgreed: (agreed: boolean) => void
  setHipaaAgreed: (agreed: boolean) => void
  setSelectedShippingEtaText: (etaText: string) => void
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

const initialBillingAddress: BillingAddress = {
  sameAsShipping: true,
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

export const useCheckoutStore = create<CheckoutStore>((set) => ({
  currentStep: 1,
  shippingAddress: initialShippingAddress,
  billingAddress: initialBillingAddress,
  paymentMethod: initialPaymentMethod,
  orderPayload: null,
  orderResult: null,
  poNumber: "",
  department: "",
  specialInstructions: "",
  applyTaxExemption: true,
  saveCard: false,
  cardName: "",
  termsAgreed: false,
  marketingAgreed: false,
  hipaaAgreed: false,
  selectedShippingEtaText: "",
  selectedShippingCost: 0,
  setStep: (step) => set({ currentStep: step }),
  nextStep: () => set((state) => ({ currentStep: Math.min(5, state.currentStep + 1) as CheckoutStep })),
  previousStep: () => set((state) => ({ currentStep: Math.max(1, state.currentStep - 1) as CheckoutStep })),
  updateShippingAddress: (address) => set((state) => ({ shippingAddress: { ...state.shippingAddress, ...address } })),
  updateBillingAddress: (address) => set((state) => ({ billingAddress: { ...state.billingAddress, ...address } })),
  setBillingSameAsShipping: (same) =>
    set((state) => ({
      billingAddress: {
        ...state.billingAddress,
        sameAsShipping: same,
        ...(same ? {} : initialBillingAddress),
      },
    })),
  updatePaymentMethod: (method) => set((state) => ({ paymentMethod: { ...state.paymentMethod, ...method } })),
  updatePONumber: (po) => set({ poNumber: po }),
  updateDepartment: (dept) => set({ department: dept }),
  updateSpecialInstructions: (instructions) => set({ specialInstructions: instructions }),
  setApplyTaxExemption: (apply) => set({ applyTaxExemption: apply }),
  setSaveCard: (save) => set({ saveCard: save }),
  setCardName: (name) => set({ cardName: name }),
  setTermsAgreed: (agreed) => set({ termsAgreed: agreed }),
  setMarketingAgreed: (agreed) => set({ marketingAgreed: agreed }),
  setHipaaAgreed: (agreed) => set({ hipaaAgreed: agreed }),
  setSelectedShippingEtaText: (etaText) => set({ selectedShippingEtaText: etaText }),
  setSelectedShippingCost: (cost) => set({ selectedShippingCost: cost }),
  setOrderPayload: (payload) => set({ orderPayload: payload }),
  setOrderResult: (result) => set({ orderResult: result }),
  reset: () =>
    set({
      currentStep: 1,
      shippingAddress: initialShippingAddress,
      billingAddress: initialBillingAddress,
      paymentMethod: initialPaymentMethod,
      poNumber: "",
      department: "",
      specialInstructions: "",
      applyTaxExemption: true,
      saveCard: false,
      cardName: "",
      termsAgreed: false,
      marketingAgreed: false,
      hipaaAgreed: false,
      selectedShippingEtaText: "Express Delivery - 2-3 business days",
      selectedShippingCost: 0,
      orderPayload: null,
      orderResult: null,
    }),
}))
