"use client"

import { Elements } from "@stripe/react-stripe-js"
import SurfaceCard from "@/components/ui/SurfaceCard"
import FinalReviewAddressCards from "@/features/checkout/components/FinalReviewAddressCards"
import FinalReviewAutoOrderSummary from "@/features/checkout/components/FinalReviewAutoOrderSummary"
import FinalReviewExcludedNotice from "@/features/checkout/components/FinalReviewExcludedNotice"
import FinalReviewNavigation from "@/features/checkout/components/FinalReviewNavigation"
import FinalReviewPaymentSummary from "@/features/checkout/components/FinalReviewPaymentSummary"
import FinalReviewReadyNotice from "@/features/checkout/components/FinalReviewReadyNotice"
import FinalReviewUnavailable from "@/features/checkout/components/FinalReviewUnavailable"
import { useCheckoutAutoOrder } from "@/features/checkout/hooks/useCheckoutAutoOrder"
import { useFinalReview } from "@/features/checkout/hooks/useFinalReview"
import { useStripePromise } from "@/hooks/useStripePromise"
import { useCheckoutStore } from "@/stores/checkoutStore"

function FinalReviewContent() {
  const { shippingAddress, previousStep, excludedFromOrder } = useCheckoutStore()
  const { isPlacingOrder, paymentMethodSummary, submitDisabled, onPlaceOrder } = useFinalReview()
  const { autoOrderLines, pendingUserProductIds, onPeriodChange, onCancelRecurrence } = useCheckoutAutoOrder()

  return (
    <SurfaceCard variant="editorial" className="mb-8 p-8">
      <div className="flex items-center mb-8">
        <div className="mr-4 flex h-8 w-8 items-center justify-center rounded-full bg-brand">
          <span className="text-white text-sm font-semibold">4</span>
        </div>
        <h2 className="text-2xl font-semibold text-text-primary">Final Review</h2>
      </div>

      <FinalReviewExcludedNotice excludedFromOrder={excludedFromOrder} />

      <div className="space-y-6 mb-8">
        <FinalReviewAddressCards shippingAddress={shippingAddress} />
        <FinalReviewPaymentSummary paymentMethodSummary={paymentMethodSummary} />
        <FinalReviewAutoOrderSummary
          autoOrderLines={autoOrderLines}
          pendingUserProductIds={pendingUserProductIds}
          onPeriodChange={onPeriodChange}
          onCancelRecurrence={onCancelRecurrence}
        />
      </div>

      <FinalReviewReadyNotice />

      <FinalReviewNavigation
        isPlacingOrder={isPlacingOrder}
        submitDisabled={submitDisabled}
        onBack={previousStep}
        onPlaceOrder={() => {
          void onPlaceOrder()
        }}
      />
    </SurfaceCard>
  )
}

export default function FinalReview() {
  const stripePromise = useStripePromise()

  if (!stripePromise) {
    return <FinalReviewUnavailable />
  }

  return (
    <Elements stripe={stripePromise}>
      <FinalReviewContent />
    </Elements>
  )
}
