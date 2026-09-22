"use client"

import { Elements } from "@stripe/react-stripe-js"
import NoticeBanner from "@/components/feedback/NoticeBanner"
import SurfaceCard from "@/components/ui/SurfaceCard"
import BillingAgreementsSection from "@/features/checkout/components/BillingAgreementsSection"
import BillingHeader from "@/features/checkout/components/BillingHeader"
import BillingNavigation from "@/features/checkout/components/BillingNavigation"
import PaymentCardSection from "@/features/checkout/components/PaymentCardSection"
import { useBillingInformation } from "@/features/checkout/hooks/useBillingInformation"
import { useStripePromise } from "@/hooks/useStripePromise"
import { useCheckoutStore } from "@/stores/checkoutStore"

function BillingInformationContent() {
  const { termsAgreed, setTermsAgreed, previousStep } = useCheckoutStore()

  const {
    cardName,
    isLoadingCards,
    isSubmitting,
    saveCard,
    savedCards,
    selectedSavedCardId,
    pendingNewCard,
    showInlineNewCardForm,
    hasAutoOrderItems,
    autoOrderConsent,
    newCardAutoPaymentConsent,
    setCardName,
    setSaveCard,
    setSelectedSavedCardId,
    setAutoOrderConsent,
    setNewCardAutoPaymentConsent,
    setPendingNewCard,
    onSubmit,
  } = useBillingInformation()

  return (
    <SurfaceCard variant="editorial" className="mb-8 p-5 sm:p-8">
      <BillingHeader />
      <form onSubmit={onSubmit} className="space-y-8">
        <PaymentCardSection
          cardName={cardName}
          isLoadingCards={isLoadingCards}
          isSubmitting={isSubmitting}
          saveCard={saveCard}
          savedCards={savedCards}
          selectedSavedCardId={selectedSavedCardId}
          pendingNewCard={pendingNewCard}
          showInlineNewCardForm={showInlineNewCardForm}
          setCardName={setCardName}
          setSaveCard={setSaveCard}
          setSelectedSavedCardId={setSelectedSavedCardId}
          hasAutoOrderItems={hasAutoOrderItems}
          autoOrderConsent={autoOrderConsent}
          setAutoOrderConsent={setAutoOrderConsent}
          newCardAutoPaymentConsent={newCardAutoPaymentConsent}
          setNewCardAutoPaymentConsent={setNewCardAutoPaymentConsent}
          setPendingNewCard={setPendingNewCard}
        />

        <BillingAgreementsSection termsAgreed={termsAgreed} setTermsAgreed={setTermsAgreed} />

        <BillingNavigation termsAgreed={termsAgreed} isSubmitting={isSubmitting} onBack={previousStep} />
      </form>
    </SurfaceCard>
  )
}

export default function BillingInformation() {
  const stripePromise = useStripePromise()

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
