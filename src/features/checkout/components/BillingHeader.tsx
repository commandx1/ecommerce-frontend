import { Lock } from "lucide-react"

export default function BillingHeader() {
  return (
    <div className="mb-8 flex items-center justify-between">
      <div className="flex items-center">
        <div className="mr-4 flex h-8 w-8 items-center justify-center rounded-full bg-brand">
          <span className="text-sm font-semibold text-white">3</span>
        </div>
        <h2 className="text-2xl font-bold text-text-primary">Billing Information</h2>
      </div>
      <div className="flex items-center space-x-2 text-sm text-text-secondary">
        <Lock className="h-4 w-4 text-success" />
        <span>Secure checkout</span>
      </div>
    </div>
  )
}
