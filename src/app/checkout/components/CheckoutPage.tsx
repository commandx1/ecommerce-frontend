"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { useCartStore } from "@/stores/cartStore"
import { useCheckoutStore } from "@/stores/checkoutStore"
import BillingInformation from "./BillingInformation"
import CheckoutProgress from "./CheckoutProgress"
import FinalReview from "./FinalReview"
import OrderConfirmation from "./OrderConfirmation"
import OrderSummary from "./OrderSummary"
import ShippingDetails from "./ShippingDetails"

const CheckoutPage = () => {
  const router = useRouter()
  const { items } = useCartStore()
  const { currentStep } = useCheckoutStore()

  useEffect(() => {
    if (items.length === 0) {
      router.push("/cart")
    } else if (currentStep === 1) {
      router.push("/cart")
    }
  }, [items.length, currentStep, router])

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return null
      case 2:
        return <ShippingDetails />
      case 3:
        return <BillingInformation />
      case 4:
        return <FinalReview />
      case 5:
        return <OrderConfirmation />
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-light-mint-gray">
      <CheckoutProgress />
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-12">
            <div className="flex-1 lg:w-2/3">{renderStepContent()}</div>
            <div className="lg:w-1/3">
              <OrderSummary />
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default CheckoutPage
