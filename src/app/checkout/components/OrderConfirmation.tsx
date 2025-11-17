"use client"

import { CheckCircle, Home, Package } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCartStore } from "@/stores/cartStore"
import { useCheckoutStore } from "@/stores/checkoutStore"

const OrderConfirmation = () => {
  const router = useRouter()
  const { clearCart } = useCartStore()
  const { reset } = useCheckoutStore()

  const handleContinueShopping = () => {
    clearCart()
    reset()
    router.push("/")
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-12 mb-8 text-center">
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <CheckCircle className="w-12 h-12 text-green-600" />
      </div>
      <h2 className="text-3xl font-bold text-steel-blue mb-4">Order Confirmed!</h2>
      <p className="text-lg text-gray-600 mb-8">
        Thank you for your order. We&apos;ve received your order and will begin processing it right away.
      </p>
      <div className="bg-light-mint-gray rounded-xl p-6 mb-8 max-w-md mx-auto">
        <div className="text-sm text-gray-600 mb-2">Order Number</div>
        <div className="text-2xl font-bold text-steel-blue mb-4">ORD-{Date.now().toString().slice(-6)}</div>
        <div className="text-sm text-gray-600">
          You will receive an email confirmation shortly with your order details and tracking information.
        </div>
      </div>
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link
          href="/buyer-dashboard"
          className="flex items-center justify-center px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors"
        >
          <Package className="mr-2 w-5 h-5" />
          View Orders
        </Link>
        <button
          type="button"
          onClick={handleContinueShopping}
          className="flex items-center justify-center px-6 py-3 bg-steel-blue text-white rounded-lg hover:bg-opacity-90 font-semibold transition-colors"
        >
          <Home className="mr-2 w-5 h-5" />
          Continue Shopping
        </button>
      </div>
    </div>
  )
}

export default OrderConfirmation
