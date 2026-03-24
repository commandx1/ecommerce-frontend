import { Lock } from "lucide-react"

export default function BillingHeader() {
  return (
    <div className="flex items-center justify-between mb-8">
      <div className="flex items-center">
        <div className="w-8 h-8 bg-steel-blue rounded-full flex items-center justify-center mr-4">
          <span className="text-white text-sm font-semibold">3</span>
        </div>
        <h2 className="text-2xl font-bold text-steel-blue">Billing Information</h2>
      </div>
      <div className="flex items-center space-x-2 text-sm text-gray-600">
        <Lock className="w-4 h-4 text-green-500" />
        <span>Secure checkout</span>
      </div>
    </div>
  )
}
