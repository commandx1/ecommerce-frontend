"use client"

import ProductImageWithFallback from "@/features/products/listing/components/ProductImageWithFallback"
import type { SupplierViewModel } from "../types"
import { getStockColorClass } from "../utils/stockStyles"
import StarRating from "./StarRating"

interface SupplierComparisonRowProps {
  supplier: SupplierViewModel
  isBestSeller: boolean
  isSelected: boolean
  onSelect: (supplier: SupplierViewModel) => void
}

const SupplierComparisonRow = ({ supplier, isBestSeller, isSelected, onSelect }: SupplierComparisonRowProps) => {
  const hasDiscount = supplier.discount > 0
  const formattedDiscount = Number.isInteger(supplier.discount) ? `${supplier.discount}` : supplier.discount.toFixed(1)

  return (
    <tr
      className={`cursor-pointer text-text-primary transition-colors ${
        isSelected ? "bg-accent/80 shadow-[inset_4px_0_0_0_var(--brand)]" : "hover:bg-surface-muted/70"
      }`}
      onClick={() => onSelect(supplier)}
    >
      <td className="px-6 py-4">
        <div className="flex items-center justify-center space-x-4">
          {supplier.logo && (
            <div className="relative flex h-12 w-12 items-center justify-center rounded-xl border border-border-soft bg-surface-muted">
              <ProductImageWithFallback
                src={supplier.logo}
                alt={supplier.alt}
                fill
                sizes="48px"
                className="object-contain"
              />
            </div>
          )}
          <div>
            <div className="flex items-center space-x-2">
              <div className="font-semibold text-text-primary">{supplier.name}</div>
              {isBestSeller && (
                <span className="whitespace-nowrap rounded-full bg-warning/14 px-2 py-0.5 text-xs font-semibold text-warning">
                  Best Seller
                </span>
              )}
            </div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 text-center">
        <div className="text-2xl font-bold text-brand">{supplier.price}</div>
        {supplier.originalPrice && <div className="text-sm text-text-muted line-through">{supplier.originalPrice}</div>}
        {hasDiscount ? (
          <div className="mt-1 inline-flex rounded-full bg-success/15 px-2.5 py-1 text-xs font-semibold text-success">
            Save {formattedDiscount}%
          </div>
        ) : null}
      </td>
      <td className="px-6 py-4 text-center">
        <span
          className={`${getStockColorClass(supplier.stockColor)} truncate rounded-full px-3 py-1 text-sm font-medium`}
        >
          {supplier.stock}
        </span>
      </td>
      <td className="px-6 py-4 text-center">
        <div className="text-sm font-medium text-text-primary">{supplier.shipping}</div>
      </td>
      <td className="px-6 py-4">
        <div className="flex flex-col items-center justify-center">
          <div className="text-sm font-medium text-text-primary">{supplier.distance || "-"}</div>
          <div className="text-xs text-text-muted">{supplier.distanceTime || "-"}</div>
        </div>
      </td>
      <td className="px-6 py-4 text-center">
        {supplier.reviewCount > 0 ? (
          <div className="flex items-center justify-center space-x-1">
            <StarRating rating={supplier.rating} size="sm" className="text-yellow-400" />
            <span className="text-sm text-text-secondary">
              {supplier.rating.toFixed(1)} ({supplier.reviewCount})
            </span>
          </div>
        ) : (
          <span className="text-sm text-text-muted">No reviews yet</span>
        )}
      </td>
      <td className="px-6 py-4 text-center">
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            onSelect(supplier)
          }}
          className={`rounded-full px-6 py-2 font-medium transition-colors ${
            isSelected
              ? "bg-accent-strong text-accent-foreground"
              : "bg-brand text-primary-foreground hover:bg-brand-strong"
          }`}
        >
          {isSelected ? "Selected" : "Select"}
        </button>
      </td>
    </tr>
  )
}

export default SupplierComparisonRow
