"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { showToast } from "@/components/ui/Toast"
import { useCartStore } from "@/stores/cartStore"
import { useSelectedSupplierStore } from "@/stores/selectedSupplierStore"
import { usePurchaseCalculator } from "../hooks/usePurchaseCalculator"
import BulkPricingGrid from "./purchase/BulkPricingGrid"
import OrderSummaryCard from "./purchase/OrderSummaryCard"
import PurchaseActions from "./purchase/PurchaseActions"
import QuantitySelector from "./purchase/QuantitySelector"
import WarrantyOptions from "./purchase/WarrantyOptions"

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
  const router = useRouter()
  const addToCart = useCartStore((state) => state.addToCart)
  const selectedSupplier = useSelectedSupplierStore((state) => state.selectedSupplier)
  const stockCount = selectedSupplier?.stockCount ?? 15
  const [isAddingToCart, setIsAddingToCart] = useState(false)

  const {
    quantity,
    setQuantity,
    selectedWarranty,
    setSelectedWarranty,
    activeTier,
    unitPrice,
    warrantyPrice,
    shippingPrice,
    productTotal,
    subtotal,
    tax,
    total,
  } = usePurchaseCalculator({
    bulkPricing,
    warrantyOptions,
    orderSummary,
    selectedSupplierPrice: selectedSupplier?.price,
    stockCount,
  })

  const handleAddToCart = async () => {
    const userProductId = selectedSupplier?.userProductId
    if (!userProductId) {
      console.error("No userProductId found for the selected supplier")
      return
    }
    setIsAddingToCart(true)
    try {
      await addToCart(userProductId, quantity)
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status
      if (status === 403) {
        showToast.error("Please log in to add items to cart.")
        router.push("/login")
        return
      }
      showToast.error("Failed to add to cart. Please try again.")
    } finally {
      setIsAddingToCart(false)
    }
  }

  const handleQuantityChange = (value: number) => {
    const maxCount = stockCount || 1
    setQuantity(Math.min(maxCount, Math.max(1, value)))
  }

  return (
    <section id="purchase-section" className="bg-white py-12 border-t border-gray-200">
      <div className="app-container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-light-mint-gray rounded-2xl p-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <h2 className="text-2xl font-bold text-steel-blue mb-6">Purchase Options</h2>

              <div className="space-y-6">
                <QuantitySelector
                  quantity={quantity}
                  stockCount={stockCount}
                  onQuantityChange={handleQuantityChange}
                  onIncrement={() => handleQuantityChange(quantity + 1)}
                  onDecrement={() => handleQuantityChange(quantity - 1)}
                />

                <BulkPricingGrid options={bulkPricing} activeOptionId={activeTier?.id} />

                <WarrantyOptions
                  options={warrantyOptions}
                  selectedValue={selectedWarranty}
                  onChange={setSelectedWarranty}
                />
              </div>
            </div>

            <div>
              <OrderSummaryCard
                orderSummary={orderSummary}
                quantity={quantity}
                unitPrice={unitPrice}
                productTotal={productTotal}
                warrantyPrice={warrantyPrice}
                shippingPrice={shippingPrice}
                subtotal={subtotal}
                tax={tax}
                total={total}
              />
              <PurchaseActions
                onAddToCart={handleAddToCart}
                isAddingToCart={isAddingToCart}
                stockCount={stockCount}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default PurchaseOptions
