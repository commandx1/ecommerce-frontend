"use client"

import SurfaceCard from "@/components/ui/SurfaceCard"
import BillingAddressForm from "@/features/checkout/components/BillingAddressForm"
import BillingAddressSection from "@/features/checkout/components/BillingAddressSection"
import BillingAgreementsSection from "@/features/checkout/components/BillingAgreementsSection"
import BillingHeader from "@/features/checkout/components/BillingHeader"
import BillingNavigation from "@/features/checkout/components/BillingNavigation"
import CardPaymentNotice from "@/features/checkout/components/CardPaymentNotice"
import PaymentMethodSection from "@/features/checkout/components/PaymentMethodSection"
import { useBillingInformation } from "@/features/checkout/hooks/useBillingInformation"
import { useCheckoutStore } from "@/stores/checkoutStore"

export default function BillingInformation() {
  const {
    billingAddress,
    shippingAddress,
    paymentMethod,
    termsAgreed,
    setBillingSameAsShipping,
    updateBillingAddress,
    updatePaymentMethod,
    setTermsAgreed,
    previousStep,
  } = useCheckoutStore()

  const { paymentOptions, showDifferentBilling, onSubmit, setShowDifferentBilling } = useBillingInformation()

  return (
    <SurfaceCard variant="editorial" className="mb-8 p-8">
      <BillingHeader />
      <form onSubmit={onSubmit} className="space-y-8">
        <BillingAddressSection
          shippingAddress={shippingAddress}
          showDifferentBilling={showDifferentBilling}
          setBillingSameAsShipping={setBillingSameAsShipping}
          setShowDifferentBilling={setShowDifferentBilling}
        />

        {showDifferentBilling ? (
          <BillingAddressForm billingAddress={billingAddress} updateBillingAddress={updateBillingAddress} />
        ) : null}

        <PaymentMethodSection
          paymentMethod={paymentMethod}
          paymentOptions={paymentOptions}
          updatePaymentMethod={updatePaymentMethod}
        />

        <CardPaymentNotice isVisible={paymentMethod.type === "card"} />
        <BillingAgreementsSection termsAgreed={termsAgreed} setTermsAgreed={setTermsAgreed} />

        <BillingNavigation termsAgreed={termsAgreed} onBack={previousStep} />
      </form>
    </SurfaceCard>
  )
}
