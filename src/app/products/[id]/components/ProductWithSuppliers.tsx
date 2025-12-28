"use client"

import { useState, useEffect } from "react"
import { useSelectedSupplierStore } from "@/stores/selectedSupplierStore"
import ProductHero from "./ProductHero"
import SupplierComparison from "./SupplierComparison"

interface Supplier {
  id: number
  userProductId?: string
  name: string
  logo: string
  alt: string
  badge: string
  price: string
  originalPrice: string | null
  stock: string
  stockColor: string
  stockCount: number
  shipping: string
  shippingNote: string
  distance: string
  distanceTime: string
  rating: number
  starCount: number
}

interface ProductData {
  title: string
  description: string
  category: string
  rating: number
  reviewCount: number
  sku: string
  features: string[]
  mainImage: string
  thumbnailImages: string[]
  badge?: string
  price?: number
  bestPriceVendor?: string
}

interface ProductWithSuppliersProps {
  product: ProductData
  suppliers: Supplier[]
  bestPriceVendorUserProductId?: string | null
}

export default function ProductWithSuppliers({
  product,
  suppliers,
  bestPriceVendorUserProductId,
}: ProductWithSuppliersProps) {
  // Find the best price vendor as default, or use the first supplier
  const defaultSupplier =
    suppliers.find((s) => s.userProductId === bestPriceVendorUserProductId) || suppliers[0] || null

  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(defaultSupplier)
  const setGlobalSelectedSupplier = useSelectedSupplierStore((state) => state.setSelectedSupplier)

  // Update global store when local state changes
  useEffect(() => {
    setGlobalSelectedSupplier(selectedSupplier)
  }, [selectedSupplier, setGlobalSelectedSupplier])

  // Initialize global store on mount
  useEffect(() => {
    setGlobalSelectedSupplier(defaultSupplier)
  }, [defaultSupplier, setGlobalSelectedSupplier])

  // Extract price from string (e.g., "$289" -> 289)
  const parsePrice = (priceString: string): number => {
    return Number.parseFloat(priceString.replace(/[$,]/g, "")) || 0
  }

  return (
    <>
      <ProductHero
        product={{
          ...product,
          bestPriceVendor: selectedSupplier?.name || "",
          price: selectedSupplier ? parsePrice(selectedSupplier.price) : 0,
        }}
        selectedSupplier={selectedSupplier}
      />
      <SupplierComparison
        suppliers={suppliers}
        bestPriceVendorUserProductId={bestPriceVendorUserProductId}
        selectedSupplierId={selectedSupplier?.id}
        onSelectSupplier={(supplier) => setSelectedSupplier(supplier)}
      />
    </>
  )
}
