"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useMemo, useState } from "react"
import PageSectionContainer from "@/components/layout/PageSectionContainer"
import SurfaceCard from "@/components/ui/SurfaceCard"
import { showToast } from "@/components/ui/Toast"
import { extractErrorStatus, isAuthErrorStatus, isAuthHandledError } from "@/lib/api/auth-error"
import { useCartStore } from "@/stores/cartStore"
import { usePurchaseCalculator } from "../hooks/usePurchaseCalculator"
import type { SupplierViewModel } from "../types"
import BulkPricingGrid from "./purchase/BulkPricingGrid"
import OrderSummaryCard from "./purchase/OrderSummaryCard"
import PurchaseActions from "./purchase/PurchaseActions"
import QuantitySelector from "./purchase/QuantitySelector"
// import WarrantyOptions from "./purchase/WarrantyOptions"

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
  suppliers: SupplierViewModel[]
  bestPriceVendorUserProductId?: string | null
}

const PurchaseOptions = ({
  bulkPricing,
  warrantyOptions,
  orderSummary,
  suppliers,
  bestPriceVendorUserProductId,
}: PurchaseOptionsProps) => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const addToCart = useCartStore((state) => state.addToCart)
  const selectedVendorId = searchParams.get("vendorId")
  const selectedSupplier = useMemo(() => {
    if (selectedVendorId) {
      const supplierFromUrl = suppliers.find((supplier) => supplier.userProductId === selectedVendorId)
      if (supplierFromUrl) {
        return supplierFromUrl
      }
    }

    return suppliers.find((supplier) => supplier.userProductId === bestPriceVendorUserProductId) || suppliers[0] || null
  }, [bestPriceVendorUserProductId, selectedVendorId, suppliers])
  const stockCount = selectedSupplier?.stockCount ?? 15
  const [isAddingToCart, setIsAddingToCart] = useState(false)
  const orderSummaryWithSelectedShipping = useMemo(
    () => ({
      ...orderSummary,
      shipping: selectedSupplier?.shipping ?? orderSummary.shipping,
    }),
    [orderSummary, selectedSupplier?.shipping],
  )

  const {
    quantity,
    setQuantity,
    // selectedWarranty,
    // setSelectedWarranty,
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
    orderSummary: orderSummaryWithSelectedShipping,
    selectedSupplierPrice: selectedSupplier?.price,
    stockCount,
  })

  const handleAddToCart = async () => {
    const userProductId = selectedSupplier?.userProductId
    if (!userProductId) {
      showToast.error("Selected supplier is unavailable right now. Please choose another supplier.")
      return
    }
    setIsAddingToCart(true)
    try {
      await addToCart(userProductId, quantity)
    } catch (err: unknown) {
      if (isAuthHandledError(err)) {
        return
      }

      const status = extractErrorStatus(err)
      if (isAuthErrorStatus(status)) {
        showToast.error("Authentication required", "Please sign in to add items to cart.")
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
    <section className="border-t border-border-soft/70 bg-surface-muted/35 py-14">
      <PageSectionContainer as="div">
        <SurfaceCard variant="editorial" className="p-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="section-kicker mb-4">Commercial terms</div>
              <h2 className="mb-6 text-3xl font-semibold text-text-primary">Purchase Options</h2>

              <div className="space-y-6">
                <QuantitySelector
                  quantity={quantity}
                  stockCount={stockCount}
                  onQuantityChange={handleQuantityChange}
                  onIncrement={() => handleQuantityChange(quantity + 1)}
                  onDecrement={() => handleQuantityChange(quantity - 1)}
                />

                <BulkPricingGrid options={bulkPricing} activeOptionId={activeTier?.id} />

                {/* <WarrantyOptions
                  options={warrantyOptions}
                  selectedValue={selectedWarranty}
                  onChange={setSelectedWarranty}
                /> */}
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
              <PurchaseActions onAddToCart={handleAddToCart} isAddingToCart={isAddingToCart} stockCount={stockCount} />
            </div>
          </div>
        </SurfaceCard>
      </PageSectionContainer>
    </section>
  )
}

export default PurchaseOptions
