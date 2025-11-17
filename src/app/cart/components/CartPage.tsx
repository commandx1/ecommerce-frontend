"use client"

import { useRouter } from "next/navigation"
import { useCartStore } from "@/stores/cartStore"
import { useCheckoutStore } from "@/stores/checkoutStore"
import CartItems from "./CartItems"
import CartSummary from "./CartSummary"

const CartPage = () => {
  const router = useRouter()
  const { items } = useCartStore()
  const { setStep } = useCheckoutStore()

  const handleCheckout = () => {
    if (items.length === 0) return
    setStep(2)
    router.push("/checkout")
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-light-mint-gray py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <h1 className="text-3xl font-bold text-steel-blue mb-4">Your Cart is Empty</h1>
            <p className="text-gray-600 mb-8">Add some products to your cart to get started.</p>
            <button
              type="button"
              onClick={() => router.push("/")}
              className="bg-steel-blue text-white px-8 py-3 rounded-lg hover:bg-opacity-90 font-semibold transition-colors"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-light-mint-gray py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-steel-blue mb-8">Shopping Cart</h1>
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1 lg:w-2/3 mx-auto">
            <CartItems />
          </div>
          <div className="lg:w-1/3">
            <CartSummary onCheckout={handleCheckout} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default CartPage
