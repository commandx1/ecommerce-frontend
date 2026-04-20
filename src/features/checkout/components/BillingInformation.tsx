"use client"

import NoticeBanner from "@/components/feedback/NoticeBanner"
import { Elements } from "@stripe/react-stripe-js"
import { loadStripe } from "@stripe/stripe-js"
import SurfaceCard from "@/components/ui/SurfaceCard"
import BillingAgreementsSection from "@/features/checkout/components/BillingAgreementsSection"
import BillingHeader from "@/features/checkout/components/BillingHeader"
import BillingNavigation from "@/features/checkout/components/BillingNavigation"
import FinalReviewPaymentSection from "@/features/checkout/components/FinalReviewPaymentSection"
import PaymentMethodSection from "@/features/checkout/components/PaymentMethodSection"
import { useBillingInformation } from "@/features/checkout/hooks/useBillingInformation"
import { useCheckoutStore } from "@/stores/checkoutStore"

const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ""
const stripePromise = stripePublishableKey ? loadStripe(stripePublishableKey) : null

function BillingInformationContent() {
  const {
    paymentMethod,
    termsAgreed,
    updatePaymentMethod,
    setTermsAgreed,
    previousStep,
  } = useCheckoutStore()

  const {
    cardName,
    isLoadingCards,
    paymentOptions,
    paymentType,
    saveCard,
    savedCards,
    selectedSavedCardId,
    setCardName,
    setSaveCard,
    setSelectedSavedCardId,
    onSubmit,
  } = useBillingInformation()

  return (
    <SurfaceCard variant="editorial" className="mb-8 p-8">
      <BillingHeader />
      <form onSubmit={onSubmit} className="space-y-8">
        <PaymentMethodSection
          paymentMethod={paymentMethod}
          paymentOptions={paymentOptions}
          updatePaymentMethod={updatePaymentMethod}
        />

        {paymentMethod.type === "card" ? (
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
        ) : null}

        <BillingAgreementsSection termsAgreed={termsAgreed} setTermsAgreed={setTermsAgreed} />

        <BillingNavigation termsAgreed={termsAgreed} onBack={previousStep} />
      </form>
    </SurfaceCard>
  )
}

export default function BillingInformation() {
  if (!stripePromise) {
    return (
      <SurfaceCard variant="editorial" className="mb-8 p-8">
        <BillingHeader />
        <NoticeBanner
          tone="error"
          description="Stripe publishable key is missing. Please set `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`."
        />
      </SurfaceCard>
    )
  }

  return (
    <Elements stripe={stripePromise}>
      <BillingInformationContent />
    </Elements>
  )
}
