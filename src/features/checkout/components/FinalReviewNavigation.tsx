import { ArrowLeft, ArrowRight } from "lucide-react"

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
      <button
        type="button"
        onClick={onBack}
        className="flex items-center px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors"
      >
        <ArrowLeft className="mr-2 w-5 h-5" />
        Back to Billing
      </button>
      <button
        type="button"
        onClick={onPlaceOrder}
        disabled={submitDisabled}
        className="flex items-center px-8 py-3 bg-steel-blue text-white rounded-lg hover:bg-opacity-90 font-semibold transition-colors disabled:opacity-60"
      >
        {isPlacingOrder ? "Placing Order..." : "Place Order"}
        <ArrowRight className="ml-2 w-5 h-5" />
      </button>
    </div>
  )
}
