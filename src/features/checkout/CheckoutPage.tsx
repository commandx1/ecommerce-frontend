"use client"

import CheckoutLayout from "@/features/checkout/components/CheckoutLayout"
import { useCheckoutPage } from "@/features/checkout/hooks/useCheckoutPage"

export default function CheckoutPage() {
  const { currentStep, showOrderSummary, view } = useCheckoutPage()

  return <CheckoutLayout currentStep={currentStep} showOrderSummary={showOrderSummary} view={view} />
}
