"use client"

import { useSupplierSelection } from "../hooks/useSupplierSelection"
import type { ProductHeroViewModel, SupplierViewModel } from "../types"
import ProductHero from "./ProductHero"
import SupplierComparison from "./SupplierComparison"

interface ProductWithSuppliersProps {
  product: ProductHeroViewModel
  suppliers: SupplierViewModel[]
  bestPriceVendorUserProductId?: string | null
  // A slot, not a `specifications` prop: the specs section is a Server Component and the supplier
  // table it sits above lives inside this client boundary. Passing it as a rendered node keeps it
  // off the client bundle.
  specificationsSlot?: React.ReactNode
}

export default function ProductWithSuppliers({
  product,
  suppliers,
  bestPriceVendorUserProductId,
  specificationsSlot,
}: ProductWithSuppliersProps) {
  const { selectedSupplier, setSelectedSupplier, selectedPrice } = useSupplierSelection(
    suppliers,
    bestPriceVendorUserProductId,
  )

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
      {specificationsSlot}
      <SupplierComparison
        suppliers={suppliers}
        bestPriceVendorUserProductId={bestPriceVendorUserProductId}
        selectedSupplierId={selectedSupplier?.id}
        onSelectSupplier={(supplier) => setSelectedSupplier(supplier)}
      />
    </>
  )
}
