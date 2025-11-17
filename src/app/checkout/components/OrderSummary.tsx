"use client"

import { Award, HeadphonesIcon, Lock, Truck } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import productsData from "@/data/products.json"
import { useCartStore } from "@/stores/cartStore"
import { useCheckoutStore } from "@/stores/checkoutStore"

const OrderSummary = () => {
  const router = useRouter()
  const { items } = useCartStore()
  const { shippingAddress, applyTaxExemption, currentStep } = useCheckoutStore()

  const subtotal = items.reduce((sum, item) => {
    const product = productsData.find((p) => p.id === item.productId)
    if (!product) return sum
    const price = parseFloat(product.price.replace("$", "").replace(",", ""))
    return sum + price * item.quantity
  }, 0)

  const volumeDiscount = subtotal > 2000 ? subtotal * 0.05 : 0
  const shipping = subtotal > 100 ? 0 : 45
  const tax = subtotal * 0.0875
  const taxExemption = applyTaxExemption ? tax : 0
  const total = subtotal - volumeDiscount + shipping + tax - taxExemption

  if (currentStep === 5) {
    return null
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-40">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-steel-blue">Order Summary</h3>
        <button
          type="button"
          onClick={() => router.push("/cart")}
          className="text-steel-blue hover:underline text-sm font-medium"
        >
          Edit Cart
        </button>
      </div>

      {/* Order Items */}
      <div className="space-y-4 mb-6">
        {items.map((item) => {
          const product = productsData.find((p) => p.id === item.productId)
          if (!product) return null

          const itemPrice = parseFloat(product.price.replace("$", "").replace(",", ""))
          const totalPrice = itemPrice * item.quantity

          return (
            <div key={item.id} className="flex items-center space-x-4 p-4 bg-light-mint-gray rounded-lg">
              <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center shrink-0">
                <Image
                  src={product.mainImage}
                  alt={product.alt}
                  width={64}
                  height={64}
                  className="w-12 h-12 object-contain"
                />
              </div>
              <div className="flex-1 min-w-0">
                <Link href={`/products/${item.productId}`}>
                  <h4 className="font-medium text-gray-900 text-sm hover:text-steel-blue">{product.title}</h4>
                </Link>
                <p className="text-xs text-gray-600">
                  {typeof product.description === "string"
                    ? product.description.slice(0, 50)
                    : product.description?.paragraphs?.[0]?.slice(0, 50) || product.longDescription?.slice(0, 50) || ""}
                  ...
                </p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-gray-500">Qty: {item.quantity}</span>
                  <span className="font-semibold text-steel-blue">${totalPrice.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Shipping Information */}
      {currentStep >= 2 && (
        <div className="mb-6 p-4 bg-light-mint-gray rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Shipping to:</span>
            {currentStep === 2 && (
              <button
                type="button"
                className="text-steel-blue hover:underline text-xs"
                onClick={() => router.push("/checkout")}
              >
                Change
              </button>
            )}
          </div>
          <div className="text-sm text-gray-600">
            <div className="font-medium">{shippingAddress.company}</div>
            <div>{shippingAddress.street}</div>
            <div>
              {shippingAddress.city}, {shippingAddress.state} {shippingAddress.zipCode}
            </div>
          </div>
          <div className="mt-3 flex items-center text-sm">
            <Truck className="w-4 h-4 text-steel-blue mr-2" />
            <span className="text-gray-700">Express Delivery - 2-3 business days</span>
          </div>
        </div>
      )}

      {/* Order Totals */}
      <div className="space-y-3 mb-6">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Subtotal ({items.length} items)</span>
          <span className="font-medium">${subtotal.toFixed(2)}</span>
        </div>
        {volumeDiscount > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Volume discount (5%)</span>
            <span className="font-medium text-green-600">-${volumeDiscount.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Shipping</span>
          <span className="font-medium">{shipping === 0 ? "Free" : `$${shipping.toFixed(2)}`}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Tax (CA 8.75%)</span>
          <span className="font-medium">${tax.toFixed(2)}</span>
        </div>
        {taxExemption > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Tax exemption applied</span>
            <span className="font-medium text-green-600">-${taxExemption.toFixed(2)}</span>
          </div>
        )}
        <div className="border-t border-gray-200 pt-3">
          <div className="flex justify-between">
            <span className="text-lg font-bold text-gray-900">Total</span>
            <span className="text-lg font-bold text-steel-blue">${total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Payment Security Badges */}
      <div className="space-y-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <Lock className="w-4 h-4 text-green-600 mr-2" />
            <span className="text-sm font-medium text-green-800">Secure Payment</span>
          </div>
          <p className="text-xs text-green-700">
            Your payment information is encrypted and secure. We use industry-standard SSL protection.
          </p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <Award className="w-4 h-4 text-blue-600 mr-2" />
            <span className="text-sm font-medium text-blue-800">Satisfaction Guarantee</span>
          </div>
          <p className="text-xs text-blue-700">
            30-day return policy on unopened items. Professional-grade quality guaranteed.
          </p>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <HeadphonesIcon className="w-4 h-4 text-purple-600 mr-2" />
            <span className="text-sm font-medium text-purple-800">Expert Support</span>
          </div>
          <p className="text-xs text-purple-700">
            Dedicated account manager and 24/7 technical support for all equipment purchases.
          </p>
        </div>
      </div>
    </div>
  )
}

export default OrderSummary
