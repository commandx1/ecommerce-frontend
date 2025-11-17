"use client"

import productsData from "@/data/products.json"
import { useCartStore } from "@/stores/cartStore"

interface CartSummaryProps {
  onCheckout: () => void
}

const CartSummary = ({ onCheckout }: CartSummaryProps) => {
  const { items } = useCartStore()

  const subtotal = items.reduce((sum, item) => {
    const product = productsData.find((p) => p.id === item.productId)
    if (!product) return sum
    const price = parseFloat(product.price.replace("$", "").replace(",", ""))
    return sum + price * item.quantity
  }, 0)

  const shipping = subtotal > 100 ? 0 : 45
  const tax = subtotal * 0.0875
  const total = subtotal + shipping + tax

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-6">
      <h3 className="text-xl font-bold text-steel-blue mb-6">Order Summary</h3>
      <div className="space-y-3 mb-6">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Subtotal ({items.length} items)</span>
          <span className="font-medium">${subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Shipping</span>
          <span className="font-medium">{shipping === 0 ? "Free" : `$${shipping.toFixed(2)}`}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Tax (Est.)</span>
          <span className="font-medium">${tax.toFixed(2)}</span>
        </div>
        <div className="border-t border-gray-200 pt-3">
          <div className="flex justify-between">
            <span className="text-lg font-bold text-gray-900">Total</span>
            <span className="text-lg font-bold text-steel-blue">${total.toFixed(2)}</span>
          </div>
        </div>
      </div>
      <button
        type="button"
        onClick={onCheckout}
        className="w-full bg-steel-blue text-white py-3 px-6 rounded-lg hover:bg-opacity-90 font-semibold text-lg transition-colors"
      >
        Proceed to Checkout
      </button>
    </div>
  )
}

export default CartSummary
