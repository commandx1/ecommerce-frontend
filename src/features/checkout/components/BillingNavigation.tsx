import { ArrowLeft, ArrowRight } from "lucide-react"
import ActionButton from "@/components/ui/ActionButton"

interface BillingNavigationProps {
  termsAgreed: boolean
  onBack: () => void
}

export default function BillingNavigation({ termsAgreed, onBack }: BillingNavigationProps) {
  return (
    <div className="flex items-center justify-between pt-6">
      <ActionButton type="button" onClick={onBack} intent="outline">
        <ArrowLeft className="mr-2 w-5 h-5" />
        Back to Shipping
      </ActionButton>
      <ActionButton type="submit" disabled={!termsAgreed}>
        Continue to Review
        <ArrowRight className="ml-2 w-5 h-5" />
      </ActionButton>
    </div>
  )
}
