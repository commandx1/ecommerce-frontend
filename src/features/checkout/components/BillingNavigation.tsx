import { ArrowLeft, ArrowRight } from "lucide-react"

interface BillingNavigationProps {
  termsAgreed: boolean
  onBack: () => void
}

export default function BillingNavigation({ termsAgreed, onBack }: BillingNavigationProps) {
  return (
    <div className="flex items-center justify-between pt-6">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors"
      >
        <ArrowLeft className="mr-2 w-5 h-5" />
        Back to Shipping
      </button>
      <button
        type="submit"
        disabled={!termsAgreed}
        className="flex items-center px-8 py-3 bg-steel-blue text-white rounded-lg hover:bg-opacity-90 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Continue to Review
        <ArrowRight className="ml-2 w-5 h-5" />
      </button>
    </div>
  )
}
