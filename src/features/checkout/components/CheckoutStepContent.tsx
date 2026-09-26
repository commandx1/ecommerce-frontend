import DentalLicenseNotice from "@/features/cart/components/DentalLicenseNotice"
import BillingInformation from "@/features/checkout/components/BillingInformation"
import FinalReview from "@/features/checkout/components/FinalReview"
import OrderConfirmation from "@/features/checkout/components/OrderConfirmation"
import ShippingDetails from "@/features/checkout/components/ShippingDetails"
import type { CheckoutLicenseWarning } from "@/features/checkout/hooks/useCheckoutPage"

interface CheckoutStepContentProps {
  view: "shipping" | "billing" | "review" | "confirmation" | "empty"
  licenseWarning: CheckoutLicenseWarning | null
}

export default function CheckoutStepContent({ view, licenseWarning }: CheckoutStepContentProps) {
  if (view === "shipping") return <ShippingDetails />
  if (view === "billing") return <BillingInformation />
  if (view === "review") return <FinalReview />
  if (view === "confirmation") return <OrderConfirmation />
  if (view === "empty" && licenseWarning) {
    return (
      <DentalLicenseNotice
        licenseCheckFailed={licenseWarning.licenseCheckFailed}
        licenseStatus={licenseWarning.licenseStatus}
        licenseRejectionReason={licenseWarning.licenseRejectionReason}
      />
    )
  }
  return null
}
