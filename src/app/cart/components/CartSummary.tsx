"use client"

import { useCartStore } from "@/stores/cartStore"
import formatCurrency from "@/lib/helpers/formatCurrency"

interface CartSummaryProps {
  onCheckout: () => void
}

const CartSummary = ({ onCheckout }: CartSummaryProps) => {
  const { items } = useCartStore()

  const subtotal = items.reduce((sum, item) => {
    return sum + item.userProduct.price * item.quantity
  }, 0)

  // Logic for shipping and tax
  const shipping = subtotal > 1000 ? 0 : 50 // Example logic
  const tax = subtotal * 0.18 // Example tax rate
  const total = subtotal + shipping + tax

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-6">
      <h3 className="text-xl font-bold text-steel-blue mb-6">Order Summary</h3>
      <div className="space-y-3 mb-6">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Subtotal ({items.length} items)</span>
          <span className="font-medium">{formatCurrency(subtotal)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Shipping</span>
          <span className="font-medium">{shipping === 0 ? "Free" : formatCurrency(shipping)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Tax (Est.)</span>
          <span className="font-medium">{formatCurrency(tax)}</span>
        </div>
        <div className="border-t border-gray-200 pt-3">
          <div className="flex justify-between">
            <span className="text-lg font-bold text-gray-900">Total</span>
            <span className="text-lg font-bold text-steel-blue">{formatCurrency(total)}</span>
          </div>
        </div>
      </div>
      <button
        type="button"
        disabled={items.length === 0}
        onClick={onCheckout}
        className="w-full bg-steel-blue text-white py-3 px-6 rounded-lg hover:bg-opacity-90 font-semibold text-lg transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
      >
        Proceed to Checkout
      </button>
    </div>
  )
}

export default CartSummary
