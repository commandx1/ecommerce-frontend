"use client"

import PageSectionContainer from "@/components/layout/PageSectionContainer"
import SectionHeading from "@/components/layout/SectionHeading"
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
    <PageSectionContainer as="section" className="bg-white py-12 border-t border-gray-200">
      <SectionHeading
        title="Compare Suppliers & Pricing"
        description="Multiple verified suppliers offer this product. Compare pricing, shipping, and terms to find the best deal."
        className="mb-8"
        descriptionClassName="mt-4"
      />

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
    </PageSectionContainer>
  )
}

export default SupplierComparison
