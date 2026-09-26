import { ArrowLeft } from "lucide-react"
import ActionButton from "@/components/ui/ActionButton"

interface BillingNavigationProps {
  termsAgreed: boolean
  isSubmitting: boolean
  onBack: () => void
}

export default function BillingNavigation({ termsAgreed, isSubmitting, onBack }: BillingNavigationProps) {
  return (
    <div className="flex flex-col-reverse gap-3 pt-6 sm:flex-row sm:items-center sm:justify-between">
      <ActionButton type="button" onClick={onBack} intent="outline">
        <ArrowLeft className="mr-2 w-5 h-5" />
        Back to Shipping
      </ActionButton>
      {/* Disabled while the Stripe call is in flight: without this a second click fires a
          second `createPaymentMethod`, which is a payment-flow action and must not double-run. */}
      <ActionButton type="submit" disabled={!termsAgreed || isSubmitting}>
        {isSubmitting ? "Saving…" : "Continue to Review"}
      </ActionButton>
    </div>
  )
}
