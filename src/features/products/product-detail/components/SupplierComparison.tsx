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
    <PageSectionContainer as="section" className="border-t border-border-soft/70 bg-canvas py-14">
      <SectionHeading
        title="Compare Suppliers & Pricing"
        description="Multiple verified suppliers offer this product. Compare pricing, shipping, and terms to find the best deal."
        className="mb-8"
        descriptionClassName="mt-4"
        variant="technical"
      />

      <div className="overflow-hidden rounded-[1.75rem] border border-border-soft bg-surface-elevated shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-brand text-inverse-foreground dark:bg-brand-surface">
              <tr>
                <th className="px-6 py-4 text-center text-sm font-semibold tracking-[0.08em] text-inverse-foreground uppercase">
                  Supplier
                </th>
                <th className="px-6 py-4 text-center text-sm font-semibold tracking-[0.08em] text-inverse-foreground uppercase">
                  Price
                </th>
                <th className="px-6 py-4 text-center text-sm font-semibold tracking-[0.08em] text-inverse-foreground uppercase">
                  Stock
                </th>
                {/* <th className="px-6 py-4 text-center text-sm font-semibold tracking-[0.08em] text-inverse-foreground uppercase">
                  Shipping
                </th> */}
                <th className="px-6 py-4 text-center text-sm font-semibold tracking-[0.08em] text-inverse-foreground uppercase">
                  Distance
                </th>
                <th className="px-6 py-4 text-center text-sm font-semibold tracking-[0.08em] text-inverse-foreground uppercase">
                  Rating
                </th>
                <th className="px-6 py-4 text-center text-sm font-semibold tracking-[0.08em] text-inverse-foreground uppercase">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-soft bg-surface-elevated">
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
