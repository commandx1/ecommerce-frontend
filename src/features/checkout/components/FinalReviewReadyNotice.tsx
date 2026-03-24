import { CheckCircle } from "lucide-react"

export default function FinalReviewReadyNotice() {
  return (
    <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-8">
      <div className="flex items-center mb-2">
        <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
        <span className="text-sm font-medium text-green-800">Ready to Place Order</span>
      </div>
      <p className="text-xs text-green-700">
        Please review all information above. Once you place your order, you will receive a confirmation email.
      </p>
    </div>
  )
}
