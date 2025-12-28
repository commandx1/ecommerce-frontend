"use client"

import { Bolt, FileText, Minus, Plus, ShieldCheck, ShoppingCart } from "lucide-react"
import { useParams } from "next/navigation"
import { useState, useEffect } from "react"
import { useCartStore } from "@/stores/cartStore"
import { useSelectedSupplierStore } from "@/stores/selectedSupplierStore"
import formatCurrency from "@/lib/helpers/formatCurrency"

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
  const selectedSupplier = useSelectedSupplierStore((state) => state.selectedSupplier)
  const stockCount = selectedSupplier?.stockCount ?? 15 // Fallback to 15 if not available

  useEffect(() => {
    if (quantity > stockCount) {
      setQuantity(stockCount || 1)
    }
  }, [stockCount, quantity])

  // Helper to parse price string like "$289.00" to number
  const parsePrice = (priceString: string): number => {
    if (!priceString) return 0
    return Number.parseFloat(priceString.replace(/[$,]/g, "")) || 0
  }

  // Find which bulk pricing tier applies to the current quantity
  const getApplicableBulkPricing = () => {
    // Sort tiers by minimum quantity in descending order to find the highest matching tier
    const sortedBulk = [...bulkPricing].sort((a, b) => {
      const getMin = (range: string) => parseInt(range.split("-")[0].replace(/\+/g, "")) || 0
      return getMin(b.range) - getMin(a.range)
    })

    for (const tier of sortedBulk) {
      const range = tier.range.toLowerCase()
      if (range.includes("+")) {
        const min = parseInt(range.replace(/\+/g, ""))
        if (quantity >= min) return tier
      } else if (range.includes("-")) {
        const [min, max] = range.split("-").map((s) => parseInt(s))
        if (quantity >= min && quantity <= max) return tier
      } else if (range.includes("1 unit")) {
        if (quantity === 1) return tier
      }
    }
    return bulkPricing.find((p) => p.selected) || bulkPricing[0]
  }

  const activeTier = getApplicableBulkPricing()
  const selectedBulkPricing = activeTier?.id
  const unitPrice = activeTier
    ? parsePrice(activeTier.price)
    : selectedSupplier
      ? parsePrice(selectedSupplier.price)
      : parsePrice(orderSummary.productPrice)

  const defaultSelectedWarranty =
    warrantyOptions.find((w) => w.selected)?.value || warrantyOptions[0]?.value || "standard"
  const [selectedWarranty, setSelectedWarranty] = useState(defaultSelectedWarranty)
  const [isAddingToCart, setIsAddingToCart] = useState(false)

  const warrantyPrice = parsePrice(
    warrantyOptions.find((w) => w.value === selectedWarranty)?.price || orderSummary.warranty,
  )
  const shippingPrice = parsePrice(orderSummary.shipping)

  const productTotal = unitPrice * quantity
  const subtotal = productTotal + warrantyPrice
  const tax = subtotal * 0.1 // Let's assume 10% tax for realism, or keep it 0 if you prefer
  const total = subtotal + shippingPrice + tax

  const handleQuantityChange = (delta: number) => {
    const newQuantity = quantity + delta
    if (newQuantity >= 1 && newQuantity <= stockCount) {
      setQuantity(newQuantity)
    }
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
                        className="px-4 py-2 text-gray-600 hover:text-steel-blue transition-colors disabled:opacity-30"
                        disabled={quantity <= 1}
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <input
                        id="quantity-input"
                        type="number"
                        value={quantity}
                        min="1"
                        max={stockCount}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 1
                          setQuantity(Math.min(stockCount, Math.max(1, val)))
                        }}
                        className="appearance-none w-20 px-4 py-2 text-center bg-white border-0 focus:outline-none focus:ring-2 focus:ring-steel-blue rounded"
                      />
                      <button
                        type="button"
                        onClick={() => handleQuantityChange(1)}
                        className="px-4 py-2 text-gray-600 hover:text-steel-blue transition-colors disabled:opacity-30"
                        disabled={quantity >= stockCount}
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <span className="text-gray-600">Units available: {stockCount}</span>
                  </div>
                </div>

                {/* Bulk Pricing */}
                <div>
                  <div className="block text-sm font-medium text-gray-700 mb-3">Bulk Pricing</div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {bulkPricing.map((option) => (
                      <div
                        key={option.id}
                        className={`bg-white border rounded-lg p-4 transition-colors text-left ${
                          selectedBulkPricing === option.id
                            ? "border-2 border-steel-blue ring-1 ring-steel-blue"
                            : "border-gray-200 opacity-60"
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
                      </div>
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
                <div className="space-y-2 border-b border-gray-100 pb-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 text-sm">Unit Price</span>
                    <span className="font-medium text-gray-900">{formatCurrency(unitPrice)}</span>
                  </div>
                  <div className="flex justify-between gap-8">
                    <span className="text-gray-600">
                      {orderSummary.product}{" "}
                      <span className="whitespace-nowrap font-medium text-gray-400 text-sm">x {quantity}</span>
                    </span>
                    <span className="font-bold text-steel-blue">{formatCurrency(productTotal)}</span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Extended Warranty</span>
                  <span className="font-semibold">{formatCurrency(warrantyPrice)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span className="text-green-600 font-semibold">
                    {shippingPrice === 0 ? "Free" : formatCurrency(shippingPrice)}
                  </span>
                </div>
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-semibold">{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax (Est.)</span>
                    <span className="font-semibold">{formatCurrency(tax)}</span>
                  </div>
                </div>
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between text-xl font-bold text-steel-blue">
                    <span>Total</span>
                    <span>{formatCurrency(total)}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={isAddingToCart || stockCount <= 0}
                  className="w-full bg-steel-blue text-white py-3 px-6 rounded-lg hover:bg-opacity-90 font-semibold text-lg flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  {isAddingToCart ? "Adding..." : stockCount <= 0 ? "Out of Stock" : "Add to Cart"}
                </button>
                <button
                  type="button"
                  disabled={stockCount <= 0}
                  className="w-full bg-pale-lime text-steel-blue py-3 px-6 rounded-lg hover:bg-opacity-90 font-semibold flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
