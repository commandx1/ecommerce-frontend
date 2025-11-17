import { create } from "zustand"

export type CheckoutStep = 1 | 2 | 3 | 4 | 5

interface ShippingAddress {
  firstName: string
  lastName: string
  company: string
  street: string
  city: string
  state: string
  zipCode: string
  phone: string
}

interface BillingAddress {
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

interface PaymentMethod {
  type: "card" | "net30" | "wire" | "financing"
  cardNumber?: string
  expiryMonth?: string
  expiryYear?: string
  cvv?: string
  cardholderName?: string
}

interface CheckoutStore {
  currentStep: CheckoutStep
  shippingAddress: ShippingAddress
  billingAddress: BillingAddress
  paymentMethod: PaymentMethod
  poNumber: string
  department: string
  specialInstructions: string
  applyTaxExemption: boolean
  termsAgreed: boolean
  marketingAgreed: boolean
  hipaaAgreed: boolean
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
  setTermsAgreed: (agreed: boolean) => void
  setMarketingAgreed: (agreed: boolean) => void
  setHipaaAgreed: (agreed: boolean) => void
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
  cardholderName: "Dr. Michael Chen",
}

export const useCheckoutStore = create<CheckoutStore>((set) => ({
  currentStep: 1,
  shippingAddress: initialShippingAddress,
  billingAddress: initialBillingAddress,
  paymentMethod: initialPaymentMethod,
  poNumber: "",
  department: "",
  specialInstructions: "",
  applyTaxExemption: true,
  termsAgreed: false,
  marketingAgreed: false,
  hipaaAgreed: false,
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
  setTermsAgreed: (agreed) => set({ termsAgreed: agreed }),
  setMarketingAgreed: (agreed) => set({ marketingAgreed: agreed }),
  setHipaaAgreed: (agreed) => set({ hipaaAgreed: agreed }),
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
      termsAgreed: false,
      marketingAgreed: false,
      hipaaAgreed: false,
    }),
}))
