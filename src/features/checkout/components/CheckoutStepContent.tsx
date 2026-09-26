import BillingInformation from "@/features/checkout/components/BillingInformation"
import FinalReview from "@/features/checkout/components/FinalReview"
import OrderConfirmation from "@/features/checkout/components/OrderConfirmation"
import ShippingDetails from "@/features/checkout/components/ShippingDetails"

interface CheckoutStepContentProps {
  view: "shipping" | "billing" | "review" | "confirmation" | "empty"
}

export default function CheckoutStepContent({ view }: CheckoutStepContentProps) {
  if (view === "shipping") return <ShippingDetails />
  if (view === "billing") return <BillingInformation />
  if (view === "review") return <FinalReview />
  if (view === "confirmation") return <OrderConfirmation />
  return null
}
