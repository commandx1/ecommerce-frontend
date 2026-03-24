import { Home, Package } from "lucide-react"
import Link from "next/link"

interface OrderConfirmationActionsProps {
  onContinueShopping: () => void
}

export default function OrderConfirmationActions({ onContinueShopping }: OrderConfirmationActionsProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 justify-center">
      <Link
        href="/buyer-dashboard/orders"
        className="flex items-center justify-center px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors"
      >
        <Package className="mr-2 w-5 h-5" />
        View Orders
      </Link>
      <button
        type="button"
        onClick={onContinueShopping}
        className="flex items-center justify-center px-6 py-3 bg-steel-blue text-white rounded-lg hover:bg-opacity-90 font-semibold transition-colors"
      >
        <Home className="mr-2 w-5 h-5" />
        Continue Shopping
      </button>
    </div>
  )
}
