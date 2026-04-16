"use client"

import { useSupplierSelection } from "../hooks/useSupplierSelection"
import type { ProductHeroViewModel, SupplierViewModel } from "../types"
import ProductHero from "./ProductHero"
import SupplierComparison from "./SupplierComparison"

interface ProductWithSuppliersProps {
  product: ProductHeroViewModel
  suppliers: SupplierViewModel[]
  bestPriceVendorUserProductId?: string | null
}

export default function ProductWithSuppliers({
  product,
  suppliers,
  bestPriceVendorUserProductId,
}: ProductWithSuppliersProps) {
  const { selectedSupplier, setSelectedSupplier, selectedPrice } = useSupplierSelection(suppliers, bestPriceVendorUserProductId)

  return (
    <>
      <ProductHero
        product={{
          ...product,
          bestPriceVendor: selectedSupplier?.name || "",
          price: selectedPrice,
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
