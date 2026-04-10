"use client"

import { useCallback, useMemo, useState } from "react"
import type { PaymentMethodOption } from "@/features/checkout/types"
import { useCheckoutStore } from "@/stores/checkoutStore"

const PAYMENT_METHOD_OPTIONS: PaymentMethodOption[] = [
  { type: "card", title: "Credit/Debit Card", icon: "card" },
  {
    type: "net30",
    title: "Net 30 Terms",
    description: "Pay within 30 days of invoice date",
    badge: { label: "Approved", className: "bg-accent-strong text-accent-foreground" },
    icon: "file",
  },
  {
    type: "wire",
    title: "Wire Transfer",
    description: "Bank transfer for large orders",
    icon: "bank",
  },
  {
    type: "financing",
    title: "Equipment Financing",
    description: "Flexible payment plans for equipment purchases",
    badge: { label: "0% APR", className: "bg-coral-orange text-white" },
    icon: "finance",
  },
]

interface UseBillingInformationResult {
  paymentOptions: PaymentMethodOption[]
  showDifferentBilling: boolean
  onSubmit: (event: React.FormEvent) => void
  setShowDifferentBilling: (value: boolean) => void
}

export function useBillingInformation(): UseBillingInformationResult {
  const { billingAddress, nextStep, termsAgreed } = useCheckoutStore()
  const [showDifferentBilling, setShowDifferentBilling] = useState(!billingAddress.sameAsShipping)

  const onSubmit = useCallback(
    (event: React.FormEvent) => {
      event.preventDefault()
      if (termsAgreed) {
        nextStep()
      }
    },
    [nextStep, termsAgreed],
  )

  const paymentOptions = useMemo(() => PAYMENT_METHOD_OPTIONS, [])

  return {
    paymentOptions,
    showDifferentBilling,
    onSubmit,
    setShowDifferentBilling,
  }
}
