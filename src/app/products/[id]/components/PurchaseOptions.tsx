"use client"

import { Bolt, FileText, Minus, Plus, ShieldCheck, ShoppingCart } from "lucide-react"
import { useParams } from "next/navigation"
import { useState } from "react"
import { useCartStore } from "@/stores/cartStore"

interface BulkPricing {
  id: number
  range: string
  price: string
  note: string
  selected: boolean
}

interface WarrantyOption {
  id: number
  value: string
  title: string
  description: string
  price: string
  selected: boolean
}

interface OrderSummary {
  product: string
  productPrice: string
  warranty: string
  shipping: string
  subtotal: string
  tax: string
  total: string
}

interface PurchaseOptionsProps {
  bulkPricing: BulkPricing[]
  warrantyOptions: WarrantyOption[]
  orderSummary: OrderSummary
}

const PurchaseOptions = ({ bulkPricing, warrantyOptions, orderSummary }: PurchaseOptionsProps) => {
  const [quantity, setQuantity] = useState(1)
  const params = useParams()
  const productId = params?.id as string
  const addToCart = useCartStore((state) => state.addToCart)
  const defaultSelectedBulk = bulkPricing.find((p) => p.selected)?.id || bulkPricing[0]?.id || 1
  const defaultSelectedWarranty =
    warrantyOptions.find((w) => w.selected)?.value || warrantyOptions[0]?.value || "standard"
  const [selectedBulkPricing, setSelectedBulkPricing] = useState(defaultSelectedBulk)
  const [selectedWarranty, setSelectedWarranty] = useState(defaultSelectedWarranty)
  const [isAddingToCart, setIsAddingToCart] = useState(false)

  const handleQuantityChange = (delta: number) => {
    setQuantity(Math.max(1, quantity + delta))
  }

  const handleAddToCart = () => {
    if (productId) {
      setIsAddingToCart(true)
      addToCart(productId, quantity)
      setTimeout(() => {
        setIsAddingToCart(false)
      }, 500)
    }
  }

  return (
    <section id="purchase-section" className="bg-white py-12 border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-light-mint-gray rounded-2xl p-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <h2 className="text-2xl font-bold text-steel-blue mb-6">Purchase Options</h2>

              {/* Quantity Selector */}
              <div className="space-y-6">
                <div>
                  <label htmlFor="quantity-input" className="block text-sm font-medium text-gray-700 mb-2">
                    Quantity
                  </label>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center border border-gray-300 rounded-lg">
                      <button
                        type="button"
                        onClick={() => handleQuantityChange(-1)}
                        className="px-4 py-2 text-gray-600 hover:text-steel-blue transition-colors"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <input
                        id="quantity-input"
                        type="number"
                        value={quantity}
                        min="1"
                        onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-20 px-4 py-2 text-center border-0 focus:outline-none focus:ring-2 focus:ring-steel-blue rounded"
                      />
                      <button
                        type="button"
                        onClick={() => handleQuantityChange(1)}
                        className="px-4 py-2 text-gray-600 hover:text-steel-blue transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <span className="text-gray-600">Units available: 15</span>
                  </div>
                </div>

                {/* Bulk Pricing */}
                <div>
                  <div className="block text-sm font-medium text-gray-700 mb-3">Bulk Pricing</div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {bulkPricing.map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => setSelectedBulkPricing(option.id)}
                        className={`bg-white border rounded-lg p-4 cursor-pointer transition-colors text-left ${
                          selectedBulkPricing === option.id
                            ? "border-2 border-steel-blue"
                            : "border-gray-200 hover:border-steel-blue"
                        }`}
                      >
                        <div className="text-center">
                          <div className="font-semibold text-steel-blue">{option.range}</div>
                          <div className="text-2xl font-bold text-gray-900">{option.price}</div>
                          <div
                            className={`text-sm ${option.note.includes("Save") ? "text-green-600 font-medium" : "text-gray-600"}`}
                          >
                            {option.note}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Warranty Options */}
                <div>
                  <div className="block text-sm font-medium text-gray-700 mb-3">Extended Warranty</div>
                  <div className="space-y-3">
                    {warrantyOptions.map((option) => (
                      <label
                        key={option.id}
                        htmlFor={`warranty-${option.id}`}
                        className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg hover:bg-gray-50"
                      >
                        <input
                          id={`warranty-${option.id}`}
                          type="radio"
                          name="warranty"
                          value={option.value}
                          checked={selectedWarranty === option.value}
                          onChange={(e) => setSelectedWarranty(e.target.value)}
                          className="text-steel-blue focus:ring-steel-blue"
                        />
                        <div className="flex-1">
                          <div className="font-medium">{option.title}</div>
                          <div className="text-sm text-gray-600">{option.description}</div>
                        </div>
                        <div className="font-semibold text-steel-blue">{option.price}</div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="bg-white rounded-xl p-6 h-fit">
              <h3 className="text-xl font-semibold text-steel-blue mb-4">Order Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">{orderSummary.product}</span>
                  <span className="font-semibold">{orderSummary.productPrice}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Extended Warranty</span>
                  <span className="font-semibold">{orderSummary.warranty}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span className="text-green-600 font-semibold">{orderSummary.shipping}</span>
                </div>
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-semibold">{orderSummary.subtotal}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax (Est.)</span>
                    <span className="font-semibold">{orderSummary.tax}</span>
                  </div>
                </div>
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between text-xl font-bold text-steel-blue">
                    <span>Total</span>
                    <span>{orderSummary.total}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={isAddingToCart}
                  className="w-full bg-steel-blue text-white py-3 px-6 rounded-lg hover:bg-opacity-90 font-semibold text-lg flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  {isAddingToCart ? "Adding..." : "Add to Cart"}
                </button>
                <button
                  type="button"
                  className="w-full bg-pale-lime text-steel-blue py-3 px-6 rounded-lg hover:bg-opacity-90 font-semibold flex items-center justify-center transition-colors"
                >
                  <Bolt className="w-5 h-5 mr-2" />
                  Buy Now
                </button>
                <button
                  type="button"
                  className="w-full border border-steel-blue text-steel-blue py-2 px-6 rounded-lg hover:bg-steel-blue hover:text-white transition-colors flex items-center justify-center"
                >
                  <FileText className="w-5 h-5 mr-2" />
                  Request Quote
                </button>
              </div>

              <div className="mt-6 text-center">
                <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
                  <ShieldCheck className="w-4 h-4 text-green-500" />
                  <span>Secure Checkout</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default PurchaseOptions
