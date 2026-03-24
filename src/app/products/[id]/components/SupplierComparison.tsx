"use client"

import type { SupplierViewModel } from "../types"
import SupplierComparisonRow from "./SupplierComparisonRow"

interface SupplierComparisonProps {
  suppliers: SupplierViewModel[]
  bestPriceVendorUserProductId?: string | null
  selectedSupplierId?: number
  onSelectSupplier?: (supplier: SupplierViewModel) => void
}

const SupplierComparison = ({
  suppliers,
  bestPriceVendorUserProductId,
  selectedSupplierId,
  onSelectSupplier,
}: SupplierComparisonProps) => {
  const handleSelectSupplier = (supplier: SupplierViewModel) => {
    if (onSelectSupplier) {
      onSelectSupplier(supplier)
      // Scroll to top to see the updated product info
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  return (
    <section id="supplier-comparison" className="bg-white py-12 border-t border-gray-200">
      <div className="app-container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-steel-blue mb-4">Compare Suppliers & Pricing</h2>
          <p className="text-gray-600">
            Multiple verified suppliers offer this product. Compare pricing, shipping, and terms to find the best deal.
          </p>
        </div>

        <div className="bg-light-mint-gray rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-steel-blue text-white">
                <tr>
                  <th className="px-6 py-4 text-left font-semibold">Supplier</th>
                  <th className="px-6 py-4 text-center font-semibold">Price</th>
                  <th className="px-6 py-4 text-center font-semibold">Stock</th>
                  <th className="px-6 py-4 text-center font-semibold">Shipping</th>
                  <th className="px-6 py-4 text-center font-semibold">Distance</th>
                  <th className="px-6 py-4 text-center font-semibold">Rating</th>
                  <th className="px-6 py-4 text-center font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {suppliers.map((supplier) => {
                  const isBestSeller =
                    bestPriceVendorUserProductId && supplier.userProductId === bestPriceVendorUserProductId
                  const isSelected = selectedSupplierId === supplier.id
                  return (
                    <SupplierComparisonRow
                      key={supplier.id}
                      supplier={supplier}
                      isBestSeller={!!isBestSeller}
                      isSelected={isSelected}
                      onSelect={handleSelectSupplier}
                    />
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  )
}

export default SupplierComparison
