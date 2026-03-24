"use client"

import { Elements } from "@stripe/react-stripe-js"
import { loadStripe } from "@stripe/stripe-js"
import FinalReviewAddressCards from "@/features/checkout/components/FinalReviewAddressCards"
import FinalReviewNavigation from "@/features/checkout/components/FinalReviewNavigation"
import FinalReviewPaymentSection from "@/features/checkout/components/FinalReviewPaymentSection"
import FinalReviewReadyNotice from "@/features/checkout/components/FinalReviewReadyNotice"
import FinalReviewUnavailable from "@/features/checkout/components/FinalReviewUnavailable"
import { useFinalReview } from "@/features/checkout/hooks/useFinalReview"
import { useCheckoutStore } from "@/stores/checkoutStore"

const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ""
const stripePromise = stripePublishableKey ? loadStripe(stripePublishableKey) : null

function FinalReviewContent() {
  const { billingAddress, shippingAddress, previousStep } = useCheckoutStore()
  const {
    cardName,
    isLoadingCards,
    isPlacingOrder,
    paymentType,
    saveCard,
    savedCards,
    selectedSavedCardId,
    submitDisabled,
    onPlaceOrder,
    setCardName,
    setSaveCard,
    setSelectedSavedCardId,
  } = useFinalReview()

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
      <div className="flex items-center mb-8">
        <div className="w-8 h-8 bg-steel-blue rounded-full flex items-center justify-center mr-4">
          <span className="text-white text-sm font-semibold">4</span>
        </div>
        <h2 className="text-2xl font-bold text-steel-blue">Final Review</h2>
      </div>

      <div className="space-y-6 mb-8">
        <FinalReviewAddressCards billingAddress={billingAddress} shippingAddress={shippingAddress} />
        <FinalReviewPaymentSection
          cardName={cardName}
          isLoadingCards={isLoadingCards}
          paymentType={paymentType}
          saveCard={saveCard}
          savedCards={savedCards}
          selectedSavedCardId={selectedSavedCardId}
          setCardName={setCardName}
          setSaveCard={setSaveCard}
          setSelectedSavedCardId={setSelectedSavedCardId}
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
    </div>
  )
}

export default function FinalReview() {
  if (!stripePromise) {
    return <FinalReviewUnavailable />
  }

  return (
    <Elements stripe={stripePromise}>
      <FinalReviewContent />
    </Elements>
  )
}
