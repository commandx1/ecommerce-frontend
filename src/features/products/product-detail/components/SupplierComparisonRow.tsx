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
  return (
    <tr
      className={`hover:bg-gray-50 transition-colors cursor-pointer ${
        isSelected
          ? "bg-blue-50 border-l-4 border-blue-500"
          : isBestSeller
            ? "bg-yellow-50 border-l-4 border-yellow-400"
            : ""
      }`}
      onClick={() => onSelect(supplier)}
    >
      <td className="px-6 py-4">
        <div className="flex items-center space-x-4">
          {supplier.logo && (
            <div className="relative w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center">
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
              <div className="font-semibold text-steel-blue">{supplier.name}</div>
              {isBestSeller && (
                <span className="whitespace-nowrap bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full text-xs font-semibold">
                  Best Seller
                </span>
              )}
            </div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 text-center">
        <div className="font-bold text-2xl text-steel-blue">{supplier.price}</div>
        {supplier.originalPrice && <div className="text-sm text-gray-500 line-through">{supplier.originalPrice}</div>}
      </td>
      <td className="px-6 py-4 text-center">
        <span
          className={`${getStockColorClass(supplier.stockColor)} px-3 py-1 rounded-full text-sm font-medium truncate`}
        >
          {supplier.stock}
        </span>
      </td>
      <td className="px-6 py-4 text-center">
        <div className="text-sm font-medium">{supplier.shipping}</div>
        <div className="text-xs text-gray-500">{supplier.shippingNote}</div>
      </td>
      <td className="px-6 py-4">
        <div className="flex flex-col items-center justify-center">
          <div className="text-sm font-medium">{supplier.distance || "-"}</div>
          <div className="text-xs text-gray-500">{supplier.distanceTime || "-"}</div>
        </div>
      </td>
      <td className="px-6 py-4 text-center">
        <div className="flex items-center justify-center space-x-1">
          <StarRating rating={supplier.starCount} size="sm" className="text-yellow-400" />
          <span className="text-sm text-gray-600">{supplier.rating}</span>
        </div>
      </td>
      <td className="px-6 py-4 text-center">
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            onSelect(supplier)
          }}
          className={`px-6 py-2 rounded-lg font-medium transition-colors ${
            isSelected ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-steel-blue text-white hover:bg-opacity-90"
          }`}
        >
          {isSelected ? "Selected" : "Select"}
        </button>
      </td>
    </tr>
  )
}

export default SupplierComparisonRow
