"use client"

import SurfaceCard from "@/components/ui/SurfaceCard"
import BillingAddressForm from "@/features/checkout/components/BillingAddressForm"
import BillingAddressSection from "@/features/checkout/components/BillingAddressSection"
import BillingAgreementsSection from "@/features/checkout/components/BillingAgreementsSection"
import BillingHeader from "@/features/checkout/components/BillingHeader"
import BillingNavigation from "@/features/checkout/components/BillingNavigation"
import CardPaymentNotice from "@/features/checkout/components/CardPaymentNotice"
import PaymentMethodSection from "@/features/checkout/components/PaymentMethodSection"
import PurchaseOrderSection from "@/features/checkout/components/PurchaseOrderSection"
import { useBillingInformation } from "@/features/checkout/hooks/useBillingInformation"
import { useCheckoutStore } from "@/stores/checkoutStore"

export default function BillingInformation() {
  const {
    billingAddress,
    shippingAddress,
    paymentMethod,
    poNumber,
    department,
    specialInstructions,
    termsAgreed,
    marketingAgreed,
    hipaaAgreed,
    setBillingSameAsShipping,
    updateBillingAddress,
    updatePaymentMethod,
    updatePONumber,
    updateDepartment,
    updateSpecialInstructions,
    setTermsAgreed,
    setMarketingAgreed,
    setHipaaAgreed,
    previousStep,
  } = useCheckoutStore()

  const { paymentOptions, showDifferentBilling, onSubmit, setShowDifferentBilling } = useBillingInformation()

  return (
    <SurfaceCard className="mb-8 p-8">
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

        <PurchaseOrderSection
          poNumber={poNumber}
          department={department}
          specialInstructions={specialInstructions}
          updatePONumber={updatePONumber}
          updateDepartment={updateDepartment}
          updateSpecialInstructions={updateSpecialInstructions}
        />
        <BillingAgreementsSection
          termsAgreed={termsAgreed}
          marketingAgreed={marketingAgreed}
          hipaaAgreed={hipaaAgreed}
          setTermsAgreed={setTermsAgreed}
          setMarketingAgreed={setMarketingAgreed}
          setHipaaAgreed={setHipaaAgreed}
        />

        <BillingNavigation termsAgreed={termsAgreed} onBack={previousStep} />
      </form>
    </SurfaceCard>
  )
}
