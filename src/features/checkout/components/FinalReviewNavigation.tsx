import { ArrowLeft, ArrowRight } from "lucide-react"
import ActionButton from "@/components/ui/ActionButton"
import AsyncSubmitButton from "@/components/ui/AsyncSubmitButton"

interface FinalReviewNavigationProps {
  isPlacingOrder: boolean
  submitDisabled: boolean
  onBack: () => void
  onPlaceOrder: () => void
}

export default function FinalReviewNavigation({
  isPlacingOrder,
  submitDisabled,
  onBack,
  onPlaceOrder,
}: FinalReviewNavigationProps) {
  return (
    <div className="flex items-center justify-between">
      <ActionButton type="button" onClick={onBack} intent="outline">
        <ArrowLeft className="mr-2 w-5 h-5" />
        Back to Billing
      </ActionButton>
      <AsyncSubmitButton
        type="button"
        onClick={onPlaceOrder}
        idleText="Place Order"
        submittingText="Placing Order..."
        isSubmitting={isPlacingOrder}
        disabled={submitDisabled}
        fullWidth={false}
        icon={<ArrowRight className="ml-2 w-5 h-5" />}
      />
    </div>
  )
}
